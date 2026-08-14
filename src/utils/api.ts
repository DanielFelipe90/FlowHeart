export const API_URL =
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" && window.location.hostname === "10.0.2.2"
    ? "http://10.0.2.2:8000"
    : "http://localhost:8000");

let inMemoryToken: string | null = null;

export function saveToken(token: string, _rememberMe?: boolean): void {
  inMemoryToken = token;
  localStorage.removeItem("flowheart_token");
  sessionStorage.removeItem("flowheart_token");

  // Notifica o Android Native (WebView) se a ponte estiver presente
  if (typeof window !== "undefined" && (window as any).AndroidNative?.onTokenRefreshed) {
    (window as any).AndroidNative.onTokenRefreshed(token);
  }
}

export function loadToken(): string | null {
  return inMemoryToken;
}

export function clearToken(): void {
  inMemoryToken = null;
  localStorage.removeItem("flowheart_token");
  sessionStorage.removeItem("flowheart_token");
}

export function isAuthenticated(): boolean {
  return !!inMemoryToken;
}

export function initAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;

  try {
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    const tokenFromUrl = hashParams.get("token") || queryParams.get("token");

    if (tokenFromUrl) {
      saveToken(tokenFromUrl);
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, "", cleanUrl);
      return tokenFromUrl;
    }
  } catch (err) {
    console.error("Erro ao inicializar token da URL:", err);
  }

  return inMemoryToken;
}

export function notifyNativeUserAuthenticated(userId: string, name: string): void {
  if (typeof window !== "undefined" && (window as any).AndroidNative?.onUserAuthenticated) {
    (window as any).AndroidNative.onUserAuthenticated(userId, name);
  }
}

function notifySessionEnded() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("flowheart:unauthorized"));
  if ((window as any).AndroidNative?.onLogout) {
    (window as any).AndroidNative.onLogout();
  }
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = loadToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    const hadToken = !!loadToken();
    clearToken();
    if (hadToken) {
      notifySessionEnded();
    }
    throw new Error("UNAUTHORIZED");
  }

  return response;
}

export async function apiRegister(name: string, password: string): Promise<string> {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
  if (!res.ok) {
    const message = await res.json().then((e) => e.detail).catch(() => "Erro ao registrar");
    throw new Error(message);
  }
  const data = await res.json();
  return data.access_token;
}

export async function apiLogin(name: string, password: string): Promise<string> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
  if (!res.ok) {
    const message = await res.json().then((e) => e.detail).catch(() => "Nome ou senha incorretos");
    throw new Error(message);
  }
  const data = await res.json();
  return data.access_token;
}

export async function apiGetMe(): Promise<{ id: string; name: string }> {
  const res = await apiFetch("/auth/me");
  if (!res.ok) throw new Error("Erro ao buscar usuário");
  return res.json();
}

export async function apiDeleteAccount(): Promise<void> {
  const res = await apiFetch("/auth/account", { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao apagar conta");
}

export async function apiGetSessions(): Promise<unknown[]> {
  const res = await apiFetch("/sessions/");
  if (!res.ok) throw new Error("Erro ao buscar sessões");
  return res.json();
}

export async function apiCreateSession(session: unknown): Promise<unknown> {
  const res = await apiFetch("/sessions/", {
    method: "POST",
    body: JSON.stringify(session),
  });
  if (!res.ok) throw new Error("Erro ao salvar sessão");
  return res.json();
}

export async function apiDeleteSession(id: string): Promise<void> {
  const res = await apiFetch(`/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao apagar sessão");
}

export async function apiDownloadReport(userName: string): Promise<void> {
  const res = await apiFetch("/reports/pdf");
  if (res.status === 404) {
    throw new Error("Nenhum treino registrado para gerar o relatório.");
  }
  if (!res.ok) throw new Error("Erro ao gerar relatório");

  const blob = await res.blob();
  const fileName = `flowheart_${userName.toLowerCase()}_${Date.now()}.pdf`;

  // Dentro do WebView do app Kotlin, <a download> com blob: URL não dispara
  // nenhum download nativo — o WebView só aciona DownloadListener pra URLs
  // http(s) reais com Content-Disposition, não pra blob: gerado em runtime. Em
  // vez disso, manda o PDF em base64 pra ponte nativa salvar direto no
  // armazenamento do Android (ver AndroidNative.downloadFile no Kotlin).
  const isNativeApp =
    typeof window !== "undefined" && (window as any).mobileBpmBridge?.isNativeApp === true;

  if (isNativeApp && (window as any).AndroidNative?.downloadFile) {
    const base64 = await blobToBase64(blob);
    (window as any).AndroidNative.downloadFile(base64, fileName, "application/pdf");
    return;
  }

  // PWA no navegador: o fluxo padrão de blob URL + <a download> funciona normalmente.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** Converte um Blob em base64 puro (sem o prefixo "data:...;base64,"), pra
 * mandar pela ponte JS-nativa — JavascriptInterface do Android só troca tipos
 * simples (String, número, etc.), não Blob/ArrayBuffer. */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function apiLogout(): Promise<void> {
  const token = loadToken();
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      ...(token ? { body: JSON.stringify({ token }) } : {}),
    });
  } catch (error) {
    console.error("Erro ao notificar logout:", error);
  } finally {
    clearToken();
    if (typeof window !== "undefined" && (window as any).AndroidNative?.onLogout) {
      (window as any).AndroidNative.onLogout();
    }
  }
}