import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { showNotification } from "../utils/notify";

// Props para o componente WorkoutTimer
interface WorkoutTimerProps {
  onTimeChange: (seconds: number) => void;
  onRunningChange: (running: boolean) => void;
}

export function WorkoutTimer({ onTimeChange, onRunningChange }: WorkoutTimerProps) {
  // Estado interno do timer
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  // Em vez de contar "ticks" do setInterval (que atrasa/pausa em segundo plano),
  // guardamos o timestamp real de início e o total já acumulado antes desse início.
  // O tempo exibido é sempre RECALCULADO a partir do relógio real (Date.now()),
  // então não importa se o intervalo atrasou 15s: no próximo disparo o valor
  // "pula" para o correto, sem acúmulo de erro.
  const startTimeRef = useRef<number | null>(null); // timestamp (ms) de quando o run atual começou
  const baseSecondsRef = useRef(0); // segundos acumulados de runs anteriores (antes de pausar)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recalcula os segundos com base no relógio real e atualiza o estado
  const syncFromClock = () => {
    if (startTimeRef.current == null) return;
    const elapsedMs = Date.now() - startTimeRef.current;
    const total = baseSecondsRef.current + Math.floor(elapsedMs / 1000);
    setSeconds(total);
  };

  // Lógica de disparo da notificação ao clicar em Play
  const handlePlay = () => {
    if (!running) {
      showNotification("FlowHeart: Treino Iniciado", {
        body: "Seu treino começou. Estamos monitorando seu tempo!",
        tag: "workout-status",
        icon: "/favicon.ico",
        vibrate: [200, 100, 200],
      });
    }
    setRunning((r) => !r);
  };

  // Lógica do timer
  useEffect(() => {
    if (running) {
      // Marca o instante real de início deste "run"
      startTimeRef.current = Date.now();

      // O intervalo serve só como "gatilho" para re-renderizar; o valor mostrado
      // vem sempre do cálculo por timestamp (syncFromClock), então atrasos do
      // navegador/SO em segundo plano não geram deriva (drift) acumulada.
      intervalRef.current = setInterval(syncFromClock, 250);
    } else {
      // Ao pausar, consolida o tempo decorrido no acumulador base
      if (startTimeRef.current != null) {
        const elapsedMs = Date.now() - startTimeRef.current;
        baseSecondsRef.current += Math.floor(elapsedMs / 1000);
        startTimeRef.current = null;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Quando o app volta a ficar visível (usuário reabre, tela liga, troca de app),
  // força uma sincronização imediata em vez de esperar o próximo tick do intervalo.
  // É esse listener que resolve o "atraso de até 15s" com o celular no bolso/tela apagada.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && running) {
        syncFromClock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    window.addEventListener("pageshow", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      window.removeEventListener("pageshow", handleVisibility);
    };
  }, [running]);

  // Atualiza o tempo para o componente pai sempre que os segundos mudarem
  useEffect(() => {
    onTimeChange(seconds);
  }, [seconds]);

  // Notifica o pai sempre que o estado de running mudar
  useEffect(() => {
    onRunningChange(running);
  }, [running]);

  // Formata o tempo em hh:mm:ss
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Reseta o timer e para a contagem
  const reset = () => {
    setRunning(false);
    startTimeRef.current = null;
    baseSecondsRef.current = 0;
    setSeconds(0);
  };

  return (
    <div className="rounded-xl border border-border bg-input-background p-4">
      <div className="flex items-center gap-2 mb-3">
        <label className="text-muted-foreground text-xs tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
          Tempo de Treino
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`transition-all ${running ? "text-primary" : "text-foreground"}`}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.5rem", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}
        >
          {fmt(seconds)}
        </span>

        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${running ? "bg-accent text-white" : "bg-primary text-primary-foreground"
              }`}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={reset}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {running && (
        <div className="mt-3 h-0.5 bg-secondary rounded overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((seconds % 60) / 60) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}