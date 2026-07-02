// ─── Chaves do localStorage ───────────────────────────────────────────────────
// Centralizadas aqui para evitar typos e facilitar migração futura para backend.
const STORAGE_KEY = "flowheart_sessions";
const USERNAME_KEY = "flowheart_username";
const PASSWORD_KEY = "flowheart_password";

// ─── Sessões ──────────────────────────────────────────────────────────────────

/**
 * Salva o array de sessões no localStorage como JSON formatado.
 * A indentação de 2 espaços facilita leitura ao migrar para backend.
 */
export function saveSessions(sessions: unknown[]) {
  const json = JSON.stringify(sessions, null, 2);
  localStorage.setItem(STORAGE_KEY, json);
}

/**
 * Carrega as sessões salvas no localStorage.
 * Retorna array vazio se não houver dados ou se o JSON estiver corrompido.
 */
export function loadSessions(): unknown[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ─── Nome do usuário ──────────────────────────────────────────────────────────

/**
 * Salva o nome do usuário no localStorage.
 * Chamado no registro ao confirmar o nome.
 */
export function saveUserName(name: string) {
  localStorage.setItem(USERNAME_KEY, name);
}

/**
 * Carrega o nome do usuário salvo.
 * Retorna string vazia se não houver nome cadastrado.
 */
export function loadUserName(): string {
  return localStorage.getItem(USERNAME_KEY) ?? "";
}

// ─── Senha ────────────────────────────────────────────────────────────────────

/**
 * Salva a senha no localStorage.
 * Futuramente substituir por hash (bcrypt) no backend —
 * nunca armazenar senha em texto puro em produção.
 */
export function savePassword(password: string) {
  localStorage.setItem(PASSWORD_KEY, password);
}

/**
 * Carrega a senha salva.
 * Retorna string vazia se não houver senha cadastrada.
 */
export function loadPassword(): string {
  return localStorage.getItem(PASSWORD_KEY) ?? "";
}

/**
 * Verifica se já existe um usuário cadastrado.
 * Usado no OnboardingPage para decidir se exibe o botão "Entrar".
 */
export function isRegistered(): boolean {
  return !!localStorage.getItem(USERNAME_KEY) && !!localStorage.getItem(PASSWORD_KEY);
}