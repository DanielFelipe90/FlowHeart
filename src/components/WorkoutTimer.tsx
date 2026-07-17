import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

// Props para o componente WorkoutTimer
interface WorkoutTimerProps {
  onTimeChange: (seconds: number) => void;
  onRunningChange: (running: boolean) => void;
}

export function WorkoutTimer({ onTimeChange, onRunningChange }: WorkoutTimerProps) {
  // Estado interno do timer
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lógica de disparo da notificação ao clicar em Play
  const handlePlay = () => {
    if (!running) {
      if (Notification.permission === "granted") {
        new Notification("FlowHeart: Treino Iniciado", {
          body: "Seu treino começou. Estamos monitorando seu tempo!",
          tag: "workout-status",
          icon: "/favicon.ico"
        } as NotificationOptions);
      }
    }
    setRunning((r) => !r);
  };

  // Lógica do timer
  useEffect(() => {
    // Inicia ou para o timer com base no estado "running"
    if (running) {
      // Inicia o intervalo para incrementar os segundos a cada segundo
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      // Para o intervalo quando o timer não está rodando
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    // Limpa o intervalo quando o componente é desmontado
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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