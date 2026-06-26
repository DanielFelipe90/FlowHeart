import { useState } from "react";
import { Activity, Bike, Plus, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { MetricInput } from "./components/MetricInput";
import { BloodPressureInput } from "./components/BloodPressureInput";
import { WorkoutTimer } from "./components/WorkoutTimer";
import { SessionHistory, type WorkoutSession } from "./components/SessionHistory";
import { SessionDetail } from "./components/SessionDetail";

type Phase = "pre" | "during" | "post";

type AppPage =
  | { tag: "home" }
  | { tag: "workout"; phase: Phase }
  | { tag: "history" }
  | { tag: "detail"; session: WorkoutSession };

const SAMPLE_SESSIONS: WorkoutSession[] = [
  {
    id: "1",
    date: "18/06/2026 — 07:15",
    pre: { systolic: "124", diastolic: "82", bpm: "72", ihb: false },
    during: { systolic: "148", diastolic: "92", bpm: "158", distance: "18.4", timeSeconds: 2700 },
    post: { systolic: "130", diastolic: "84", bpm: "88", ihb: false },
  },
  {
    id: "2",
    date: "16/06/2026 — 06:45",
    pre: { systolic: "130", diastolic: "86", bpm: "78", ihb: true },
    during: { systolic: "155", diastolic: "95", bpm: "165", distance: "22.1", timeSeconds: 3300 },
    post: { systolic: "134", diastolic: "88", bpm: "92", ihb: false },
  },
];

function IHBToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 w-full rounded-xl border p-4 transition-all ${
        value
          ? "border-[#ff3b5c] bg-[#ff3b5c]/10"
          : "border-[rgba(0,229,255,0.12)] bg-[#1e2330] hover:border-[rgba(0,229,255,0.3)]"
      }`}
    >
      {value ? (
        <AlertCircle size={20} className="text-[#ff3b5c] shrink-0" />
      ) : (
        <CheckCircle2 size={20} className="text-[#7a8099] shrink-0" />
      )}
      <div className="text-left">
        <p className="text-xs uppercase tracking-widest text-[#7a8099]" style={{ fontFamily: "'Inter', sans-serif" }}>
          IHB — Batimento Irregular
        </p>
        <p className="text-sm mt-0.5" style={{ fontFamily: "'Inter', sans-serif", color: value ? "#ff3b5c" : "#e8eaf0" }}>
          {value ? "Detectado" : "Não detectado"}
        </p>
      </div>
      <div className={`ml-auto w-10 h-6 rounded-full transition-all relative shrink-0 ${value ? "bg-[#ff3b5c]" : "bg-[#2e3448]"}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-1"}`} />
      </div>
    </button>
  );
}

function PhaseHeader({ phase }: { phase: Phase }) {
  const configs = {
    pre: { label: "Pré-Treino", color: "#7a8099", step: 1, desc: "Registre seus dados antes de iniciar" },
    during: { label: "Durante o Treino", color: "#ff5733", step: 2, desc: "Acompanhe seus dados durante o esforço" },
    post: { label: "Pós-Treino", color: "#00e5ff", step: 3, desc: "Registre sua recuperação" },
  };
  const c = configs[phase];
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ fontFamily: "'Inter', sans-serif", background: `${c.color}20`, color: c.color }}>
          Etapa {c.step} de 3
        </span>
      </div>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800, color: "#e8eaf0", lineHeight: 1.1 }}>
        {c.label}
      </h2>
      <p className="text-[#7a8099] text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{c.desc}</p>
    </div>
  );
}

function StepIndicator({ current }: { current: Phase }) {
  const phases: Phase[] = ["pre", "during", "post"];
  const idx = phases.indexOf(current);
  const colors = { pre: "#7a8099", during: "#ff5733", post: "#00e5ff" };
  return (
    <div className="flex items-center gap-1 mb-6">
      {phases.map((p, i) => (
        <div key={p} className="flex items-center gap-1">
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: i <= idx ? "2rem" : "1.25rem",
              background: i === idx ? colors[current] : "#2e3448",
              opacity: i < idx ? 0.5 : 1,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<AppPage>({ tag: "home" });
  const [sessions, setSessions] = useState<WorkoutSession[]>(SAMPLE_SESSIONS);

  const [pre, setPre] = useState({ systolic: "", diastolic: "", bpm: "", ihb: false });
  const [during, setDuring] = useState({ systolic: "", diastolic: "", bpm: "", distance: "", timeSeconds: 0 });
  const [post, setPost] = useState({ systolic: "", diastolic: "", bpm: "", ihb: false });

  function startNewWorkout() {
    setPre({ systolic: "", diastolic: "", bpm: "", ihb: false });
    setDuring({ systolic: "", diastolic: "", bpm: "", distance: "", timeSeconds: 0 });
    setPost({ systolic: "", diastolic: "", bpm: "", ihb: false });
    setPage({ tag: "workout", phase: "pre" });
  }

  function saveSession() {
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()} — ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    setSessions((s) => [...s, { id: Date.now().toString(), date, pre, during, post }]);
    setPage({ tag: "history" });
  }

  const canAdvancePre = pre.systolic && pre.diastolic && pre.bpm;
  const canAdvanceDuring = during.systolic && during.diastolic && during.bpm;
  const canSavePost = post.systolic && post.diastolic && post.bpm;

  const isHistory = page.tag === "history" || page.tag === "detail";

  return (
    <div className="min-h-screen w-full" style={{ background: "#0d0f14", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-[rgba(0,229,255,0.08)] px-4 py-4 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 flex items-center justify-center">
            <Bike size={18} className="text-[#00e5ff]" />
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#e8eaf0", lineHeight: 1 }}>
              SPIN<span className="text-[#00e5ff]">LOG</span>
            </p>
            <p className="text-[#3a3f52]" style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>BIKE TRAINING TRACKER</p>
          </div>
        </div>
        <nav className="flex gap-1">
          <button
            onClick={() => setPage({ tag: "home" })}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${page.tag === "home" ? "bg-[#1e2330] text-[#00e5ff]" : "text-[#7a8099] hover:text-[#e8eaf0]"}`}
          >
            Início
          </button>
          <button
            onClick={() => setPage({ tag: "history" })}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${isHistory ? "bg-[#1e2330] text-[#00e5ff]" : "text-[#7a8099] hover:text-[#e8eaf0]"}`}
          >
            Histórico
          </button>
        </nav>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* HOME */}
        {page.tag === "home" && (
          <div>
            <div className="mb-8">
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#e8eaf0", lineHeight: 1.05 }}>
                BEM-VINDO<br /><span className="text-[#00e5ff]">AO SEU TREINO</span>
              </h1>
              <p className="text-[#7a8099] mt-2 text-sm">Monitore pressão arterial, frequência cardíaca e desempenho em cada sessão.</p>
            </div>

            {sessions.length > 0 && (() => {
              const last = sessions[sessions.length - 1];
              return (
                <div className="rounded-xl border border-[rgba(0,229,255,0.12)] bg-[#161a23] p-4 mb-6">
                  <p className="text-[#7a8099] text-xs uppercase tracking-widest mb-3">Último Treino</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[#7a8099] text-xs mb-1">BPM Máx</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700, color: "#ff5733" }}>{last.during.bpm}</p>
                    </div>
                    <div>
                      <p className="text-[#7a8099] text-xs mb-1">Distância</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700, color: "#00e5ff" }}>{last.during.distance}<span className="text-sm text-[#7a8099]"> km</span></p>
                    </div>
                    <div>
                      <p className="text-[#7a8099] text-xs mb-1">PA Pós</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 600, color: "#e8eaf0", paddingTop: "0.2rem" }}>{last.post.systolic}/{last.post.diastolic}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={startNewWorkout}
              className="w-full rounded-xl py-4 flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #00e5ff 0%, #00b8cc 100%)", color: "#0d0f14" }}
            >
              <Plus size={20} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>INICIAR NOVO TREINO</span>
            </button>

            {sessions.length > 0 && (
              <button
                onClick={() => setPage({ tag: "history" })}
                className="w-full mt-3 rounded-xl border border-[rgba(0,229,255,0.12)] py-3.5 flex items-center justify-center gap-2 text-[#7a8099] hover:text-[#e8eaf0] hover:border-[rgba(0,229,255,0.25)] transition-all"
              >
                <span style={{ fontSize: "0.9rem" }}>Ver histórico ({sessions.length} treino{sessions.length !== 1 ? "s" : ""})</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* WORKOUT */}
        {page.tag === "workout" && (
          <div>
            <StepIndicator current={page.phase} />

            {page.phase === "pre" && (
              <div>
                <PhaseHeader phase="pre" />
                <div className="space-y-3">
                  <BloodPressureInput
                    systolic={pre.systolic} diastolic={pre.diastolic}
                    onSystolicChange={(v) => setPre((p) => ({ ...p, systolic: v }))}
                    onDiastolicChange={(v) => setPre((p) => ({ ...p, diastolic: v }))}
                  />
                  <MetricInput label="Frequência Cardíaca" unit="bpm" value={pre.bpm} onChange={(v) => setPre((p) => ({ ...p, bpm: v }))} placeholder="72" icon={<Activity size={14} />} min={30} max={250} />
                  <IHBToggle value={pre.ihb} onChange={(v) => setPre((p) => ({ ...p, ihb: v }))} />
                </div>
                <button
                  disabled={!canAdvancePre}
                  onClick={() => setPage({ tag: "workout", phase: "during" })}
                  className="w-full mt-6 rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ background: canAdvancePre ? "linear-gradient(135deg, #ff5733, #e03000)" : "#1e2330", color: "#fff" }}
                >
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>INICIAR TREINO</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {page.phase === "during" && (
              <div>
                <PhaseHeader phase="during" />
                <div className="space-y-3">
                  <WorkoutTimer onTimeChange={(s) => setDuring((p) => ({ ...p, timeSeconds: s }))} />
                  <BloodPressureInput
                    systolic={during.systolic} diastolic={during.diastolic}
                    onSystolicChange={(v) => setDuring((p) => ({ ...p, systolic: v }))}
                    onDiastolicChange={(v) => setDuring((p) => ({ ...p, diastolic: v }))}
                  />
                  <MetricInput label="Frequência Cardíaca" unit="bpm" value={during.bpm} onChange={(v) => setDuring((p) => ({ ...p, bpm: v }))} placeholder="158" icon={<Activity size={14} />} min={30} max={250} />
                  <MetricInput label="Distância Percorrida" unit="km" value={during.distance} onChange={(v) => setDuring((p) => ({ ...p, distance: v }))} placeholder="20.0" icon={<Bike size={14} />} />
                </div>
                <button
                  disabled={!canAdvanceDuring}
                  onClick={() => setPage({ tag: "workout", phase: "post" })}
                  className="w-full mt-6 rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ background: canAdvanceDuring ? "linear-gradient(135deg, #00e5ff, #00a8bf)" : "#1e2330", color: canAdvanceDuring ? "#0d0f14" : "#fff" }}
                >
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>FINALIZAR TREINO</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {page.phase === "post" && (
              <div>
                <PhaseHeader phase="post" />
                <div className="space-y-3">
                  <BloodPressureInput
                    systolic={post.systolic} diastolic={post.diastolic}
                    onSystolicChange={(v) => setPost((p) => ({ ...p, systolic: v }))}
                    onDiastolicChange={(v) => setPost((p) => ({ ...p, diastolic: v }))}
                  />
                  <MetricInput label="Frequência Cardíaca" unit="bpm" value={post.bpm} onChange={(v) => setPost((p) => ({ ...p, bpm: v }))} placeholder="88" icon={<Activity size={14} />} min={30} max={250} />
                  <IHBToggle value={post.ihb} onChange={(v) => setPost((p) => ({ ...p, ihb: v }))} />
                </div>
                <button
                  disabled={!canSavePost}
                  onClick={saveSession}
                  className="w-full mt-6 rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ background: canSavePost ? "linear-gradient(135deg, #00e5ff, #00b8cc)" : "#1e2330", color: canSavePost ? "#0d0f14" : "#fff" }}
                >
                  <CheckCircle2 size={18} />
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>SALVAR TREINO</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {page.tag === "history" && (
          <div>
            <div className="mb-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800, color: "#e8eaf0" }}>HISTÓRICO</h2>
              <p className="text-[#7a8099] text-sm mt-1">{sessions.length} treino{sessions.length !== 1 ? "s" : ""} registrado{sessions.length !== 1 ? "s" : ""}</p>
            </div>
            <SessionHistory
              sessions={sessions}
              onSelect={(s) => setPage({ tag: "detail", session: s })}
            />
          </div>
        )}

        {/* DETAIL */}
        {page.tag === "detail" && (
          <SessionDetail
            session={page.session}
            onBack={() => setPage({ tag: "history" })}
          />
        )}

      </main>
    </div>
  );
}
