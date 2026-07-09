// ─── Chaves do localStorage ───────────────────────────────────────────────────
// Mantido apenas para dados que ainda são locais.
// Sessões e usuários agora são gerenciados pela API.

const USERNAME_KEY = "flowheart_username";

// ─── Nome do usuário ──────────────────────────────────────────────────────────

/**
 * Salva o nome do usuário localmente para exibição na UI.
 * Não é usado para autenticação — o JWT cuida disso.
 */
export function saveUserName(name: string): void {
  localStorage.setItem(USERNAME_KEY, name);
}

/**
 * Carrega o nome do usuário salvo localmente.
 */
export function loadUserName(): string {
  return localStorage.getItem(USERNAME_KEY) ?? "";
}

/**
 * Remove o nome do usuário — chamado no logout.
 */
export function clearUserName(): void {
  localStorage.removeItem(USERNAME_KEY);
}