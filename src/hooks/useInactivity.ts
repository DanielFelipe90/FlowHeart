import { useEffect, useState, useCallback } from 'react';
const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 min
const MODAL_TIMEOUT = 2 * 60 * 1000;  // 2 min

// useInactivity.ts
export function useInactivity(onInactive: () => void, enabled: boolean) { // Adicionado enabled
  const [showModal, setShowModal] = useState(false);

  const resetInactivity = useCallback(() => {
    setShowModal(false);
    // IMPORTANTE: Aqui você pode disparar um evento para resetar os timers via useEffect
  }, []);

  useEffect(() => {
    if (!enabled) return; // Se não estiver logado, não roda

    let timer: ReturnType<typeof setTimeout>;
    let modalTimer: ReturnType<typeof setTimeout>;

    const triggerLogout = () => onInactive();

    const startTimer = () => {
      timer = setTimeout(() => {
        setShowModal(true);
        modalTimer = setTimeout(triggerLogout, MODAL_TIMEOUT);
      }, INACTIVITY_TIMEOUT);
    };

    const resetTimer = () => {
      if (showModal) return; 
      clearTimeout(timer);
      clearTimeout(modalTimer);
      startTimer();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    startTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(timer);
      clearTimeout(modalTimer);
    };
  }, [enabled, onInactive, showModal]); // showModal aqui é crucial

  return { showModal, setShowModal, resetInactivity };
}