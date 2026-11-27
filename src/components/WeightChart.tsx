import React, { useMemo, useState } from 'react';
import { formatShortDateRu, type WeightTrendPoint } from '../utils/analytics';

interface WeightChartProps {
  points: WeightTrendPoint[];
  targetWeightKg: number | null;
}

export const WeightChart: React.FC<WeightChartProps> = ({
  points,
  targetWeightKg,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const visiblePoints = useMemo(() => {
    // Show last 45 entries for crisp readability
    return points.slice(-45);
  }, [points]);

  if (visiblePoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/50 py-10 px-4 text-center">
        <p className="text-sm font-medium text-zinc-300">Пока нет замеров веса</p>
        <p className="mt-1 text-xs text-zinc-500">
          Добавь первую запись, чтобы увидеть график и 7-дневный тренд
        </p>
      </div>
    );
  }

  const width = 340;
  const height = 185;
  const padL = 36;
  const padR = 14;
  const padT = 18;
  const padB = 26;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const allValues = visiblePoints.flatMap((p) => [p.weightKg, p.trendKg]);
  if (targetWeightKg !== null) allValues.push(targetWeightKg);

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const spread = Math.max(rawMax - rawMin, 1.5);
  const minVal = rawMin - spread * 0.15;
  const maxVal = rawMax + spread * 0.15;

  const xFor = (i: number) =>
    visiblePoints.length === 1
      ? padL + chartW / 2
      : padL + (i / (visiblePoints.length - 1)) * chartW;
  const yFor = (val: number) =>
    padT + ((maxVal - val) / (maxVal - minVal)) * chartH;

  const trendPath = visiblePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(p.trendKg).toFixed(1)}`)
    .join(' ');

  const areaPath =
    visiblePoints.length > 1
      ? `${trendPath} L ${xFor(visiblePoints.length - 1).toFixed(1)} ${(padT + chartH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padT + chartH).toFixed(1)} Z`
      : '';

  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];
  const activePoint =
    selectedIdx !== null && visiblePoints[selectedIdx]
      ? visiblePoints[selectedIdx]
      : visiblePoints[visiblePoints.length - 1];

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Тренд 7д: <strong className="text-zinc-100">{activePoint.trendKg.toFixed(1)} кг</strong>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-zinc-400/70" />
            Факт: <strong className="text-zinc-200">{activePoint.weightKg.toFixed(1)} кг</strong>
          </span>
        </div>
        <span className="text-zinc-500">{formatShortDateRu(activePoint.date)}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible select-none"
      >
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((val, idx) => {
          const y = yFor(val);
          return (
            <g key={idx}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="#27272a"
                strokeWidth="1"
              />
              <text
                x={padL - 6}
                y={y + 3.5}
                textAnchor="end"
                className="fill-zinc-500 text-[9px]"
              >
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Target Weight Line */}
        {targetWeightKg !== null && (
          <g>
            <line
              x1={padL}
              y1={yFor(targetWeightKg)}
              x2={width - padR}
              y2={yFor(targetWeightKg)}
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
            <text
              x={width - padR}
              y={yFor(targetWeightKg) - 4}
              textAnchor="end"
              className="fill-amber-400 text-[9px] font-medium"
            >
              Цель {targetWeightKg} кг
            </text>
          </g>
        )}

        {/* Trend Area */}
        {areaPath && <path d={areaPath} fill="url(#trendGrad)" />}

        {/* Trend Line */}
        {visiblePoints.length > 1 && (
          <path
            d={trendPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Raw Weight Dots + Tap Targets */}
        {visiblePoints.map((p, i) => {
          const cx = xFor(i);
          const cyRaw = yFor(p.weightKg);
          const cyTrend = yFor(p.trendKg);
          const isSelected =
            selectedIdx === i ||
            (selectedIdx === null && i === visiblePoints.length - 1);

          return (
            <g
              key={p.date}
              onClick={() => setSelectedIdx(i)}
              className="cursor-pointer"
            >
              <line
                x1={cx}
                y1={cyRaw}
                x2={cx}
                y2={cyTrend}
                stroke="#52525b"
                strokeWidth="1"
                opacity="0.4"
              />
              <circle
                cx={cx}
                cy={cyRaw}
                r={isSelected ? 4 : 2.5}
                className={isSelected ? 'fill-zinc-100' : 'fill-zinc-400/70'}
              />
              {isSelected && (
                <circle
                  cx={cx}
                  cy={cyTrend}
                  r={4.5}
                  className="fill-emerald-400 stroke-zinc-950"
                  strokeWidth="1.5"
                />
              )}
              {/* Invisible generous tap target */}
              <rect
                x={cx - 10}
                y={padT}
                width={20}
                height={chartH}
                fill="transparent"
              />
            </g>
          );
        })}

        {/* First and Last date labels */}
        <text
          x={padL}
          y={height - 6}
          textAnchor="start"
          className="fill-zinc-500 text-[9px]"
        >
          {formatShortDateRu(visiblePoints[0].date)}
        </text>
        {visiblePoints.length > 1 && (
          <text
            x={width - padR}
            y={height - 6}
            textAnchor="end"
            className="fill-zinc-500 text-[9px]"
          >
            {formatShortDateRu(visiblePoints[visiblePoints.length - 1].date)}
          </text>
        )}
      </svg>
    </div>
  );
};
