import { useEffect, useState, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 min até mostrar o modal
// 5 minutos de modal (Total: 30 min, sincronizado com o Android e o JWT)
const MODAL_TIMEOUT = 5 * 60 * 1000;

// CORREÇÃO: avisa a ponte Android sobre a visibilidade do modal de inatividade da página.
// Sem isso, o InactivityTracker nativo podia mostrar seu próprio AlertDialog ao mesmo tempo
// que este modal, duplicando o aviso de sessão inativa para o usuário.
function notifyAndroidInactivityState(visible: boolean) {
  if (typeof window === "undefined") return;
  (window as any).AndroidNative?.setInactivityWarningVisible?.(visible);
}

export function useInactivity(
  onInactive: () => void,
  enabled: boolean,
  _userId: string | null,
  isWorkoutActive: boolean = false
) {
  const [showModal, setShowModal] = useState(false);

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
      // Se o treino estiver ativo, NUNCA exibe o modal de inatividade
      if (!isWorkoutActiveRef.current) {
        setShowModal(true);
        notifyAndroidInactivityState(true);
        modalTimerRef.current = setTimeout(
          () => onInactiveRef.current(),
          MODAL_TIMEOUT
        );
      }
    }, INACTIVITY_TIMEOUT);
  }, []);

  const resetInactivity = useCallback(() => {
    setShowModal(false);
    notifyAndroidInactivityState(false);
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
      notifyAndroidInactivityState(false);
    };

  }, [enabled, resetInactivity, startTimer]);

  return { showModal, setShowModal, resetInactivity };
}