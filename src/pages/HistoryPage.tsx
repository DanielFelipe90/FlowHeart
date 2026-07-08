import { SessionHistory } from "../components/SessionHistory";
import type { WorkoutSession, AppPage } from "../types";
import { ArrowLeft } from "lucide-react";

interface HistoryPageProps {
  sessions: WorkoutSession[];
  setPage: (page: AppPage) => void;
  onBack: () => void;
}

export function HistoryPage({ sessions, setPage, onBack }: HistoryPageProps) {
  return (
    <div>
      {/* Botão de voltar ao inicio */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#7a8099] hover:text-[#00e5ff] transition-colors mb-6"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <ArrowLeft size={16} />
        <span>Voltar ao início</span>
      </button>
      <div className="mb-6">
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800, color: "#e8eaf0" }}>
          HISTÓRICO
        </h2>
        {sessions.length > 0 && (
          <p className="text-[#7a8099] text-sm mt-1">
            {sessions.length} treino{sessions.length !== 1 ? "s" : ""} registrado{sessions.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <SessionHistory
        sessions={sessions}
        onSelect={(s) => setPage({ tag: "detail", session: s })}
      />
    </div>
  );
}