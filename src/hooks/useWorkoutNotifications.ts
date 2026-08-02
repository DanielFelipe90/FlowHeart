import { useEffect, useRef } from 'react';
import { showNotification } from '../utils/notify';

const NOTIFY_INTERVAL_MS = 300000; // 5 minutos
const CHECK_INTERVAL_MS = 5000; // verifica com mais frequência, mas só notifica a cada 5min "reais"

export function useWorkoutNotifications(phase: string, timeSeconds: number, isTimerRunning: boolean) {
  // Guardamos o tempo numa ref para não recriar o intervalo desnecessariamente
  const timeRef = useRef(timeSeconds);

  // Atualiza a ref sempre que o tempo muda
  useEffect(() => {
    timeRef.current = timeSeconds;
  }, [timeSeconds]);

  // Timestamp real (Date.now()) da última notificação disparada.
  // É essa referência de relógio real — e não a contagem de "ticks" do
  // setInterval — que nos permite saber quantos períodos de 5min já
  // deveriam ter passado, mesmo que o browser tenha suspendido/atrasado
  // o timer em segundo plano (tela bloqueada, app minimizado etc).
  const lastNotifiedAtRef = useRef<number | null>(null);

  const fireNotification = () => {
    const minutes = Math.floor(timeRef.current / 60);
    const seconds = timeRef.current % 60;
    const formattedSeconds = String(seconds).padStart(2, "0");

    showNotification("FlowHeart: Treino em Andamento", {
      body: `Tempo de treino: ${minutes} minutos e ${formattedSeconds} segundos.`,
      tag: "workout-status",
      renotify: true,
      silent: false, // precisa ser false para a vibração não ser suprimida
      vibrate: [200, 100, 200],
    });
  };

  // Verifica, com base no relógio real, se já passou tempo suficiente
  // desde a última notificação. Se o app ficou em segundo plano e
  // "perdeu" um ou mais ciclos de 5min, dispara a notificação de
  // catch-up imediatamente ao invés de esperar o próximo tick do
  // setInterval (que pode nunca chegar a tempo).
  const checkAndNotify = () => {
    if (lastNotifiedAtRef.current == null) return;
    const elapsed = Date.now() - lastNotifiedAtRef.current;
    if (elapsed >= NOTIFY_INTERVAL_MS) {
      fireNotification();
      // Realinha para "agora" (não soma NOTIFY_INTERVAL_MS) para evitar
      // rajadas de notificações caso o app tenha ficado muito tempo em
      // background (ex: 20min bloqueado -> 1 notificação de catch-up,
      // não 4 de uma vez).
      lastNotifiedAtRef.current = Date.now();
    }
  };

  // Configura o intervalo de notificações apenas quando a fase é "during" E o cronômetro está rodando
  useEffect(() => {
    if (phase !== "during" || !isTimerRunning) return;

    // Marca a partir de agora a contagem para a próxima notificação
    lastNotifiedAtRef.current = Date.now();

    // Passo mais curto: serve apenas de "gatilho" para reavaliar o relógio
    // real, assim como o WorkoutTimer faz com syncFromClock. Isso evita
    // depender de o browser respeitar exatamente 300000ms de intervalo.
    const intervalId = setInterval(checkAndNotify, CHECK_INTERVAL_MS);

    // Ao voltar de segundo plano (tela ligada de novo, troca de app,
    // volta pro navegador), força uma checagem imediata em vez de
    // esperar o próximo tick — resolve o caso do celular bloqueado no
    // bolso durante o treino, quando o setInterval fica suspenso pelo SO.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAndNotify();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    window.addEventListener("pageshow", handleVisibility);

    // Limpa tudo se der Pause, mudar de fase ou desmontar
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      window.removeEventListener("pageshow", handleVisibility);
      lastNotifiedAtRef.current = null;
    };
  }, [phase, isTimerRunning]); // O efeito reage ao Play/Pause e à Fase
}