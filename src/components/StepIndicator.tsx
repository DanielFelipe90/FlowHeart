import type { Phase } from "../types";

interface StepIndicatorProps {
  current: Phase;
}

const colors = { pre: "#7a8099", during: "#ff5733", post: "#0099b3" };

export function StepIndicator({ current }: StepIndicatorProps) {
  const phases: Phase[] = ["pre", "during", "post"];
  const idx = phases.indexOf(current);

  return (
    <div className="flex items-center gap-1 mb-6">
      {phases.map((p, i) => (
        <div key={p} className="flex items-center gap-1">
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: i <= idx ? "2rem" : "1.25rem",
              background: i === idx ? colors[current] : "var(--switch-background)",
              opacity: i < idx ? 0.5 : 1,
            }}
          />
        </div>
      ))}
    </div>
  );
}