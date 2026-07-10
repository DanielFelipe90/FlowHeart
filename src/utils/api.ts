// ─── Configuração base da API ─────────────────────────────────────────────────

const API_URL = "http://localhost:8000";

// ─── Gerenciamento do token ───────────────────────────────────────────────────

/**
 * Salva o token JWT.
 * rememberMe=true → localStorage (persiste entre sessões)
 * rememberMe=false → sessionStorage (some ao fechar o browser)
 */
export function saveToken(token: string, rememberMe: boolean): void {
  if (rememberMe) {
    localStorage.setItem("flowheart_token", token);
    sessionStorage.removeItem("flowheart_token");
  } else {
    sessionStorage.setItem("flowheart_token", token);
    localStorage.removeItem("flowheart_token");
  }
}

/**
 * Carrega o token — verifica localStorage primeiro, depois sessionStorage.
 */
export function loadToken(): string | null {
  return (
    localStorage.getItem("flowheart_token") ??
    sessionStorage.getItem("flowheart_token") ??
    null
  );
}

/**
 * Remove o token de ambos os storages — usado no logout.
 */
export function clearToken(): void {
  localStorage.removeItem("flowheart_token");
  sessionStorage.removeItem("flowheart_token");
}

/**
 * Verifica se há token salvo.
 */
export function isAuthenticated(): boolean {
  return !!loadToken();
}

// ─── Fetch autenticado ────────────────────────────────────────────────────────

/**
 * Wrapper do fetch que adiciona o token JWT automaticamente.
 * Lança erro "UNAUTHORIZED" se o token expirar — App redireciona para login.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = loadToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearToken();
    throw new Error("UNAUTHORIZED");
  }

  return response;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiRegister(name: string, password: string): Promise<string> {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Erro ao registrar");
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
    const err = await res.json();
    throw new Error(err.detail ?? "Nome ou senha incorretos");
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

// ─── Sessões ──────────────────────────────────────────────────────────────────

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

// ─── Relatórios ─────────────────────────────────────────────────────────────
export async function apiDownloadReport(): Promise<void> {
  const token = loadToken();
  const res = await fetch("http://localhost:8000/reports/pdf", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) throw new Error("Erro ao gerar relatório");

  // Cria um link de download e clica automaticamente
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flowheart_relatorio.pdf";
  a.click();
  URL.revokeObjectURL(url);
}