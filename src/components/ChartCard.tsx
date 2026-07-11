import { useContainerWidth } from "./SimpleLineChart";
import { SimpleLineChart } from "./SimpleLineChart";

interface ChartSeries {
  values: number[];
  color: string;
  dashed?: boolean;
  label: string;
}

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  id: string;
  series: ChartSeries[];
  labels: string[];
  unit?: string;
}

export function ChartCard({ title, icon, id, series, labels, unit }: ChartCardProps) {
  const { ref, width } = useContainerWidth();

  return (
    <div className="rounded-xl bg-card border border-border p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-muted-foreground text-xs uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
          {title}
        </p>
        {unit && (
          <span className="ml-auto text-muted-foreground/50 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {unit}
          </span>
        )}
      </div>

      {series.length > 1 && (
        <div className="flex gap-4 mb-3 flex-wrap">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div
                className="w-4 h-0.5 rounded"
                style={{
                  background: s.dashed ? "transparent" : s.color,
                  borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
                }}
              />
              <span className="text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div ref={ref} style={{ width: "100%", height: 140 }}>
        {width > 0 && labels.length > 0 ? (
          <SimpleLineChart id={id} width={width} height={140} labels={labels} series={series} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground/50 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              Sem dados ainda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}