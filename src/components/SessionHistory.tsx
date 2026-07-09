import { AlertCircle, Calendar, Bike, Trash2 } from "lucide-react";
import { useState } from "react";
import type { WorkoutSession } from "../types";
import { ConfirmModal } from "./ConfirmModal";

interface SessionHistoryProps {
  sessions: WorkoutSession[];
  onSelect: (s: WorkoutSession) => void;
  onDelete: (id: string) => void;
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

export function SessionHistory({ sessions, onSelect, onDelete }: SessionHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    <>
      <div className="space-y-3">
        {[...sessions].reverse().map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="w-full text-left rounded-xl border border-[rgba(0,229,255,0.12)] bg-[#161a23] p-4 hover:border-[#00e5ff] hover:bg-[#1e2330] transition-all group"
          >
            {/* Linha superior: data + IHB + lixeira */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#00e5ff]" />
                <span className="text-[#e8eaf0] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {s.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(s.pre.ihb || s.post.ihb) && (
                  <span
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ff5c00]/15 text-[#ff5c00] text-xs"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <AlertCircle size={14} className="text-[#ff5c00] shrink-0" />
                    IHB
                  </span>
                )}
                {/* Botão lixeira — e.stopPropagation evita abrir o detalhe */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1e2330] text-[#7a8099] hover:text-[#ff3131] hover:bg-[#ff3131]/10 transition-all shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Grade de métricas */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <p className="text-[#7a8099] text-xs mb-1">Vel. Média</p>
                <p className="text-[#00e5ff]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  {s.during.speed} <span className="text-[#7a8099]">km/h</span>
                </p>
              </div>
              <div>
                <p className="text-[#7a8099] text-xs mb-1">BPM Pico</p>
                <p className="text-[#ff3131]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  {s.during.bpm}
                </p>
              </div>
              <div>
                <p className="text-[#7a8099] text-xs mb-1">Distância</p>
                <p className="text-[#00e5ff]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  {s.during.distance} km
                </p>
              </div>
              <div>
                <p className="text-[#7a8099] text-xs mb-1">Duração</p>
                <p className="text-[#e8eaf0]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  {fmtTime(s.during.timeSeconds)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteId && (
        <ConfirmModal
          title="APAGAR TREINO"
          message="Tem certeza que deseja apagar este treino? Esta ação não pode ser desfeita."
          confirmLabel="APAGAR"
          danger
          onConfirm={() => onDelete(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </>
  );
}