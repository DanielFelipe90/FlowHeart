import { useEffect, useState, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 min até mostrar o modal
const MODAL_TIMEOUT = 2 * 60 * 1000;        // 2 min de modal até logout automático

export function useInactivity(
  onInactive: () => void,
  enabled: boolean,
  _userId: string | null,
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

  const showModalRef = useRef(showModal);
  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

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
      if (showModalRef.current) return;
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
    
  }, [enabled, resetInactivity, startTimer]);

  return { showModal, setShowModal, resetInactivity };
}