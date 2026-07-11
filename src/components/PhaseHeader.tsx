import type { Phase } from "../types";

interface PhaseHeaderProps {
  phase: Phase;
}

const configs = {
  pre:    { label: "Pré-Treino",       color: "#7a8099", step: 1, desc: "Registre seus dados antes de iniciar" },
  during: { label: "Durante o Treino", color: "#ff5733", step: 2, desc: "Acompanhe seus dados durante o esforço" },
  post:   { label: "Pós-Treino",       color: "#0099b3", step: 3, desc: "Registre sua recuperação" },
};

export function PhaseHeader({ phase }: PhaseHeaderProps) {
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
      <h2
        className="text-foreground"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800, lineHeight: 1.1 }}
      >
        {c.label}
      </h2>
      <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
        {c.desc}
      </p>
    </div>
  );
}