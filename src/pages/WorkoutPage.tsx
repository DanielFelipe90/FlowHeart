import { Activity, Bike, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { MetricInput } from "../components/MetricInput";
import { BloodPressureInput } from "../components/BloodPressureInput";
import { WorkoutTimer } from "../components/WorkoutTimer";
import type { AppPage, Phase, PreState, DuringState, PostState } from "../app/App";

interface WorkoutPageProps {
  phase: Phase;
  pre: PreState; setPre: React.Dispatch<React.SetStateAction<PreState>>;
  during: DuringState; setDuring: React.Dispatch<React.SetStateAction<DuringState>>;
  post: PostState; setPost: React.Dispatch<React.SetStateAction<PostState>>;
  setPage: (page: AppPage) => void;
  saveSession: () => void;
}

function IHBToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 w-full rounded-xl border p-4 transition-all ${
        value
          ? "border-[#ff5c00] bg-[#ff5c00]/10"
          : "border-[rgba(0,229,255,0.12)] bg-[#1e2330] hover:border-[rgba(0,229,255,0.3)]"
      }`}
    >
      {value ? (
        <AlertCircle size={20} className="text-[#ff5c00] shrink-0" />
      ) : (
        <CheckCircle2 size={20} className="text-[#7a8099] shrink-0" />
      )}
      <div className="text-left">
        <p className="text-xs uppercase tracking-widest text-[#7a8099]" style={{ fontFamily: "'Inter', sans-serif" }}>
          IHB — Batimento Irregular
        </p>
        <p className="text-sm mt-0.5" style={{ fontFamily: "'Inter', sans-serif", color: value ? "#ff5c00" : "#e8eaf0" }}>
          {value ? "Detectado" : "Não detectado"}
        </p>
      </div>
      <div className={`ml-auto w-10 h-6 rounded-full transition-all relative shrink-0 ${value ? "bg-[#ff5c00]" : "bg-[#2e3448]"}`}>
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
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ fontFamily: "'Inter', sans-serif", background: `${c.color}20`, color: c.color }}
        >
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

export function WorkoutPage({ phase, pre, setPre, during, setDuring, post, setPost, setPage, saveSession }: WorkoutPageProps) {
  const canAdvancePre = pre.systolic && pre.diastolic && pre.bpm;
  const canAdvanceDuring = during.bpm;
  const canSavePost = post.systolic && post.diastolic && post.bpm;

  return (
    <div>
      <StepIndicator current={phase} />

      {phase === "pre" && (
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
            style={{ background: "linear-gradient(135deg, #00e5ff 0%, #00b8cc 100%)", color: "#0d0f14" }}
          >
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>INICIAR TREINO</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {phase === "during" && (
        <div>
          <PhaseHeader phase="during" />
          <div className="space-y-3">
            <WorkoutTimer onTimeChange={(s) => setDuring((p) => ({ ...p, timeSeconds: s }))} />
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
          <div className="h-20" />
        </div>
      )}

      {phase === "post" && (
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
  );
}