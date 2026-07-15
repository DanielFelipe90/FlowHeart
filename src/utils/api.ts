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
  // Carrega o token salvo (se houver) e adiciona no header Authorization
  const token = loadToken();

  // Faz a requisição para a API com o endpoint e opções fornecidas
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Se a resposta for 401 (não autorizado), limpa o token e lança erro para redirecionar para login
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
    // Tenta extrair a mensagem de erro do corpo da resposta
    const err = await res.json();
    throw new Error(err.detail ?? "Erro ao registrar");
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
    // Tenta extrair a mensagem de erro do corpo da resposta
    const err = await res.json();
    throw new Error(err.detail ?? "Nome ou senha incorretos");
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
  const token = loadToken();

  const res = await fetch(`${API_URL}/reports/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("UNAUTHORIZED");
  }

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
  // Carrega o token salvo (se houver) e envia para o backend para invalidar a sessão
  const token = loadToken();
  
  if (!token) return;

  try {
    await apiFetch("/auth/logout", { 
      method: "POST",
      // Garante que o corpo tenha a chave "token" exigida pelo schema
      body: JSON.stringify({ token: token }) 
    });
  } catch (error) {
    console.error("Erro ao notificar logout:", error);
  }
}