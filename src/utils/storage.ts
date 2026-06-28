// Chaves usadas no localStorage — centralizadas aqui para evitar typos
const STORAGE_KEY = "flowheart_sessions";
const USERNAME_KEY = "flowheart_username";

/**
 * Salva o array de sessões no localStorage.
 * Serializa como JSON formatado (indentação de 2 espaços)
 * para facilitar leitura futura ao migrar para backend.
 */
export function saveSessions(sessions: unknown[]) {
  const json = JSON.stringify(sessions, null, 2);
  localStorage.setItem(STORAGE_KEY, json);
}

/**
 * Carrega as sessões salvas no localStorage.
 * Retorna array vazio se não houver dados ou se o JSON estiver corrompido.
 * O try/catch evita crash caso o dado salvo seja inválido.
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

/**
 * Salva o nome do usuário no localStorage.
 * Chamado uma vez no onboarding ao confirmar o nome.
 */
export function saveUserName(name: string) {
  localStorage.setItem(USERNAME_KEY, name);
}

/**
 * Carrega o nome do usuário salvo no localStorage.
 * Retorna string vazia se não houver nome salvo —
 * nesse caso o app redireciona para o onboarding.
 */
export function loadUserName(): string {
  return localStorage.getItem(USERNAME_KEY) ?? "";
}

/**
 * Exporta todas as sessões como arquivo .json para download.
 * Não é exposto na UI — serve para migração futura ao backend.
 * 
 * Quando o backend estiver pronto, substitua o localStorage.setItem
 * em saveSessions() por um fetch POST para sua API,
 * mantendo essa função para backup manual.
 */
export function exportSessionsJson(sessions: unknown[]) {
  const json = JSON.stringify(sessions, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flowheart_backup_${Date.now()}.json`;
  a.click();
  // Libera a URL temporária da memória após o download
  URL.revokeObjectURL(url);
}