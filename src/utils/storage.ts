// ─── Chaves do localStorage ───────────────────────────────────────────────────
// Centralizadas aqui para evitar typos e facilitar migração futura para backend.

const STORAGE_KEY = "flowheart_sessions";
const USERNAME_KEY = "flowheart_username";

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
 * Chamado uma vez no onboarding ao confirmar o nome.
 */
export function saveUserName(name: string) {
  localStorage.setItem(USERNAME_KEY, name);
}

/**
 * Carrega o nome do usuário salvo.
 * Retorna string vazia se não houver nome — app redireciona para onboarding.
 */
export function loadUserName(): string {
  return localStorage.getItem(USERNAME_KEY) ?? "";
}