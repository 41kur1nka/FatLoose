import React, { useMemo, useState } from 'react';
import {
  formatShortDateRu,
  getHeatmapDays,
  type HeatmapDay,
} from '../utils/analytics';
import type { WorkoutSession } from '../types';

interface HeatmapProps {
  sessions: WorkoutSession[];
  restDays: string[];
}

const WEEKDAYS = ['Пн', '', 'Ср', '', 'Пт', '', 'Вс'];

const TYPE_LABELS: Record<string, string> = {
  strength: 'Силовая',
  hiit: 'HIIT',
  mobility: 'Зарядка / Растяжка',
};

export const Heatmap: React.FC<HeatmapProps> = ({ sessions, restDays }) => {
  const days = useMemo(
    () => getHeatmapDays(sessions, restDays, 12),
    [sessions, restDays]
  );
  const [selected, setSelected] = useState<HeatmapDay | null>(null);

  // Organize into 12 columns (weeks) x 7 rows (Mon..Sun)
  const columns = useMemo(() => {
    const cols: HeatmapDay[][] = [];
    for (let w = 0; w < 12; w++) {
      cols.push(days.slice(w * 7, w * 7 + 7));
    }
    return cols;
  }, [days]);

  const getCellClass = (day: HeatmapDay) => {
    if (day.isFuture) return 'bg-zinc-900/40 border border-zinc-800/40';
    if (day.count >= 2) return 'bg-emerald-400';
    if (day.count === 1) return 'bg-emerald-500/80';
    if (day.isRest) return 'bg-sky-500/40 border border-sky-400/40';
    return 'bg-zinc-800/80';
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">
          Карта активности (12 недель)
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-500/80" />
            Тренировка
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-sky-500/40 border border-sky-400/40" />
            Отдых
          </span>
        </div>
      </div>

      <div className="flex gap-1.5">
        <div className="flex flex-col justify-between py-0.5 text-[9px] text-zinc-500">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="h-3.5 leading-[14px]">
              {d}
            </span>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-12 gap-1">
          {columns.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={`aspect-square w-full rounded-[4px] transition-transform active:scale-90 ${getCellClass(day)} ${
                    day.isToday ? 'ring-1 ring-white/80 ring-offset-1 ring-offset-zinc-950' : ''
                  }`}
                  aria-label={day.date}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-zinc-950/70 px-3 py-2 text-xs">
          <span className="font-medium text-zinc-200">
            {formatShortDateRu(selected.date)}
          </span>
          <span className="text-zinc-400">
            {selected.count > 0
              ? selected.types.map((t) => TYPE_LABELS[t] || t).join(' + ')
              : selected.isRest
                ? 'Запланированный день отдыха'
                : 'Без тренировок'}
          </span>
        </div>
      )}
    </div>
  );
};
