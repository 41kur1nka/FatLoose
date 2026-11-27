import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Plus,
  Search,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import type {
  StrengthExerciseLog,
  StrengthSet,
  StrengthTemplate,
  WorkoutSession,
} from '../types';
import { EXERCISE_LIBRARY } from '../data/defaults';
import {
  calculateExercisePRs,
  estimate1RM,
  formatDuration,
  getPreviousExerciseSets,
  getTodayStr,
} from '../utils/analytics';

interface StrengthRunnerProps {
  template: StrengthTemplate | null;
  history: WorkoutSession[];
  onComplete: (session: WorkoutSession) => void;
  onClose: () => void;
}

export const StrengthRunner: React.FC<StrengthRunnerProps> = ({
  template,
  history,
  onComplete,
  onClose,
}) => {
  const [title, setTitle] = useState(template?.name || 'Свободная силовая');
  const startedAtRef = useRef<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);

  // Silent visual rest timer (gym-friendly, no sound)
  const [restEndAt, setRestEndAt] = useState<number | null>(null);
  const [restLeftSec, setRestLeftSec] = useState(0);

  const [showAddEx, setShowAddEx] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [finishedSession, setFinishedSession] = useState<WorkoutSession | null>(
    null
  );

  const existingPRs = useMemo(() => calculateExercisePRs(history), [history]);

  const buildInitialExercises = (): StrengthExerciseLog[] => {
    if (!template) return [];
    return template.exercises.map((ex, eIdx) => {
      const prev = getPreviousExerciseSets(history, ex.name);
      const sets: StrengthSet[] = Array.from({ length: ex.defaultSets }).map(
        (_, sIdx) => ({
          id: `set-${Date.now()}-${eIdx}-${sIdx}`,
          weight: prev?.[sIdx]?.weight ?? prev?.[0]?.weight ?? 0,
          reps: prev?.[sIdx]?.reps ?? ex.defaultReps,
          completed: false,
        })
      );
      return {
        id: `ex-${Date.now()}-${eIdx}`,
        name: ex.name,
        sets,
      };
    });
  };

  const [exercises, setExercises] = useState<StrengthExerciseLog[]>(
    buildInitialExercises
  );

  useEffect(() => {
    if (finishedSession) return;
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      if (restEndAt) {
        const left = Math.ceil((restEndAt - Date.now()) / 1000);
        if (left <= 0) {
          setRestEndAt(null);
          setRestLeftSec(0);
        } else {
          setRestLeftSec(left);
        }
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [restEndAt, finishedSession]);

  const startRest = (seconds: number) => {
    setRestEndAt(Date.now() + seconds * 1000);
    setRestLeftSec(seconds);
  };

  const addExercise = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const prev = getPreviousExerciseSets(history, clean);
    const defaultCount = prev ? Math.max(3, prev.length) : 3;
    const sets: StrengthSet[] = Array.from({ length: defaultCount }).map(
      (_, i) => ({
        id: `set-${Date.now()}-${i}`,
        weight: prev?.[i]?.weight ?? prev?.[0]?.weight ?? 0,
        reps: prev?.[i]?.reps ?? 10,
        completed: false,
      })
    );
    setExercises((list) => [
      ...list,
      { id: `ex-${Date.now()}`, name: clean, sets },
    ]);
    setShowAddEx(false);
    setSearchQuery('');
  };

  const removeExercise = (exId: string) => {
    setExercises((list) => list.filter((e) => e.id !== exId));
  };

  const addSet = (exId: string) => {
    setExercises((list) =>
      list.map((e) => {
        if (e.id !== exId) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              id: `set-${Date.now()}`,
              weight: last?.weight ?? 0,
              reps: last?.reps ?? 10,
              completed: false,
            },
          ],
        };
      })
    );
  };

  const removeSet = (exId: string, setId: string) => {
    setExercises((list) =>
      list.map((e) =>
        e.id === exId
          ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
          : e
      )
    );
  };

  const updateSetField = (
    exId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: number
  ) => {
    setExercises((list) =>
      list.map((e) =>
        e.id === exId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, [field]: Math.max(0, value) } : s
              ),
            }
          : e
      )
    );
  };

  const toggleSetComplete = (exId: string, setId: string) => {
    setExercises((list) =>
      list.map((e) => {
        if (e.id !== exId) return e;
        const key = e.name.trim().toLowerCase();
        const historicalBest = existingPRs[key]?.best1RM ?? 0;

        return {
          ...e,
          sets: e.sets.map((s) => {
            if (s.id !== setId) return s;
            const nextCompleted = !s.completed;
            const est = estimate1RM(s.weight, s.reps);
            const isPR =
              nextCompleted &&
              s.weight > 0 &&
              s.reps > 0 &&
              historicalBest > 0 &&
              est > historicalBest;
            return { ...s, completed: nextCompleted, isPR };
          }),
        };
      })
    );
  };

  const stats = useMemo(() => {
    let totalTonnage = 0;
    let totalSets = 0;
    let prsCount = 0;
    for (const ex of exercises) {
      for (const s of ex.sets) {
        if (s.completed) {
          totalSets++;
          totalTonnage += s.weight * s.reps;
          if (s.isPR) prsCount++;
        }
      }
    }
    return {
      totalTonnage: Math.round(totalTonnage),
      totalSets,
      prsCount,
    };
  }, [exercises]);

  const handleFinish = () => {
    const cleanedExercises = exercises
      .map((ex) => ({
        ...ex,
        sets: ex.sets.filter((s) => s.completed),
      }))
      .filter((ex) => ex.sets.length > 0);

    const session: WorkoutSession = {
      id: `sess-${Date.now()}`,
      type: 'strength',
      title: title.trim() || 'Силовая тренировка',
      date: getTodayStr(),
      startedAt: new Date(startedAtRef.current).toISOString(),
      durationSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
      exercises: cleanedExercises,
      totalTonnage: stats.totalTonnage,
      totalSets: stats.totalSets,
      prsCount: stats.prsCount,
    };

    onComplete(session);
    setFinishedSession(session);
  };

  const handleCancel = () => {
    if (stats.totalSets > 0) {
      if (!window.confirm('Выйти без сохранения тренировки?')) return;
    }
    onClose();
  };

  if (finishedSession) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center safe-top safe-bottom">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h2 className="mt-4 text-3xl font-bold text-white">Тренировка записана!</h2>
        <p className="mt-1 text-sm text-zinc-400">{finishedSession.title}</p>

        <div className="mt-6 grid w-full max-w-sm grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-[11px] text-zinc-500">Время</p>
            <p className="mt-1 text-lg font-bold text-zinc-100">
              {formatDuration(finishedSession.durationSec)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-[11px] text-zinc-500">Тоннаж</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">
              {(finishedSession.totalTonnage || 0).toLocaleString('ru-RU')} кг
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-[11px] text-zinc-500">Подходов</p>
            <p className="mt-1 text-lg font-bold text-zinc-100">
              {finishedSession.totalSets || 0}
            </p>
          </div>
        </div>

        {(finishedSession.prsCount || 0) > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300">
            <Trophy className="h-4 w-4" />
            Новых личных рекордов: {finishedSession.prsCount}!
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full max-w-sm rounded-2xl bg-emerald-500 py-4 text-base font-bold text-zinc-950 active:scale-[0.98]"
        >
          Готово
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 safe-top">
      {/* Sticky Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/90 px-4 pb-3 pt-2 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-center text-base font-bold text-white focus:outline-none"
          />

          <button
            type="button"
            onClick={handleFinish}
            disabled={stats.totalSets === 0}
            className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-zinc-950 disabled:opacity-40 active:scale-95"
          >
            Завершить
          </button>
        </div>

        {/* Live Metrics + Optional Silent Rest Timer */}
        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-zinc-400">
            <span className="font-mono text-zinc-200">
              {formatDuration(elapsedSec)}
            </span>
            <span>
              Тоннаж:{' '}
              <strong className="text-emerald-400">
                {stats.totalTonnage.toLocaleString('ru-RU')} кг
              </strong>
            </span>
          </div>

          {restLeftSec > 0 ? (
            <button
              type="button"
              onClick={() => {
                setRestEndAt(null);
                setRestLeftSec(0);
              }}
              className="flex items-center gap-1.5 rounded-full bg-sky-500/20 px-2.5 py-1 font-mono text-xs font-semibold text-sky-300"
            >
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(restLeftSec)}
            </button>
          ) : (
            <div className="flex items-center gap-1">
              {[60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => startRest(sec)}
                  className="rounded-lg bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400 active:bg-zinc-800"
                >
                  {sec}с
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28">
        {exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-10 text-center">
            <Dumbbell className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-2 text-sm text-zinc-400">Добавь первое упражнение</p>
          </div>
        )}

        {exercises.map((ex) => {
          const prevSets = getPreviousExerciseSets(history, ex.name);
          const pr = existingPRs[ex.name.trim().toLowerCase()];

          return (
            <div
              key={ex.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3.5"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">{ex.name}</h3>
                  {pr && (
                    <p className="mt-0.5 text-[11px] text-amber-400/90">
                      Рекорд: {pr.bestWeight} кг × {pr.bestRepsAtWeight} (1RM ~
                      {pr.best1RM} кг)
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(ex.id)}
                  className="rounded-lg p-1.5 text-zinc-500 active:bg-zinc-800 active:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Column headers */}
              <div className="mb-1.5 grid grid-cols-[28px_1fr_72px_64px_42px] items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <span className="text-center">#</span>
                <span>Прошлый</span>
                <span className="text-center">Вес (кг)</span>
                <span className="text-center">Повт.</span>
                <span className="text-center">ОК</span>
              </div>

              <div className="space-y-2">
                {ex.sets.map((s, idx) => {
                  const prev = prevSets?.[idx];
                  return (
                    <div
                      key={s.id}
                      className={`grid grid-cols-[28px_1fr_72px_64px_42px] items-center gap-2 rounded-xl px-1 py-1 transition-colors ${
                        s.completed ? 'bg-emerald-500/10' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          ex.sets.length > 1 && removeSet(ex.id, s.id)
                        }
                        className="text-center text-xs font-semibold text-zinc-400"
                        title="Нажми чтобы удалить подход"
                      >
                        {idx + 1}
                      </button>

                      <div className="truncate text-xs text-zinc-500">
                        {prev ? `${prev.weight}×${prev.reps}` : '—'}
                        {s.isPR && (
                          <span className="ml-1 inline-flex items-center text-[10px] font-bold text-amber-400">
                            🏆
                          </span>
                        )}
                      </div>

                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={s.weight === 0 ? '' : s.weight}
                        placeholder="0"
                        onChange={(ev) =>
                          updateSetField(
                            ex.id,
                            s.id,
                            'weight',
                            parseFloat(ev.target.value) || 0
                          )
                        }
                        className="h-10 w-full rounded-xl bg-zinc-950/90 px-2 text-center font-mono text-sm font-semibold text-white ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
                      />

                      <input
                        type="number"
                        inputMode="numeric"
                        value={s.reps === 0 ? '' : s.reps}
                        placeholder="0"
                        onChange={(ev) =>
                          updateSetField(
                            ex.id,
                            s.id,
                            'reps',
                            parseInt(ev.target.value, 10) || 0
                          )
                        }
                        className="h-10 w-full rounded-xl bg-zinc-950/90 px-2 text-center font-mono text-sm font-semibold text-white ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => toggleSetComplete(ex.id, s.id)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90 ${
                          s.completed
                            ? 'bg-emerald-500 text-zinc-950'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Check className="h-5 w-5 stroke-[2.5]" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => addSet(ex.id)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-zinc-800/70 py-2 text-xs font-semibold text-zinc-300 active:bg-zinc-800"
              >
                <Plus className="h-3.5 w-3.5" /> Добавить подход
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setShowAddEx(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 py-4 text-sm font-semibold text-emerald-400 active:bg-zinc-900"
        >
          <Plus className="h-5 w-5" /> Добавить упражнение
        </button>
      </div>

      {/* Add Exercise Modal */}
      {showAddEx && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 safe-top safe-bottom">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                autoFocus
                placeholder="Поиск или своё название..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddEx(false);
                setSearchQuery('');
              }}
              className="rounded-xl px-3 py-2 text-sm text-zinc-400"
            >
              Отмена
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => addExercise(searchQuery)}
                className="mb-4 flex w-full items-center justify-between rounded-xl bg-emerald-500/15 px-4 py-3 text-left text-sm font-semibold text-emerald-300"
              >
                <span>Добавить «{searchQuery.trim()}»</span>
                <Plus className="h-4 w-4" />
              </button>
            )}

            {EXERCISE_LIBRARY.map((group) => {
              const filtered = group.items.filter((item) =>
                item.toLowerCase().includes(searchQuery.trim().toLowerCase())
              );
              if (filtered.length === 0) return null;
              return (
                <div key={group.group} className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {group.group}
                  </p>
                  <div className="space-y-1.5">
                    {filtered.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => addExercise(item)}
                        className="flex w-full items-center justify-between rounded-xl bg-zinc-900/70 px-3.5 py-3 text-left text-sm text-zinc-100 active:bg-zinc-800"
                      >
                        <span>{item}</span>
                        <Plus className="h-4 w-4 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
