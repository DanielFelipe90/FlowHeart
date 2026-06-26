/*
 * WorkoutTimer.tsx — Cronômetro interativo do treino
 *
 * Exibe o tempo decorrido em formato MM:SS (ou HH:MM:SS para treinos longos).
 * Controles: Play/Pause e Reset.
 *
 * Lógica de temporização:
 *  - Um `setInterval` de 1 segundo incrementa o estado `seconds`.
 *  - O intervalo é criado quando `running` passa a true e destruído quando
 *    passa a false ou o componente desmonta (cleanup do useEffect).
 *  - `onTimeChange` é chamado a cada segundo para sincronizar o valor com
 *    o estado `during.timeSeconds` no componente pai (App.tsx), garantindo
 *    que o tempo seja salvo na sessão ao finalizar o treino.
 *
 * Barra de progresso:
 *  - Faixa ciana que avança de 0% a 100% a cada minuto (seconds % 60),
 *    reiniciando a cada novo minuto — funciona como indicador de segundo.
 *    Só aparece quando o cronômetro está rodando.
 *
 * Props:
 *  onTimeChange — callback chamado com o total de segundos a cada tick
 */

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface WorkoutTimerProps {
  onTimeChange: (seconds: number) => void;
}

export function WorkoutTimer({ onTimeChange }: WorkoutTimerProps) {
  // Total de segundos decorridos desde o início (ou último reset)
  const [seconds, setSeconds] = useState(0);

  // Controla se o cronômetro está em execução
  const [running, setRunning] = useState(false);

  // Referência ao intervalo ativo — permite cancelá-lo no cleanup sem
  // depender do estado `running` dentro do callback do setInterval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          // Notifica o pai com o novo total a cada segundo
          onTimeChange(next);
          return next;
        });
      }, 1000);
    } else {
      // Para o intervalo quando pausado
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    // Cleanup: cancela o intervalo se o componente desmontar enquanto rodando
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  /*
   * fmt — Formata segundos totais em string legível
   * < 1 hora  →  "MM:SS"   ex: "04:35"
   * ≥ 1 hora  →  "HH:MM:SS" ex: "01:12:04"
   */
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Reseta tudo: para o cronômetro, zera os segundos e notifica o pai
  const reset = () => {
    setRunning(false);
    setSeconds(0);
    onTimeChange(0);
  };

  return (
    <div className="rounded-xl border border-[rgba(0,229,255,0.12)] bg-[#1e2330] p-4">
      <div className="flex items-center gap-2 mb-3">
        <label
          className="text-[#7a8099] text-xs tracking-widest uppercase"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Tempo de Treino
        </label>
      </div>

      <div className="flex items-center justify-between">
        {/* Display do tempo — muda para ciano quando em execução */}
        <span
          className={`transition-all ${running ? "text-[#00e5ff]" : "text-[#e8eaf0]"}`}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "2.5rem",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {fmt(seconds)}
        </span>

        <div className="flex gap-2">
          {/* Botão Play/Pause — laranja quando pausando, ciano quando iniciando */}
          <button
            onClick={() => setRunning((r) => !r)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              running ? "bg-[#ff5733] text-white" : "bg-[#00e5ff] text-[#0d0f14]"
            }`}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Botão Reset */}
          <button
            onClick={reset}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2e3448] text-[#7a8099] hover:text-[#e8eaf0] transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Barra de progresso do segundo atual (0–60s → 0–100% de largura) */}
      {running && (
        <div className="mt-3 h-0.5 bg-[#2e3448] rounded overflow-hidden">
          <div
            className="h-full bg-[#00e5ff] transition-all"
            style={{ width: `${((seconds % 60) / 60) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
