// ─── Chaves do localStorage ───────────────────────────────────────────────────

const USERNAME_KEY = "flowheart_username"; // último usuário logado
const REGISTERED_USERS_KEY = "flowheart_users"; // todos os usuários cadastrados

// ─── Usuários cadastrados ─────────────────────────────────────────────────────

interface StoredUser {
  name: string;
  password: string;
}

/**
 * Carrega todos os usuários cadastrados.
 */
function loadUsers(): StoredUser[] {
  const raw = localStorage.getItem(REGISTERED_USERS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

/**
 * Salva um novo usuário ou atualiza um existente.
 */
export function saveUser(name: string, password: string): void {
  const safeName = name.replace(/[^a-zA-ZÀ-ÿ\s]/g, "").trim();
  if (!safeName || password.length !== 6) return;

  const users = loadUsers();
  const index = users.findIndex((u) => u.name.toLowerCase() === safeName.toLowerCase());
  if (index >= 0) {
    users[index].password = password;
  } else {
    users.push({ name: safeName, password });
  }
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

/**
 * Verifica as credenciais de login.
 * Retorna o nome salvo se correto, null se inválido.
 */
export function validateLogin(name: string, password: string): string | null {
  const users = loadUsers();
  const user = users.find(
    (u) => u.name.toLowerCase() === name.toLowerCase().trim() && u.password === password
  );
  return user ? user.name : null;
}

/**
 * Verifica se já existe pelo menos um usuário cadastrado.
 */
export function isRegistered(): boolean {
  return loadUsers().length > 0;
}

// ─── Último usuário logado ────────────────────────────────────────────────────

export function saveUserName(name: string): void {
  localStorage.setItem(USERNAME_KEY, name);
}

export function loadUserName(): string {
  return localStorage.getItem(USERNAME_KEY) ?? "";
}

// ─── Sessões por usuário ──────────────────────────────────────────────────────

function getSessionKey(userName: string): string {
  return `flowheart_sessions_${userName.toLowerCase().trim()}`;
}

export function saveSessions(sessions: unknown[], userName: string): void {
  localStorage.setItem(getSessionKey(userName), JSON.stringify(sessions, null, 2));
}

export function loadSessions(userName: string): unknown[] {
  const raw = localStorage.getItem(getSessionKey(userName));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}