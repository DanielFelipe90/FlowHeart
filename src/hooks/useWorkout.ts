import { useState, useEffect } from "react";
import {
  saveSessions,
  loadSessions,
  saveUserName,
  loadUserName,
} from "../utils/storage";
import type {
  WorkoutSession,
  PreState,
  DuringState,
  PostState,
} from "../types";

/**
 * useWorkout — Hook central de lógica de negócio do FlowHeart
 *
 * Encapsula:
 * - Estados de sessões, nome do usuário e fases do treino
 * - Persistência automática no localStorage por usuário
 * - Ações: iniciar treino, salvar sessão, atualizar nome, logout
 *
 * A navegação entre páginas é responsabilidade do App.tsx —
 * este hook não conhece rotas nem componentes de UI.
 */
export function useWorkout() {
  // ── Estado persistido ──────────────────────────────────────────────────

  /** Nome do usuário carregado do localStorage */
  const [userName, setUserName] = useState<string>(() => loadUserName());

  /**
   * Sessões carregadas do localStorage na inicialização.
   * Usa o nome do usuário como chave para separar dados entre usuários.
   */
  const [sessions, setSessions] = useState<WorkoutSession[]>(
    () => loadSessions(loadUserName()) as WorkoutSession[]
  );

  /**
   * Persiste as sessões no localStorage sempre que o array ou o usuário mudar.
   * Só salva se houver um usuário logado — evita salvar sessão vazia no logout.
   */
  useEffect(() => {
    if (userName) saveSessions(sessions, userName);
  }, [sessions, userName]);

  // ── Estado temporário do treino em andamento ───────────────────────────
  // Todos resetados em startNewWorkout() antes de cada nova sessão.

  const [pre, setPre] = useState<PreState>({
    systolic: "",
    diastolic: "",
    bpm: "",
    ihb: false,
  });

  const [during, setDuring] = useState<DuringState>({
    systolic: "",
    diastolic: "",
    bpm: "",
    distance: "",
    timeSeconds: 0,
    speed: "",
  });

  const [post, setPost] = useState<PostState>({
    systolic: "",
    diastolic: "",
    bpm: "",
    ihb: false,
  });

  // ── Ações ──────────────────────────────────────────────────────────────

  /**
   * Salva o nome no estado e no localStorage.
   * Também carrega as sessões do novo usuário ao logar.
   */
  function handleSetUserName(name: string) {
    setUserName(name);
    saveUserName(name);
    // Carrega as sessões do usuário que acabou de logar/registrar
    setSessions(loadSessions(name) as WorkoutSession[]);
  }

  /**
   * Reseta todos os estados temporários do treino.
   * Chamada pelo App antes de navegar para o pré-treino.
   */
  function startNewWorkout() {
    setPre({ systolic: "", diastolic: "", bpm: "", ihb: false });
    setDuring({
      systolic: "",
      diastolic: "",
      bpm: "",
      distance: "",
      timeSeconds: 0,
      speed: "",
    });
    setPost({ systolic: "", diastolic: "", bpm: "", ihb: false });
  }

  /**
   * Finaliza o treino:
   * 1. Calcula velocidade média (distância ÷ horas)
   * 2. Formata a data/hora atual
   * 3. Adiciona a sessão ao array (dispara persistência via useEffect)
   *
   * A navegação para o histórico é feita pelo App após chamar esta função.
   */
  function saveSession() {
    const hours = during.timeSeconds / 3600;
    const speed =
      hours > 0 && during.distance
        ? (parseFloat(during.distance) / hours).toFixed(1)
        : "0";

    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} — ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    setSessions((s) => [
      ...s,
      {
        id: Date.now().toString(),
        date,
        pre,
        during: { ...during, speed },
        post,
      },
    ]);
  }

  /**
   * Desloga o usuário sem apagar os dados.
   * Limpa apenas o estado — localStorage permanece intacto.
   * A navegação para onboarding é feita pelo App após chamar esta função.
   */
  function logout() {
    setUserName("");
    setSessions([]);
  }

  return {
    sessions,
    userName,
    pre, setPre,
    during, setDuring,
    post, setPost,
    handleSetUserName,
    startNewWorkout,
    saveSession,
    logout,
  };
}