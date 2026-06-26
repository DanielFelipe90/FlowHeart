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
    <div className={`relative rounded-xl border transition-all duration-200 ${focused ? "border-[#00e5ff] shadow-[0_0_0_2px_rgba(0,229,255,0.15)]" : "border-[rgba(0,229,255,0.12)]"} bg-[#1e2330] p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-[#00e5ff] opacity-80">{icon}</span>}
        <label className="text-[#7a8099] text-xs tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
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
          className="bg-transparent w-full text-[#e8eaf0] outline-none placeholder-[#3a3f52]"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 600, lineHeight: 1 }}
        />
        <span className="text-[#7a8099] pb-1 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{unit}</span>
      </div>
    </div>
  );
}
