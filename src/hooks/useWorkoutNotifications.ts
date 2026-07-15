import { useEffect, useRef } from 'react';

export function useWorkoutNotifications(phase: string, timeSeconds: number) {
  // Guardamos o tempo numa ref para não recriar o intervalo desnecessariamente
  const timeRef = useRef(timeSeconds);

  useEffect(() => {
    timeRef.current = timeSeconds;
  }, [timeSeconds]);

  useEffect(() => {
    if (phase !== "during") return;

    const notificationInterval = setInterval(() => {
      if (Notification.permission === "granted") {
        new Notification("FlowHeart: Treino em Andamento", {
          body: `Tempo de treino: ${Math.floor(timeRef.current / 60)} minutos.`,
          tag: "workout-status",
          renotify: true,
          silent: true
        } as NotificationOptions);
      }
    }, 300000);
    // 5000 = 5 segundos, 300000 = 5 minutos

    return () => clearInterval(notificationInterval);
  }, [phase]); // Agora o intervalo só é reiniciado se a fase mudar
}