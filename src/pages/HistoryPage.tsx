import { SessionHistory, type WorkoutSession } from "../components/SessionHistory";
import type { AppPage } from "../app/App";

interface HistoryPageProps {
  sessions: WorkoutSession[];
  setPage: (page: AppPage) => void;
}

export function HistoryPage({ sessions, setPage }: HistoryPageProps) {
  return (
    <div>
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