import React, { useMemo, useState } from 'react';
import {
  Dumbbell,
  Flame,
  Plus,
  Scale,
  Snowflake,
  Sparkles,
  TrendingDown,
  Zap,
} from 'lucide-react';
import type { AppData } from '../types';
import {
  calculateStreak,
  calculateWeightTrend,
  getTodayStr,
} from '../utils/analytics';
import { Heatmap } from '../components/Heatmap';

interface TodayViewProps {
  data: AppData;
  onQuickStartStrength: () => void;
  onQuickStartHiit: () => void;
  onQuickStartMobility: () => void;
  onLogWeight: (weightKg: number, date?: string) => void;
  onToggleRestToday: () => void;
  onOpenProgress: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  data,
  onQuickStartStrength,
  onQuickStartHiit,
  onQuickStartMobility,
  onLogWeight,
  onToggleRestToday,
  onOpenProgress,
}) => {
  const today = getTodayStr();
  const streak = useMemo(
    () => calculateStreak(data.sessions, data.settings.restDays),
    [data.sessions, data.settings.restDays]
  );
  const weightSummary = useMemo(
    () =>
      calculateWeightTrend(
        data.weightEntries,
        data.settings.startWeightKg,
        data.settings.targetWeightKg
      ),
    [data.weightEntries, data.settings.startWeightKg, data.settings.targetWeightKg]
  );

  const todayWeight = data.weightEntries.find((w) => w.date === today);
  const [weightInput, setWeightInput] = useState(
    todayWeight?.weightKg.toString() ||
      weightSummary.latestRaw?.toString() ||
      ''
  );
  const [editingWeight, setEditingWeight] = useState(false);

  const todaySessions = data.sessions.filter((s) => s.date === today);
  const weekPct = Math.min(
    100,
    Math.round((streak.thisWeekCount / Math.max(1, data.settings.weeklyGoal)) * 100)
  );

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput.replace(',', '.'));
    if (!isNaN(val) && val >= 30 && val <= 300) {
      onLogWeight(Math.round(val * 10) / 10, today);
      setEditingWeight(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header + Streak */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-white">
            Сегодня
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-sm font-bold text-amber-300">
              {streak.current}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Goal + Rest Day Freeze Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Цель на неделю</p>
            <p className="mt-0.5 text-lg font-bold text-white">
              {streak.thisWeekCount} из {data.settings.weeklyGoal} тренировок
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleRestToday}
            disabled={streak.activeToday}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors active:scale-95 disabled:opacity-40 ${
              streak.restToday
                ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            <Snowflake className="h-3.5 w-3.5" />
            {streak.restToday ? 'День отдыха ✓' : 'День отдыха'}
          </button>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-500"
            style={{ width: `${weekPct}%` }}
          />
        </div>

        {todaySessions.length > 0 && (
          <p className="mt-2.5 text-xs text-emerald-400">
            Сегодня уже выполнено: {todaySessions.map((s) => s.title).join(', ')}
          </p>
        )}
      </div>

      {/* Quick Start Actions */}
      <div>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Быстрый старт
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onQuickStartStrength}
            className="flex flex-col items-start justify-between rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-zinc-900 p-3.5 text-left active:scale-[0.97]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-bold text-white">Силовая</p>
              <p className="text-[11px] text-zinc-400">Зал / веса</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onQuickStartHiit}
            className="flex flex-col items-start justify-between rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/15 to-zinc-900 p-3.5 text-left active:scale-[0.97]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-bold text-white">HIIT</p>
              <p className="text-[11px] text-zinc-400">Дома по таймеру</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onQuickStartMobility}
            className="flex flex-col items-start justify-between rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/15 to-zinc-900 p-3.5 text-left active:scale-[0.97]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-bold text-white">Зарядка</p>
              <p className="text-[11px] text-zinc-400">Растяжка / спина</p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Weight Check-in Widget */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenProgress}
            className="flex items-center gap-2 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-emerald-400">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Вес и 7-дневный тренд</p>
              {weightSummary.latestTrend !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white">
                    {weightSummary.latestTrend.toFixed(1)} кг
                  </span>
                  {weightSummary.weeklyDelta !== null && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                        weightSummary.weeklyDelta <= 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      <TrendingDown className="h-3 w-3" />
                      {weightSummary.weeklyDelta > 0 ? '+' : ''}
                      {weightSummary.weeklyDelta.toFixed(1)} / нед
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm font-semibold text-zinc-300">
                  Запиши вес для старта
                </p>
              )}
            </div>
          </button>

          {!editingWeight && (
            <button
              type="button"
              onClick={() => {
                setWeightInput(
                  todayWeight?.weightKg.toString() ||
                    weightSummary.latestRaw?.toString() ||
                    ''
                );
                setEditingWeight(true);
              }}
              className="flex items-center gap-1 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-400 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              {todayWeight ? `${todayWeight.weightKg} кг` : 'Записать'}
            </button>
          )}
        </div>

        {editingWeight && (
          <form onSubmit={handleSaveWeight} className="mt-3 flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              autoFocus
              placeholder="Например 84.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="h-10 flex-1 rounded-xl bg-zinc-950 px-3 font-mono text-sm font-semibold text-white ring-1 ring-zinc-700 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-zinc-950 active:scale-95"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setEditingWeight(false)}
              className="h-10 rounded-xl bg-zinc-800 px-3 text-xs text-zinc-400"
            >
              ✕
            </button>
          </form>
        )}
      </div>

      {/* Activity Heatmap */}
      <Heatmap sessions={data.sessions} restDays={data.settings.restDays} />
    </div>
  );
};
