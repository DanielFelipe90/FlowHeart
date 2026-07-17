import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';

const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 min até mostrar o modal
const MODAL_TIMEOUT = 5 * 60 * 1000;        // 5 min de modal até logout automático
const HEARTBEAT_MIN_INTERVAL = 60 * 1000;   // não escreve no Supabase mais que 1x/min

export function useInactivity(
  onInactive: () => void,
  enabled: boolean,
  userId: string | null,
  isWorkoutActive: boolean = false
) {
  const [showModal, setShowModal] = useState(false);

  // Timers de UI (mostrar modal / deslogar)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guarda onInactive numa ref para que mudanças de identidade da função
  // (ex.: handleLogout recriado quando userId muda) não destruam os timers ativos.
  const onInactiveRef = useRef(onInactive);
  useEffect(() => {
    onInactiveRef.current = onInactive;
  }, [onInactive]);

  // Guarda isWorkoutActive numa ref pelo mesmo motivo — evita recriar startTimer
  // a cada render do WorkoutPage.
  const isWorkoutActiveRef = useRef(isWorkoutActive);
  useEffect(() => {
    isWorkoutActiveRef.current = isWorkoutActive;
  }, [isWorkoutActive]);

  // Controla o throttle das escritas de heartbeat no Supabase
  const lastHeartbeatRef = useRef<number>(0);
  const heartbeatInFlightRef = useRef<boolean>(false);

  // startTimer agora não depende de onInactive nem isWorkoutActive diretamente —
  // lê os valores atuais via ref no momento em que o timeout dispara.
  // Isso evita que a cadeia inteira seja recriada quando essas deps mudam.
  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (!isWorkoutActiveRef.current) {
        setShowModal(true);
        modalTimerRef.current = setTimeout(
          () => onInactiveRef.current(),
          MODAL_TIMEOUT
        );
      }
    }, INACTIVITY_TIMEOUT);
  }, []); // deps vazias — estável para sempre

  // Envia heartbeat pro backend, que atualiza last_seen_at e status via JWT.
  // No máximo 1x a cada HEARTBEAT_MIN_INTERVAL — throttle interno evita flood.
  const sendHeartbeat = useCallback(async () => {
    if (!userId) return; // não logado ainda

    const now = Date.now();
    if (heartbeatInFlightRef.current) return;
    if (now - lastHeartbeatRef.current < HEARTBEAT_MIN_INTERVAL) return;

    heartbeatInFlightRef.current = true;
    lastHeartbeatRef.current = now;

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        await apiFetch("/auth/heartbeat", { method: "POST" });
        break; // sucesso
      } catch (error: unknown) {
        attempt++;
        const message = error instanceof Error ? error.message : String(error);
        const isTransient = message.includes("503") ||
          message.includes("Service Unavailable") ||
          message.includes("Failed to fetch");

        if (!isTransient || attempt >= MAX_RETRIES) {
          console.error("Erro ao atualizar heartbeat:", error);
          break;
        }

        // Backoff: 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
      }
    }

    heartbeatInFlightRef.current = false;
  }, [userId]);

  // Reset "leve": só reinicia os timers de UI, sem tocar no Supabase.
  const resetInactivityUI = useCallback(() => {
    setShowModal(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    startTimer();
  }, [startTimer]);

  // Reset "completo": reinicia os timers de UI E tenta enviar o heartbeat.
  const resetInactivity = useCallback(async () => {
    resetInactivityUI();
    await sendHeartbeat();
  }, [resetInactivityUI, sendHeartbeat]);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (showModal) return;
      resetInactivityUI();
      void sendHeartbeat();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    startTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    };
  }, [enabled, showModal, resetInactivityUI, sendHeartbeat, startTimer]);

  return { showModal, setShowModal, resetInactivity };
}