import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

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

  // Controla o throttle das escritas de heartbeat no Supabase
  const lastHeartbeatRef = useRef<number>(0);
  const heartbeatInFlightRef = useRef<boolean>(false);

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      // SÓ mostra o modal se NÃO estiver em treino
      if (!isWorkoutActive) {
        setShowModal(true);
        modalTimerRef.current = setTimeout(onInactive, MODAL_TIMEOUT);
      }
    }, INACTIVITY_TIMEOUT);
  }, [onInactive, isWorkoutActive]);

  // Escreve o heartbeat no Supabase, mas no máximo 1x a cada HEARTBEAT_MIN_INTERVAL
  const sendHeartbeat = useCallback(async () => {
    if (!userId) return;

    const now = Date.now();
    if (heartbeatInFlightRef.current) return;
    if (now - lastHeartbeatRef.current < HEARTBEAT_MIN_INTERVAL) return;

    heartbeatInFlightRef.current = true;
    lastHeartbeatRef.current = now;

    try {
      const { error } = await supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) console.error("Erro ao atualizar heartbeat:", error);
    } finally {
      heartbeatInFlightRef.current = false;
    }
  }, [userId]);

  // Reset "leve": só reinicia os timers de UI, sem tocar no Supabase.
  // Usado pelos listeners de mousedown/keydown/scroll/touchstart.
  const resetInactivityUI = useCallback(() => {
    setShowModal(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    startTimer();
  }, [startTimer]);

  // Reset "completo": reinicia os timers de UI E tenta enviar o heartbeat
  // (respeitando o throttle interno). Usado pelo botão "continuar logado"
  // do modal e pelo useInactivityHeartbeat durante o treino.
  const resetInactivity = useCallback(async () => {
    resetInactivityUI();
    await sendHeartbeat();
  }, [resetInactivityUI, sendHeartbeat]);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (showModal) return;
      resetInactivityUI();
      // Heartbeat sempre tenta rodar, mas o throttle interno evita
      // qualquer escrita além de 1x por minuto.
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