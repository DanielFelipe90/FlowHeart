import { useEffect } from 'react';
import { loadToken } from '../utils/api';

export function useSessionLifecycle() {
  useEffect(() => {
    const handleLogout = () => {
      const token = loadToken();
      if (token) {
        // Usamos fetch síncrono ou sendBeacon
        // O sendBeacon ainda é o ideal, mas disparar nos dois eventos aumenta a chance
        const body = JSON.stringify({ token });
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('http://localhost:8000/auth/logout', blob);
      }
    };

    // Aba do browser (pagehide)
    window.addEventListener('pagehide', handleLogout);
    
    // Janela PWA (beforeunload)
    window.addEventListener('beforeunload', handleLogout);

    return () => {
      window.removeEventListener('pagehide', handleLogout);
      window.removeEventListener('beforeunload', handleLogout);
    };
  }, []);
}