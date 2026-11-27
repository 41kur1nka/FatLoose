import React, { useMemo, useState } from 'react';
import {
  Award,
  Dumbbell,
  History,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react';
import type { AppData } from '../types';
import {
  calculateAchievements,
  calculateExercisePRs,
  calculateWeightTrend,
  formatDuration,
  formatShortDateRu,
  getTodayStr,
} from '../utils/analytics';
import { WeightChart } from '../components/WeightChart';

interface ProgressViewProps {
  data: AppData;
  onLogWeight: (weightKg: number, date: string) => void;
  onDeleteWeight: (date: string) => void;
  onDeleteSession: (id: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  data,
  onLogWeight,
  onDeleteWeight,
  onDeleteSession,
}) => {
  const [subTab, setSubTab] = useState<'weight' | 'history' | 'awards'>('weight');
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(getTodayStr());

  const weightSummary = useMemo(
    () =>
      calculateWeightTrend(
        data.weightEntries,
        data.settings.startWeightKg,
        data.settings.targetWeightKg
      ),
    [data.weightEntries, data.settings.startWeightKg, data.settings.targetWeightKg]
  );

  const prs = useMemo(
    () =>
      Object.values(calculateExercisePRs(data.sessions)).sort(
        (a, b) => b.best1RM - a.best1RM
      ),
    [data.sessions]
  );

  const achievements = useMemo(() => calculateAchievements(data), [data]);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const sortedSessions = useMemo(
    () =>
      [...data.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [data.sessions]
  );

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeight.replace(',', '.'));
    if (!isNaN(val) && val >= 30 && val <= 300) {
      onLogWeight(Math.round(val * 10) / 10, newDate);
      setNewWeight('');
    }
  };

  return (
    <div className="space-y-4 pb-28">
      <div className="pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Прогресс
        </h1>
      </div>

      {/* Sub Tabs */}
      <div className="grid grid-cols-3 rounded-2xl bg-zinc-900 p-1">
        {[
          { id: 'weight' as const, label: 'Вес', icon: Scale },
          { id: 'history' as const, label: 'Рекорды', icon: History },
          { id: 'awards' as const, label: 'Ачивки', icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          const active = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                active ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* WEIGHT TAB */}
      {subTab === 'weight' && (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <p className="text-[11px] text-zinc-500">Тренд 7д</p>
              <p className="mt-1 font-mono text-lg font-bold text-white">
                {weightSummary.latestTrend !== null
                  ? `${weightSummary.latestTrend.toFixed(1)}`
                  : '—'}
                <span className="ml-0.5 text-xs font-normal text-zinc-500">кг</span>
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <p className="text-[11px] text-zinc-500">Темп / нед</p>
              <p
                className={`mt-1 font-mono text-lg font-bold ${
                  weightSummary.weeklyDelta !== null && weightSummary.weeklyDelta <= 0
                    ? 'text-emerald-400'
                    : 'text-zinc-200'
                }`}
              >
                {weightSummary.weeklyDelta !== null
                  ? `${weightSummary.weeklyDelta > 0 ? '+' : ''}${weightSummary.weeklyDelta.toFixed(1)}`
                  : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <p className="text-[11px] text-zinc-500">
                {weightSummary.remainingToTarget !== null ? 'До цели' : 'Всего'}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-amber-400">
                {weightSummary.remainingToTarget !== null
                  ? `${weightSummary.remainingToTarget > 0 ? weightSummary.remainingToTarget.toFixed(1) : '0.0'}`
                  : weightSummary.totalDelta !== null
                    ? `${weightSummary.totalDelta > 0 ? '+' : ''}${weightSummary.totalDelta.toFixed(1)}`
                    : '—'}
                <span className="ml-0.5 text-xs font-normal text-zinc-500">кг</span>
              </p>
            </div>
          </div>

          <WeightChart
            points={weightSummary.points}
            targetWeightKg={data.settings.targetWeightKg}
          />

          {/* Add Weight Form */}
          <form
            onSubmit={handleAddWeight}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4"
          >
            <p className="mb-2.5 text-xs font-semibold text-zinc-300">
              Добавить взвешивание
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-11 rounded-xl bg-zinc-950 px-2.5 text-xs text-zinc-200 ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
              />
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                required
                placeholder="Вес (кг)"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-xl bg-zinc-950 px-3 font-mono text-sm font-semibold text-white ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 text-zinc-950 active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Weight History */}
          {weightSummary.points.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                История замеров
              </p>
              {[...weightSummary.points].reverse().slice(0, 20).map((p) => (
                <div
                  key={p.date}
                  className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-2.5 text-sm"
                >
                  <span className="text-zinc-400">{formatShortDateRu(p.date)}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-white">
                      {p.weightKg.toFixed(1)} кг
                    </span>
                    <span className="font-mono text-xs text-emerald-400">
                      тренд {p.trendKg.toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteWeight(p.date)}
                      className="text-zinc-600 active:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY & PRS TAB */}
      {subTab === 'history' && (
        <div className="space-y-5">
          {/* Personal Records */}
          <div>
            <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Личные рекорды (PR)
            </h2>
            {prs.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 text-center text-xs text-zinc-500">
                Заверши силовую тренировку с рабочими весами — здесь появятся твои рекорды и расчётный 1RM.
              </div>
            ) : (
              <div className="space-y-2">
                {prs.map((pr) => (
                  <div
                    key={pr.name}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{pr.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {formatShortDateRu(pr.date)} • 1RM ~{pr.best1RM} кг
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-500/15 px-3 py-1.5 font-mono text-xs font-bold text-amber-300">
                      {pr.bestWeight} кг × {pr.bestRepsAtWeight}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workout Log */}
          <div>
            <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Последние тренировки ({sortedSessions.length})
            </h2>
            {sortedSessions.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 text-center text-xs text-zinc-500">
                Пока нет завершённых тренировок.
              </div>
            ) : (
              <div className="space-y-2">
                {sortedSessions.slice(0, 30).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          s.type === 'strength'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : s.type === 'hiit'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-violet-500/15 text-violet-300'
                        }`}
                      >
                        {s.type === 'strength' ? (
                          <Dumbbell className="h-4 w-4" />
                        ) : s.type === 'hiit' ? (
                          <Zap className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-100">{s.title}</p>
                        <p className="text-xs text-zinc-400">
                          {formatShortDateRu(s.date)} • {formatDuration(s.durationSec)}
                          {s.type === 'strength' && s.totalTonnage
                            ? ` • ${s.totalTonnage.toLocaleString('ru-RU')} кг`
                            : ''}
                          {s.type === 'hiit' && s.roundsCompleted
                            ? ` • ${s.roundsCompleted} раундов`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSession(s.id)}
                      className="rounded-lg p-1.5 text-zinc-600 active:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS TAB */}
      {subTab === 'awards' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-200">
              Открыто достижений
            </span>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {unlockedCount} / {achievements.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  a.unlocked
                    ? 'border-emerald-500/35 bg-emerald-500/10'
                    : 'border-zinc-800/80 bg-zinc-900/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                      a.unlocked ? 'bg-emerald-500/20' : 'bg-zinc-800/80 grayscale opacity-60'
                    }`}
                  >
                    {a.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white">{a.title}</h3>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {a.progressLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">{a.description}</p>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${
                          a.unlocked ? 'bg-emerald-400' : 'bg-zinc-500'
                        }`}
                        style={{ width: `${Math.round(a.progress * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
