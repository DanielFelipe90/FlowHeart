import { SessionHistory } from "../components/SessionHistory";
import type { WorkoutSession, AppPage } from "../types";
import { ArrowLeft } from "lucide-react";

interface HistoryPageProps {
  sessions: WorkoutSession[];
  setPage: (page: AppPage) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function HistoryPage({ sessions, setPage, onBack, onDelete }: HistoryPageProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <ArrowLeft size={16} />
        <span>Voltar ao início</span>
      </button>
      <div className="mb-6">
        <h2
          className="text-foreground"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800 }}
        >
          HISTÓRICO
        </h2>
        {sessions.length > 0 && (
          <p className="text-muted-foreground text-sm mt-1">
            {sessions.length} treino{sessions.length !== 1 ? "s" : ""} registrado{sessions.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <SessionHistory
        sessions={sessions}
        onSelect={(s) => setPage({ tag: "detail", session: s })}
        onDelete={onDelete}
      />
    </div>
  );
}