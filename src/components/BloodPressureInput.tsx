import { useState } from "react";
import { Heart } from "lucide-react";

// Props para o componente BloodPressureInput
interface BloodPressureInputProps {
  systolic: string;
  diastolic: string;
  onSystolicChange: (v: string) => void;
  onDiastolicChange: (v: string) => void;
}

export function BloodPressureInput({ systolic, diastolic, onSystolicChange, onDiastolicChange }: BloodPressureInputProps) {
  
  // Estado para controlar qual campo de input está focado, para aplicar estilos de foco
  const [focusedField, setFocusedField] = useState<"sys" | "dia" | null>(null);

  return (
    <div className={`relative rounded-xl border transition-all duration-200 ${
      focusedField ? "border-primary shadow-[0_0_0_2px_rgba(0,229,255,0.15)]" : "border-border"
    } bg-input-background p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Heart size={14} className="text-accent" />
        <label className="text-muted-foreground text-xs tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
          Pressão Arterial
        </label>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <input
            type="number"
            value={systolic}
            onChange={(e) => onSystolicChange(e.target.value)}
            onFocus={() => setFocusedField("sys")}
            onBlur={() => setFocusedField(null)}
            placeholder="120"
            className="bg-transparent w-full text-foreground outline-none placeholder-muted-foreground/30"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 600, lineHeight: 1 }}
          />
          <span className="text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>SIS</span>
        </div>
        <span className="text-muted-foreground/30 pb-5" style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace" }}>/</span>
        <div className="flex-1">
          <input
            type="number"
            value={diastolic}
            onChange={(e) => onDiastolicChange(e.target.value)}
            onFocus={() => setFocusedField("dia")}
            onBlur={() => setFocusedField(null)}
            placeholder="80"
            className="bg-transparent w-full text-foreground outline-none placeholder-muted-foreground/30"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 600, lineHeight: 1 }}
          />
          <span className="text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>DIA</span>
        </div>
        <span className="text-muted-foreground pb-5 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>mmHg</span>
      </div>
    </div>
  );
}