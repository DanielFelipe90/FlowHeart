import { useEffect, useRef } from 'react';

export function useWorkoutNotifications(phase: string, timeSeconds: number) {
  // Guardamos o tempo numa ref para não recriar o intervalo desnecessariamente
  const timeRef = useRef(timeSeconds);

  // Atualiza a ref sempre que o tempo muda
  useEffect(() => {
    timeRef.current = timeSeconds;
  }, [timeSeconds]);

  // Configura o intervalo de notificações apenas quando a fase é "during"
  useEffect(() => {
    if (phase !== "during") return;

    const notificationInterval = setInterval(() => {
      if (Notification.permission === "granted") {
        // Calcula minutos e segundos
        const minutes = Math.floor(timeRef.current / 60);
        const seconds = timeRef.current % 60;

        // Formata os segundos para sempre ter 2 dígitos (ex: 05 em vez de 5)
        const formattedSeconds = String(seconds).padStart(2, "0");

        // Dispara a notificação com o tempo de treino
        new Notification("FlowHeart: Treino em Andamento", {
          body: `Tempo de treino: ${minutes} minutos e ${formattedSeconds} segundos.`,
          tag: "workout-status",
          renotify: true,
          silent: true
        } as NotificationOptions);
      }
    }, 300000);
    // 5000 = 5 segundos, 300000 = 5 minutos

    // Limpa o intervalo quando a fase muda ou o componente é desmontado
    return () => clearInterval(notificationInterval);
  }, [phase]);
}