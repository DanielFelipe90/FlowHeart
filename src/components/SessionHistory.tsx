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
        <Bike size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          Nenhum treino registrado ainda.
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          Comece um novo treino para ver o histórico aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {[...sessions].reverse().map((s) => (
          <div
            key={s.id}
            onClick={() => onSelect(s)}
            className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary hover:bg-secondary transition-all group cursor-pointer"
          >
            {/* Linha superior: data + IHB + lixeira */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-primary" />
                <span className="text-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {s.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(s.pre.ihb || s.post.ihb) && (
                  <span
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <AlertCircle size={14} className="text-accent shrink-0" />
                    IHB
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Grade de métricas */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Vel. Média</p>
                <p className="text-primary" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  {s.during.speed} <span className="text-muted-foreground">km/h</span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">BPM Pico</p>
                <p className="text-destructive" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  {s.during.bpm}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Distância</p>
                <p className="text-primary" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  {s.during.distance} km
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Duração</p>
                <p className="text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  {fmtTime(s.during.timeSeconds)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

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