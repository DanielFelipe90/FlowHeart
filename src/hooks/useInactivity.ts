import { useEffect, useState, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT = 25 * 60 * 1000;
const MODAL_TIMEOUT = 5 * 60 * 1000;
// 5 * 60 * 1000;  5 min
// 25 * 60 * 1000; 25 min
// 5 * 1000; 5 segundos para teste

export function useInactivity(onInactive: () => void, enabled: boolean) {
  const [showModal, setShowModal] = useState(false);
  
  // Usamos useRef para manter os timers acessíveis fora do useEffect
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setShowModal(true);
      modalTimerRef.current = setTimeout(onInactive, MODAL_TIMEOUT);
    }, INACTIVITY_TIMEOUT);
  }, [onInactive]);

  const resetInactivity = useCallback(() => {
    setShowModal(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (showModal) return;
      resetInactivity();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    
    startTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    };
  }, [enabled, showModal, resetInactivity, startTimer]);

  return { showModal, setShowModal, resetInactivity };
}