"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// Tipagens
export interface HeartRatePoint {
    dateLabel: string;
    bpm: number;
}

interface HeartRateChartProps {
    data: HeartRatePoint[];
    title?: string;
    subtitle?: string;
    lineColor?: string;
    gradientStartColor?: string;
    gradientEndColor?: string;
}

// Tooltip customizado para mostrar os dados ao passar o mouse
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        return (
            <div className="rounded-lg border border-white/10 bg-[#121214]/95 p-3 shadow-xl backdrop-blur-sm">
                <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className="text-xs font-medium text-gray-400">bpm</span>
                </div>
            </div>
        );
    }
    return null;
};

export function HeartRateChart({
    data,
    title = "Frequência Cardíaca Durante o Treino",
    lineColor = "#ef4444",
    gradientStartColor = "#ef4444",
    gradientEndColor = "#121214",
}: HeartRateChartProps) {

    if (!data || data.length === 0) return null;

    // Cálculo de estatísticas básicas baseadas nos dados reais recebidos
    const maxBpm = Math.max(...data.map((d) => d.bpm));
    const avgBpm = Math.round(data.reduce((acc, curr) => acc + curr.bpm, 0) / data.length);
    const minBpm = Math.min(...data.map((d) => d.bpm));
    return (
        <div className="flex w-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm">

            {/* Cabeçalho do Gráfico */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="text-muted-foreground text-xs uppercase tracking-widest mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h3>
                    </div>
                </div>

                {/* Resumo Rápido (Stats) */}
                <div className="grid w-full grid-cols-3 divide-x divide-white/10 rounded-lg border border-white/5 bg-white/5 py-2 sm:w-auto sm:px-2">
                    <div className="flex flex-col items-center justify-center px-1">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400">Máximo</span>
                        <span className="font-mono text-sm font-semibold text-white">
                            {maxBpm} <span className="text-[10px] sm:text-xs text-gray-500">bpm</span>
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-1">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400">Médio</span>
                        <span className="font-mono text-sm font-semibold text-white">
                            {avgBpm} <span className="text-[10px] sm:text-xs text-gray-500">bpm</span>
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-1">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400">Mínimo</span>
                        <span className="font-mono text-sm font-bold text-white">
                            {minBpm} <span className="text-[10px] sm:text-xs text-gray-500">bpm</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Área do Gráfico */}
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={gradientStartColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={gradientEndColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        {/* Grid tracejado */}
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(255,255,255,0.05)"
                        />

                        <XAxis
                            dataKey="dateLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            dy={10}
                            minTickGap={30}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            domain={['dataMin - 10', 'dataMax + 20']}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Area
                            type="monotone"
                            dataKey="bpm"
                            stroke={lineColor}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorBpm)"
                            activeDot={{
                                r: 6,
                                fill: lineColor,
                                stroke: "#121214",
                                strokeWidth: 3,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}