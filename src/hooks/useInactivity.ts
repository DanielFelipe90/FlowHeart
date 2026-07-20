import { useEffect, useState, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 min até mostrar o modal
const MODAL_TIMEOUT = 5 * 60 * 1000;        // 5 min de modal até logout automático

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

  const onInactiveRef = useRef(onInactive);
  useEffect(() => {
    onInactiveRef.current = onInactive;
  }, [onInactive]);

  const isWorkoutActiveRef = useRef(isWorkoutActive);
  useEffect(() => {
    isWorkoutActiveRef.current = isWorkoutActive;
  }, [isWorkoutActive]);

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
  }, []);

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