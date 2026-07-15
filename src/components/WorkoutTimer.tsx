import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface WorkoutTimerProps {
  onTimeChange: (seconds: number) => void;
}

export function WorkoutTimer({ onTimeChange }: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lógica de disparo da notificação ao clicar em Play
  const handlePlay = () => {
    // Se não estiver rodando e vamos iniciar
    if (!running) {
      if (Notification.permission === "granted") {
        new Notification("FlowHeart: Treino Iniciado", {
          body: "Seu treino começou. Estamos monitorando seu tempo!",
          tag: "workout-status",
          icon: "/favicon.ico" // Certifique-se que o caminho está correto
        } as NotificationOptions);
      }
    }
    setRunning((r) => !r);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    onTimeChange(seconds);
  }, [seconds]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

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