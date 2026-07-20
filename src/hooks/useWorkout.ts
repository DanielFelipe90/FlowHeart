import { useState, useCallback, useEffect } from "react";
import { saveUserName, loadUserName, clearUserName } from "../utils/storage";
import { apiGetSessions, apiCreateSession, apiDeleteSession, apiDeleteAccount, clearToken } from "../utils/api";
import type { WorkoutSession, PreState, DuringState, PostState } from "../types";
import { apiLogout } from "../utils/api";

/**
 * useWorkout — Hook central de lógica de negócio do FlowHeart
 *
 * Encapsula:
 * - Estados de sessões, nome do usuário e fases do treino
 * - Comunicação com a API (buscar, criar, apagar sessões)
 * - Ações: iniciar treino, salvar sessão, logout, apagar conta
 *
 * A navegação entre páginas é responsabilidade do App.tsx.
 */
export function useWorkout(enabled: boolean) {

  
  // ── Estado ────────────────────────────────────────────────────────────────
  
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [userName, setUserName] = useState<string>(() => loadUserName());
  const [loadingSession, setLoadingSession] = useState(false);

  // ── Carregar sessões da API ────────────────────────────────────────────────

  /**
   * Busca todas as sessões do usuário logado na API.
   * Chamada ao logar ou ao montar o componente com token válido.
   */
  const fetchSessions = useCallback(async () => {
    try {
      const data = await apiGetSessions();
      setSessions(data as WorkoutSession[]);
    } catch (err) {
      console.error("Erro ao buscar sessões:", err);
    }
  }, []);

  useEffect(() => {
     if (!enabled) return;
     fetchSessions();
  }, [enabled, fetchSessions]);
  // ── Estado temporário do treino em andamento ───────────────────────────────

  const [pre, setPre] = useState<PreState>({
    systolic: "", diastolic: "", bpm: "", ihb: false,
  });

  const [during, setDuring] = useState<DuringState>({
    systolic: "", diastolic: "", bpm: "", distance: "", timeSeconds: 0, speed: "",
  });

  const [post, setPost] = useState<PostState>({
    systolic: "", diastolic: "", bpm: "", ihb: false,
  });

  // ── Ações ──────────────────────────────────────────────────────────────────

  /**
   * Salva o nome do usuário no estado e localmente para exibição na UI.
   * Também busca as sessões da API após o login/registro.
   */
  async function handleSetUserName(name: string) {
    setUserName(name);
    saveUserName(name);
  }

  /**
   * Reseta todos os estados temporários do treino.
   */
  function startNewWorkout() {
    setPre({ systolic: "", diastolic: "", bpm: "", ihb: false });
    setDuring({ systolic: "", diastolic: "", bpm: "", distance: "", timeSeconds: 0, speed: "" });
    setPost({ systolic: "", diastolic: "", bpm: "", ihb: false });
  }

  /**
   * Finaliza o treino:
   * 1. Calcula velocidade média
   * 2. Formata a data/hora
   * 3. Envia para a API
   * 4. Atualiza o estado local
   */
  async function saveSession() {
    setLoadingSession(true);
    try {
      const hours = during.timeSeconds / 3600;
      const speed = hours > 0 && during.distance
        ? (parseFloat(during.distance) / hours).toFixed(1)
        : "0";

      const now = new Date();
      const date = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} — ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const sessionData = {
        date,
        pre,
        during: { ...during, speed },
        post,
      };

      const created = await apiCreateSession(sessionData);
      setSessions((s) => [...s, created as WorkoutSession]);
    } catch (err) {
      console.error("Erro ao salvar sessão:", err);
    } finally {
      setLoadingSession(false);
    }
  }

  /**
   * Apaga uma sessão específica via API e atualiza o estado local.
   */
  async function deleteSession(id: string) {
    try {
      await apiDeleteSession(id);
      setSessions((s) => s.filter((session) => session.id !== id));
    } catch (err) {
      console.error("Erro ao apagar sessão:", err);
    }
  }

  /**
   * Desloga o usuário — limpa token e estado local.
   */
  async function logout() {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Erro ao notificar logout ao servidor:", error);
    } finally {
      clearToken();
      clearUserName();
      setUserName("");
      setSessions([]);
    }
  }

  /**
   * Apaga a conta do usuário via API e desloga.
   */
  async function deleteAccount() {
    try {
      await apiDeleteAccount();
      logout();
    } catch (err) {
      console.error("Erro ao apagar conta:", err);
    }
  }

  return {
    sessions,
    userName,
    loadingSession,
    pre, setPre,
    during, setDuring,
    post, setPost,
    handleSetUserName,
    startNewWorkout,
    saveSession,
    deleteSession,
    logout,
    deleteAccount,
    fetchSessions,
  };
}