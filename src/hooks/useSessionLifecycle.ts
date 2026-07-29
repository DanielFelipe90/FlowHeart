import { useEffect } from 'react';
import { loadToken, API_URL } from '../utils/api';

export function useSessionLifecycle() {
  useEffect(() => {
    const handleUnload = () => {
      const token = loadToken();
      if (token) {
        // Apenas marca offline — NÃO invalida o token/sessão.
        // Isso evita deslogar o usuário quando ele só dá refresh na página.
        fetch(`${API_URL}/auth/offline`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          keepalive: true
        }).catch(err => console.error("Erro ao marcar offline no encerramento:", err));
      }
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);
}