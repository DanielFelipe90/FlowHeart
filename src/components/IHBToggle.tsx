import { AlertCircle, CheckCircle2 } from "lucide-react";

// Props para o componente IHBToggle
interface IHBToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function IHBToggle({ value, onChange }: IHBToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 w-full rounded-xl border p-4 transition-all ${
        value
          ? "border-accent bg-accent/10"
          : "border-border bg-secondary hover:border-primary/30"
      }`}
    >
      {value ? (
        <AlertCircle size={20} className="text-accent shrink-0" />
      ) : (
        <CheckCircle2 size={20} className="text-muted-foreground shrink-0" />
      )}
      <div className="text-left">
        <p className="text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          IHB — Batimento Irregular
        </p>
        <p
          className={`text-sm mt-0.5 ${value ? "text-accent" : "text-foreground"}`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {value ? "Detectado" : "Não detectado"}
        </p>
      </div>
      <div className={`ml-auto w-10 h-6 rounded-full transition-all relative shrink-0 ${value ? "bg-accent" : "bg-switch-background"}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-1"}`} />
      </div>
    </button>
  );
}