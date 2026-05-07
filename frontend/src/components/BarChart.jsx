import { useState } from "react";

/**
 * A clean, dependency-free SVG bar chart.
 *
 * Props:
 *   data   – Array of { label: string, value: number, sublabel?: string }
 *   color  – Tailwind-compatible hex color string (default "#5b50d6")
 *   title  – Chart title (optional)
 *   yLabel – Y-axis unit label (optional)
 *   height – SVG height in px (default 220)
 *   prefix – value prefix such as "৳" (optional)
 */
export default function BarChart({
  data = [],
  color = "#5b50d6",
  title,
  yLabel = "",
  height = 220,
  prefix = "",
}) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
            <rect x="3" y="14" width="4" height="7" rx="1" /><rect x="10" y="9" width="4" height="12" rx="1" /><rect x="17" y="4" width="4" height="17" rx="1" />
          </svg>
        </div>
        <p className="font-medium">No data available yet</p>
        <p className="text-xs text-slate-300 mt-1">Data will appear here once orders are placed.</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padLeft = 52;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 60;
  const chartWidth = 600; // viewBox units — scales with container
  const chartHeight = height;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;
  const barCount = data.length;
  const gap = Math.max(6, 14 - barCount); // shrink gap for many bars
  const barW = Math.max(8, (plotW / barCount) - gap);

  // Y-axis grid lines (4 steps)
  const steps = 4;
  const gridLines = Array.from({ length: steps + 1 }, (_, i) => {
    const y = padTop + plotH - (plotH * i) / steps;
    const val = (maxValue * i) / steps;
    return { y, val };
  });

  return (
    <div className="w-full">
      {title && <p className="text-sm font-semibold text-slate-700 mb-3">{title}</p>}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ minWidth: Math.max(300, barCount * 48 + padLeft + padRight) }}
          aria-label={title || "Bar chart"}
        >
          {/* Grid lines */}
          {gridLines.map(({ y, val }, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={y}
                x2={chartWidth - padRight}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth={i === 0 ? 1.5 : 1}
              />
              <text
                x={padLeft - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="inherit"
              >
                {prefix}{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          {yLabel && (
            <text
              x={10}
              y={padTop + plotH / 2}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
              transform={`rotate(-90, 10, ${padTop + plotH / 2})`}
              fontFamily="inherit"
            >
              {yLabel}
            </text>
          )}

          {/* Bars */}
          {data.map((d, i) => {
            const barH = Math.max(4, (d.value / maxValue) * plotH);
            const x = padLeft + i * (plotW / barCount) + (plotW / barCount - barW) / 2;
            const y = padTop + plotH - barH;
            const isHovered = hovered === i;
            const barColor = isHovered ? adjustColor(color, -20) : color;
            const labelX = x + barW / 2;
            const label = d.label.length > 10 ? d.label.slice(0, 10) + "…" : d.label;

            return (
              <g
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Bar background (hover area) */}
                <rect
                  x={x - 4}
                  y={padTop}
                  width={barW + 8}
                  height={plotH}
                  fill="transparent"
                />
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={Math.min(6, barW / 3)}
                  fill={barColor}
                  opacity={isHovered ? 1 : 0.88}
                  style={{ transition: "all 0.2s ease" }}
                />
                {/* Value label on top */}
                {(isHovered || data.length <= 12) && (
                  <text
                    x={labelX}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={color}
                    fontWeight="700"
                    fontFamily="inherit"
                  >
                    {prefix}{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
                  </text>
                )}
                {/* X-axis label */}
                <text
                  x={labelX}
                  y={padTop + plotH + 16}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={isHovered ? "#1e293b" : "#64748b"}
                  fontWeight={isHovered ? "700" : "500"}
                  fontFamily="inherit"
                >
                  {label}
                </text>
                {d.sublabel && (
                  <text
                    x={labelX}
                    y={padTop + plotH + 30}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#94a3b8"
                    fontFamily="inherit"
                  >
                    {d.sublabel}
                  </text>
                )}

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={Math.min(x + barW / 2 - 44, chartWidth - padRight - 90)}
                      y={y - 40}
                      width={88}
                      height={28}
                      rx={6}
                      fill="#1e293b"
                      opacity={0.92}
                    />
                    <text
                      x={Math.min(x + barW / 2, chartWidth - padRight - 46)}
                      y={y - 22}
                      textAnchor="middle"
                      fontSize="11"
                      fill="white"
                      fontWeight="700"
                      fontFamily="inherit"
                    >
                      {prefix}{typeof d.value === "number" && d.value >= 1000
                        ? d.value.toLocaleString()
                        : d.value}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/** Slightly darken a hex color */
function adjustColor(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
