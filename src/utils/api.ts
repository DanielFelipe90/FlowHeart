// ─── Configuração base da API ─────────────────────────────────────────────────

export const API_URL =
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" && window.location.hostname === "10.0.2.2"
    ? "http://10.0.2.2:8000"
    : "http://localhost:8000");

// ─── Gerenciamento do token estritamente em memória (Segurança contra XSS) ───

let inMemoryToken: string | null = null;

export function saveToken(token: string, _rememberMe?: boolean): void {
  inMemoryToken = token;
  // Garante a remoção do localStorage/sessionStorage para proteção contra XSS
  localStorage.removeItem("flowheart_token");
  sessionStorage.removeItem("flowheart_token");
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

/**
 * Inicializa o token na memória a partir da URL (#token=... ou ?token=...)
 * Utilizado para o Single Sign-On (SSO) seguro vindo do App Kotlin (WebView).
 */
export function initAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;

  try {
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    const tokenFromUrl = hashParams.get("token") || queryParams.get("token");

    if (tokenFromUrl) {
      // Guarda ESTRITAMENTE na memória JS
      saveToken(tokenFromUrl);

      // Limpa imediatamente o token da URL para não ficar exposto no navegador/histórico
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, "", cleanUrl);
      return tokenFromUrl;
    }
  } catch (err) {
    console.error("Erro ao inicializar token da URL:", err);
  }

  return inMemoryToken;
}

// ─── Fetch autenticado ────────────────────────────────────────────────────────

/**
 * Wrapper do fetch que adiciona a opção credentials: "include" para enviar cookies HttpOnly
 * e inclui o header Authorization se o token estiver presente na memória.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = loadToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include", // Permite envio/recebimento de cookies HttpOnly entre domínios
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Se a resposta for 401 (não autorizado), limpa o token da memória
  if (response.status === 401) {
    clearToken();
    throw new Error("UNAUTHORIZED");
  }

  return response;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiRegister(name: string, password: string): Promise<string> {
  // Faz a requisição para registrar o usuário na API
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
  // Se a resposta não for OK, tenta extrair a mensagem de erro do corpo da resposta e lança um erro
  if (!res.ok) {
    const message = await res.json().then((e) => e.detail).catch(() => "Erro ao registrar");
    throw new Error(message);
  }
  // Se a resposta for OK, extrai o token do corpo da resposta e retorna
  const data = await res.json();
  return data.access_token;
}

// ────────────────────────────────────────────────────────────────────────────
// Funções de login, logout e gerenciamento de conta
export async function apiLogin(name: string, password: string): Promise<string> {
  // Faz a requisição para autenticar o usuário na API
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
  // Se a resposta não for OK, tenta extrair a mensagem de erro do corpo da resposta e lança um erro
  if (!res.ok) {
    const message = await res.json().then((e) => e.detail).catch(() => "Nome ou senha incorretos");
    throw new Error(message);
  }
  // Se a resposta for OK, extrai o token do corpo da resposta e retorna
  const data = await res.json();
  return data.access_token;
}

// ────────────────────────────────────────────────────────────────────────────
//  Funções para buscar informações do usuário e gerenciar a conta
export async function apiGetMe(): Promise<{ id: string; name: string }> {
  // Faz a requisição para buscar informações do usuário autenticado na API
  const res = await apiFetch("/auth/me");
  // Se a resposta não for OK, lança um erro indicando que houve um problema ao buscar o usuário
  if (!res.ok) throw new Error("Erro ao buscar usuário");
  // Se a resposta for OK, extrai os dados do usuário do corpo da resposta e retorna
  return res.json();
}

export async function apiDeleteAccount(): Promise<void> {
  // Faz a requisição para apagar a conta do usuário autenticado na API
  const res = await apiFetch("/auth/account", { method: "DELETE" });
  // Se a resposta não for OK, lança um erro indicando que houve um problema ao apagar a conta
  if (!res.ok) throw new Error("Erro ao apagar conta");
}

// ─── Sessões ──────────────────────────────────────────────────────────────────

// Funções para buscar, criar e apagar sessões de treino
export async function apiGetSessions(): Promise<unknown[]> {
  // Faz a requisição para buscar todas as sessões de treino do usuário autenticado na API
  const res = await apiFetch("/sessions/");
  // Se a resposta não for OK, lança um erro indicando que houve um problema ao buscar as sessões
  if (!res.ok) throw new Error("Erro ao buscar sessões");
  // Se a resposta for OK, extrai os dados das sessões do corpo da resposta e retorna
  return res.json();
}

// Função para criar uma nova sessão de treino
export async function apiCreateSession(session: unknown): Promise<unknown> {
  const res = await apiFetch("/sessions/", {
    method: "POST",
    body: JSON.stringify(session),
  });
  if (!res.ok) throw new Error("Erro ao salvar sessão");
  return res.json();
}

// Função para apagar uma sessão de treino pelo ID
export async function apiDeleteSession(id: string): Promise<void> {
  const res = await apiFetch(`/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao apagar sessão");
}

/**
 * Solicita ao backend a geração do PDF e faz o download automaticamente.
 * O PDF é gerado no servidor com WeasyPrint — mais seguro que no frontend.
 */
export async function apiDownloadReport(userName: string): Promise<void> {
  const res = await apiFetch("/reports/pdf");

  if (res.status === 404) {
    throw new Error("Nenhum treino registrado para gerar o relatório.");
  }

  if (!res.ok) throw new Error("Erro ao gerar relatório");

  // Cria link de download e clica automaticamente
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flowheart_${userName.toLowerCase()}_${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────────────────────────────────
// Função para notificar o backend sobre o logout do usuário
export async function apiLogout(): Promise<void> {
  // Não travamos mais na ausência de token em memória: o app depende do
  // cookie HttpOnly (que não é lido pelo JS), então inMemoryToken costuma
  // ser null mesmo com sessão válida. O backend já aceita o cookie como
  // fallback para autenticar e apagar a sessão em /auth/logout.
  const token = loadToken();

  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      // Só inclui body quando há token em memória. Sem token, não manda
      // corpo nenhum — assim o parâmetro `data: LogoutRequest = None` do
      // FastAPI cai no default None, em vez de tentar validar um objeto
      // vazio "{}" contra o schema (o que poderia falhar com 422 se
      // "token" for um campo obrigatório, impedindo o delete_cookie).
      ...(token ? { body: JSON.stringify({ token }) } : {}),
    });
  } catch (error) {
    console.error("Erro ao notificar logout:", error);
  }
}