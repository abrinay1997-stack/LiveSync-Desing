/**
 * Frequency Response Chart
 *
 * SVG-based chart showing SPL across octave bands (125Hz - 8kHz)
 * for a selected measurement point or speaker.
 */

import React, { useMemo } from 'react';

const OCTAVE_BANDS = [125, 250, 500, 1000, 2000, 4000, 8000];

const BAND_LABELS: Record<number, string> = {
    125: '125',
    250: '250',
    500: '500',
    1000: '1k',
    2000: '2k',
    4000: '4k',
    8000: '8k'
};

interface FrequencyResponseChartProps {
    /** Map of frequency (Hz) to SPL (dB) per speaker/source */
    data: Array<{
        label: string;
        color: string;
        values: Map<number, number> | Record<number, number>;
    }>;
    /** Chart width in pixels */
    width?: number;
    /** Chart height in pixels */
    height?: number;
    /** Min SPL for Y axis (auto if not set) */
    minSPL?: number;
    /** Max SPL for Y axis (auto if not set) */
    maxSPL?: number;
}

export const FrequencyResponseChart: React.FC<FrequencyResponseChartProps> = ({
    data,
    width = 280,
    height = 140,
    minSPL: forcedMin,
    maxSPL: forcedMax
}) => {
    const padding = { top: 12, right: 12, bottom: 24, left: 36 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Normalize all data to plain arrays
    const series = useMemo(() => {
        return data.map(d => {
            const vals = OCTAVE_BANDS.map(f => {
                if (d.values instanceof Map) {
                    return d.values.get(f) ?? 0;
                }
                return (d.values as Record<number, number>)[f] ?? 0;
            });
            return { label: d.label, color: d.color, values: vals };
        });
    }, [data]);

    // Calculate Y axis range
    const { yMin, yMax } = useMemo(() => {
        const allValues = series.flatMap(s => s.values).filter(v => v > 0);
        if (allValues.length === 0) return { yMin: 60, yMax: 120 };
        const min = forcedMin ?? Math.floor((Math.min(...allValues) - 5) / 5) * 5;
        const max = forcedMax ?? Math.ceil((Math.max(...allValues) + 5) / 5) * 5;
        return { yMin: min, yMax: max };
    }, [series, forcedMin, forcedMax]);

    // X positions (log scale)
    const xPositions = useMemo(() => {
        const logMin = Math.log10(OCTAVE_BANDS[0]);
        const logMax = Math.log10(OCTAVE_BANDS[OCTAVE_BANDS.length - 1]);
        const logRange = logMax - logMin;
        return OCTAVE_BANDS.map(f => {
            return ((Math.log10(f) - logMin) / logRange) * chartW;
        });
    }, [chartW]);

    const yScale = (spl: number) => {
        return chartH - ((spl - yMin) / (yMax - yMin)) * chartH;
    };

    // Y grid lines
    const yRange = yMax - yMin;
    const yStep = yRange <= 30 ? 5 : 10;
    const yGridLines: number[] = [];
    for (let v = yMin; v <= yMax; v += yStep) {
        yGridLines.push(v);
    }

    if (series.length === 0 || series.every(s => s.values.every(v => v === 0))) {
        return (
            <div className="text-[10px] text-gray-500 italic text-center py-4">
                No frequency data available
            </div>
        );
    }

    return (
        <svg width={width} height={height} className="select-none">
            <g transform={`translate(${padding.left}, ${padding.top})`}>
                {/* Y Grid lines */}
                {yGridLines.map(v => (
                    <g key={v}>
                        <line
                            x1={0} y1={yScale(v)}
                            x2={chartW} y2={yScale(v)}
                            stroke="rgba(255,255,255,0.06)"
                            strokeDasharray="2,3"
                        />
                        <text
                            x={-4} y={yScale(v) + 3}
                            textAnchor="end"
                            fill="rgba(255,255,255,0.35)"
                            fontSize={8}
                            fontFamily="monospace"
                        >
                            {v}
                        </text>
                    </g>
                ))}

                {/* X Grid lines & labels */}
                {OCTAVE_BANDS.map((f, i) => (
                    <g key={f}>
                        <line
                            x1={xPositions[i]} y1={0}
                            x2={xPositions[i]} y2={chartH}
                            stroke="rgba(255,255,255,0.06)"
                        />
                        <text
                            x={xPositions[i]} y={chartH + 14}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.4)"
                            fontSize={8}
                            fontFamily="monospace"
                        >
                            {BAND_LABELS[f]}
                        </text>
                    </g>
                ))}

                {/* Data lines */}
                {series.map((s, si) => {
                    const points = s.values.map((v, i) => {
                        if (v <= 0) return null;
                        return `${xPositions[i]},${yScale(v)}`;
                    }).filter(Boolean);

                    if (points.length < 2) return null;

                    return (
                        <g key={si}>
                            <polyline
                                points={points.join(' ')}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={1.5}
                                strokeLinejoin="round"
                                opacity={0.85}
                            />
                            {/* Data points */}
                            {s.values.map((v, i) => {
                                if (v <= 0) return null;
                                return (
                                    <circle
                                        key={i}
                                        cx={xPositions[i]}
                                        cy={yScale(v)}
                                        r={2}
                                        fill={s.color}
                                        opacity={0.9}
                                    />
                                );
                            })}
                        </g>
                    );
                })}

                {/* Chart border */}
                <rect
                    x={0} y={0}
                    width={chartW} height={chartH}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                />
            </g>

            {/* Y axis label */}
            <text
                x={8} y={height / 2}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize={8}
                fontFamily="monospace"
                transform={`rotate(-90, 8, ${height / 2})`}
            >
                dB SPL
            </text>
        </svg>
    );
};
