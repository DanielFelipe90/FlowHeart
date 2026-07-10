import { Plus, ChevronRight } from "lucide-react";
import type { AppPage, WorkoutSession } from "../types";

interface HomePageProps {
  userName: string;
  sessions: WorkoutSession[];
  setPage: (page: AppPage) => void;
  startNewWorkout: () => void;
}

export function HomePage({ userName, sessions, setPage, startNewWorkout }: HomePageProps) {
  return (
    <div className="space-y-6 flex flex-col justify-center min-h-[70vh]">
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "2.5rem",
            fontWeight: 800,
            lineHeight: 1.05,
          }}
          className="text-foreground"
        >
          <span>OLÁ, </span>
          <span className="text-primary">{userName.toUpperCase()}</span>
          <br />
          <span>PRONTO PARA TREINAR?</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Monitore pressão arterial, frequência cardíaca e desempenho em cada sessão.
        </p>
      </div>

      <button
        onClick={startNewWorkout}
        className="w-full rounded-xl py-4 flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] mb-6 bg-primary text-primary-foreground"
      >
        <Plus size={20} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
          INICIAR NOVO TREINO
        </span>
      </button>

      {sessions.length > 0 && (() => {
        const last = sessions[sessions.length - 1];
        return (
          <button
            onClick={() => setPage({ tag: "detail", session: last })}
            className="w-full text-left rounded-xl border border-border bg-card p-4 mb-6 hover:border-primary hover:bg-secondary transition-all"
          >
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-3">Último Treino</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">BPM Máx</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700 }}
                  className="text-destructive">
                  {last.during.bpm}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Distância</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700 }}
                  className="text-primary">
                  {last.during.distance}
                  <span className="text-sm text-muted-foreground"> km</span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">PA Pós</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 600, paddingTop: "0.2rem" }}
                  className="text-foreground">
                  {last.post.systolic}/{last.post.diastolic}
                </p>
              </div>
            </div>
          </button>
        );
      })()}

      {sessions.length > 0 && (
        <button
          onClick={() => setPage({ tag: "history" })}
          className="w-full mt-3 rounded-xl border border-border py-3.5 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/25 transition-all"
        >
          <span style={{ fontSize: "0.9rem" }}>
            Ver histórico ({sessions.length} treino{sessions.length !== 1 ? "s" : ""})
          </span>
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}