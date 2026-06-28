import { AlertCircle } from "lucide-react";
/*
 * SessionHistory.tsx — Lista de sessões de treino registradas
 *
 * Exibe todas as sessões em ordem cronológica inversa (mais recente no topo).
 * Cada card resume os quatro indicadores principais: PA Pré, BPM Pico,
 * Distância e Duração. Um badge vermelho "IHB" aparece se algum
 * batimento irregular foi detectado no pré ou pós-treino da sessão.
 *
 * Estado vazio:
 *  Quando não há sessões, exibe uma mensagem de boas-vindas com ícone
 *  de bicicleta, encorajando o primeiro registro.
 *
 * Props:
 *  sessions  — array de todas as sessões salvas
 *  onSelect  — callback disparado ao clicar em um card; recebe a sessão
 *              clicada para que o pai navegue para a tela de detalhe
 */

import { Calendar, Bike } from "lucide-react";

/*
 * WorkoutSession — tipo central de dados do app.
 * Exportado daqui pois SessionHistory é o ponto de entrada
 * onde a estrutura é mais completamente utilizada.
 *
 * Estrutura:
 *  id          — identificador único (Date.now().toString() em runtime)
 *  date        — string formatada "DD/MM/AAAA — HH:MM"
 *  pre         — métricas capturadas ANTES do treino
 *  during      — métricas capturadas DURANTE o treino (inclui distância e tempo)
 *  post        — métricas capturadas APÓS o treino
 *
 * Todos os valores numéricos são armazenados como string porque vêm
 * diretamente de <input type="number"> sem conversão — a conversão
 * para Number() ocorre apenas nos gráficos (SessionDetail).
 */
export interface WorkoutSession {
  id: string;
  date: string;
  pre: { systolic: string; diastolic: string; bpm: string; ihb: boolean };
  during: { systolic: string; diastolic: string; bpm: string; distance: string; timeSeconds: number; speed: string; };
  post: { systolic: string; diastolic: string; bpm: string; ihb: boolean };
}

interface SessionHistoryProps {
  sessions: WorkoutSession[];
  onSelect: (s: WorkoutSession) => void;
}

/*
 * fmtTime — Formata segundos em texto legível para o card do histórico
 * Usa o formato "Xh Ym" para treinos longos ou "Xm Ys" para curtos,
 * diferente do formato "MM:SS" do cronômetro ativo — aqui o objetivo
 * é leitura rápida, não precisão de segundo.
 *
 * Exemplos:
 *  2700  →  "45m 0s"
 *  3661  →  "1h 1m"
 */
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

export function SessionHistory({ sessions, onSelect }: SessionHistoryProps) {
  // Estado vazio: orienta o usuário a iniciar o primeiro treino
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bike size={48} className="text-[#2e3448] mb-4" />
        <p className="text-[#7a8099]" style={{ fontFamily: "'Inter', sans-serif" }}>
          Nenhum treino registrado ainda.
        </p>
        <p className="text-[#3a3f52] text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          Comece um novo treino para ver o histórico aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/*
       * [...sessions].reverse() cria uma cópia invertida sem mutar o array original.
       * Mutação direta de `sessions` causaria re-render em loop.
       */}
      {[...sessions].reverse().map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className="w-full text-left rounded-xl border border-[rgba(0,229,255,0.12)] bg-[#161a23] p-4 hover:border-[#00e5ff] hover:bg-[#1e2330] transition-all group"
        >
          {/* Linha superior: data + badge IHB (se aplicável) */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#00e5ff]" />
              <span className="text-[#e8eaf0] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                {s.date}
              </span>
            </div>
            {/* Badge IHB aparece se houver detecção em qualquer fase da sessão */}
            {(s.pre.ihb || s.post.ihb) && (
              <span
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ff5c00]/15 text-[#ff5c00] text-xs"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <AlertCircle size={14} className="text-[#ff5c00] shrink-0" />
                IHB
              </span>
            )}
          </div>

          {/* Grade de 5 métricas resumidas */}
          <div className="grid grid-cols-5 gap-3">
            <div>
              <p className="text-[#7a8099] text-xs mb-1">Vel. Média</p>
              <p className="text-[#00e5ff]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                {s.during.speed} <span className="text-[#7a8099]">km/h</span>
              </p>
            </div>
            <div>
              <p className="text-[#7a8099] text-xs mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                BPM Pico
              </p>
              {/* BPM de pico em laranja — indica esforço máximo atingido */}
              <p
                className="text-[#ff3131]"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}
              >
                {s.during.bpm}
              </p>
            </div>
            <div>
              <p className="text-[#7a8099] text-xs mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                Distância
              </p>
              <p
                className="text-[#00e5ff]"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}
              >
                {s.during.distance} km
              </p>
            </div>
            <div>
              <p className="text-[#7a8099] text-xs mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                Duração
              </p>
              <p
                className="text-[#e8eaf0]"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}
              >
                {fmtTime(s.during.timeSeconds)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
