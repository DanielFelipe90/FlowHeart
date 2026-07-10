import { useState } from "react";

interface MetricInputProps {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  min?: number;
  max?: number;
}

export function MetricInput({ label, unit, value, onChange, placeholder, icon, min, max }: MetricInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`relative rounded-xl border transition-all duration-200 ${
      focused ? "border-primary shadow-[0_0_0_2px_rgba(0,229,255,0.15)]" : "border-border"
    } bg-input-background p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-primary opacity-80">{icon}</span>}
        <label className="text-muted-foreground text-xs tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
          {label}
        </label>
      </div>
      <div className="flex items-end gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? "0"}
          min={min}
          max={max}
          className="bg-transparent w-full text-foreground outline-none placeholder-muted-foreground/30"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 600, lineHeight: 1 }}
        />
        <span className="text-muted-foreground pb-1 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{unit}</span>
      </div>
    </div>
  );
}