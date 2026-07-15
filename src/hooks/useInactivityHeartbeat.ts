import { useEffect, useRef } from 'react';

export function useInactivityHeartbeat(phase: string, resetInactivity: () => void) {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetInactivityRef = useRef(resetInactivity);

  // Mantém a função atualizada sem causar re-renderizações ou re-execuções do timer
  useEffect(() => {
    resetInactivityRef.current = resetInactivity;
  }, [resetInactivity]);

  useEffect(() => {
    if (phase === "during") {
      if (!heartbeatRef.current) {
        console.log("Iniciando heartbeat persistente");
        heartbeatRef.current = setInterval(() => {
          resetInactivityRef.current();
          console.log("Heartbeat persistente 45s - resetInactivity chamado");
        }, 45000);
      }
    } else {
      if (heartbeatRef.current) {
        console.log("Parando heartbeat persistente");
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    return () => {
      if (heartbeatRef.current) {
        console.log("Limpando heartbeat persistente no cleanup");
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [phase]);
}