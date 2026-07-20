import { useEffect, useRef } from 'react';

export function useWorkoutNotifications(phase: string, timeSeconds: number, isTimerRunning: boolean) {
  // Guardamos o tempo numa ref para não recriar o intervalo desnecessariamente
  const timeRef = useRef(timeSeconds);

  // Atualiza a ref sempre que o tempo muda
  useEffect(() => {
    timeRef.current = timeSeconds;
  }, [timeSeconds]);

  // Configura o intervalo de notificações apenas quando a fase é "during" E o cronômetro está rodando
  useEffect(() => {
    if (phase !== "during" || !isTimerRunning) return;

    const notificationInterval = setInterval(() => {
      if (Notification.permission === "granted") {
        // Calcula minutos e segundos com base no valor mais recente do tempo
        const minutes = Math.floor(timeRef.current / 60);
        const seconds = timeRef.current % 60;
        const formattedSeconds = String(seconds).padStart(2, "0");

        // Dispara a notificação com o tempo de treino
        new Notification("FlowHeart: Treino em Andamento", {
          body: `Tempo de treino: ${minutes} minutos e ${formattedSeconds} segundos.`,
          tag: "workout-status",
          renotify: true,
          silent: true
        } as NotificationOptions);
      }
    }, 300000); // 5 minutos (300000ms)

    // Limpa o intervalo se der Pause, mudar de fase ou desmontar
    return () => clearInterval(notificationInterval);
  }, [phase, isTimerRunning]); // O efeito reage ao Play/Pause e à Fase
}