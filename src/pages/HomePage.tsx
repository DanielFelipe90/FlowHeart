import { Plus, ChevronRight, TrendingUp } from "lucide-react";
import type { AppPage, WorkoutSession } from "../types";

// Props para o componente HomePage
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
        className="w-full rounded-xl py-4 flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] mb-6 bg-primary text-primary-foreground shadow-sm hover:shadow-md"
      >
        <Plus size={20} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
          INICIAR NOVO TREINO
        </span>
      </button>

      {/* ── CARD: ÚLTIMO TREINO ── */}
      {sessions.length > 0 && (() => {
        const last = sessions[sessions.length - 1];
        return (
          <button
            onClick={() => setPage({ tag: "detail", session: last })}
            className="w-full text-left rounded-xl border border-border bg-card p-4 mb-4 hover:border-primary/50 hover:bg-secondary/50 transition-all shadow-sm"
          >
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-3 font-semibold">Último Treino</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">BPM Médio</p>
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

      {/* ── CARD: MINI GRÁFICO DE TENDÊNCIA (UX PREMIUM) ── */}
      {sessions.length > 1 && (() => {
        // Pega os últimos 5 treinos para formar o gráfico
        const last5 = sessions.slice(-5);
        // Descobre a maior distância para calcular a altura das barras proporcionalmente
        const maxDist = Math.max(...last5.map(s => Number(s.during.distance) || 0), 1);

        return (
          <div className="w-full rounded-xl border border-border bg-card p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-primary" />
              <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">
                Tendência (Distância)
              </p>
            </div>
            
            <div className="flex gap-3 items-end h-20 px-2">
              {last5.map((session, index) => {
                const dist = Number(session.during.distance) || 0;
                // Calcula a altura em porcentagem (mínimo de 8% para treinos curtos não sumirem)
                const heightPct = Math.max((dist / maxDist) * 100, 8);
                const isLatest = index === last5.length - 1;

                return (
                  <div key={session.id || index} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                    {/* Tooltip improvisado / Valor em cima da barra */}
                    <span 
                      className={`text-[10px] font-bold ${isLatest ? 'text-primary' : 'text-muted-foreground'}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {dist > 0 ? dist : '-'}
                    </span>
                    
                    {/* Barra do gráfico */}
                    <div className="w-full bg-secondary rounded-sm flex items-end justify-center h-full overflow-hidden">
                      <div 
                        className={`w-full rounded-sm transition-all duration-1000 ease-out ${
                          isLatest 
                            ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]' 
                            : 'bg-primary/30'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── BOTÃO: HISTÓRICO ── */}
      {sessions.length > 0 && (
        <button
          onClick={() => setPage({ tag: "history" })}
          className="w-full mt-2 rounded-xl border border-border py-5 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-secondary/20 transition-all"
        >
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
            Ver histórico completo ({sessions.length} treino{sessions.length !== 1 ? "s" : ""})
          </span>
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}