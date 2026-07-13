import { useEffect, useCallback } from 'react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; 

export function useInactivity(onInactive: () => void) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(onInactive, INACTIVITY_TIMEOUT);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => events.forEach(e => window.removeEventListener(e, resetTimer));
  }, [onInactive]);
}