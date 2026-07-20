import { useEffect } from 'react';
import { loadToken } from '../utils/api';

// Carrega a URL da API dinamicamente das variáveis de ambiente (igual no api.ts)
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function useSessionLifecycle() {
  useEffect(() => {
    const handleLogout = () => {
      const token = loadToken();
      if (token) {
        // O "keepalive: true" garante que o navegador envie a requisição mesmo 
        // após a janela/aba ser fechada, sem os problemas de CORS do sendBeacon.
        fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token }),
          keepalive: true
        }).catch(err => console.error("Erro ao registrar logout no encerramento:", err));
      }
    };

    // Escuta quando a aba é fechada ou recarregada no navegador
    window.addEventListener('pagehide', handleLogout);
    
    // Escuta no contexto de janela PWA instalada
    window.addEventListener('beforeunload', handleLogout);

    return () => {
      window.removeEventListener('pagehide', handleLogout);
      window.removeEventListener('beforeunload', handleLogout);
    };
  }, []);
}