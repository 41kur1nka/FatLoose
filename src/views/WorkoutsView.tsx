import React, { useState } from 'react';
import {
  ChevronRight,
  Clock,
  Dumbbell,
  Play,
  Plus,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import type {
  AppData,
  HiitPreset,
  MobilityCategory,
  MobilityRoutine,
  StrengthTemplate,
} from '../types';
import { getPreviousExerciseSets } from '../utils/analytics';

export type WorkoutTab = 'strength' | 'hiit' | 'mobility';

interface WorkoutsViewProps {
  data: AppData;
  initialTab?: WorkoutTab;
  onStartStrength: (template: StrengthTemplate | null) => void;
  onStartHiit: (preset: HiitPreset) => void;
  onStartMobility: (routine: MobilityRoutine) => void;
  onAddStrengthTemplate: (tpl: StrengthTemplate) => void;
  onUpdateStrengthTemplate: (tpl: StrengthTemplate) => void;
  onDeleteStrengthTemplate: (id: string) => void;
  onAddHiitPreset: (preset: HiitPreset) => void;
  onDeleteHiitPreset: (id: string) => void;
  onAddMobilityRoutine: (routine: MobilityRoutine) => void;
  onDeleteMobilityRoutine: (id: string) => void;
}

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({
  data,
  initialTab = 'strength',
  onStartStrength,
  onStartHiit,
  onStartMobility,
  onAddStrengthTemplate,
  onUpdateStrengthTemplate,
  onDeleteStrengthTemplate,
  onAddHiitPreset,
  onDeleteHiitPreset,
  onAddMobilityRoutine,
  onDeleteMobilityRoutine,
}) => {
  const [tab, setTab] = useState<WorkoutTab>(initialTab);

  // Preview modals
  const [previewStrengthId, setPreviewStrengthId] = useState<string | null>(null);
  const [quickExName, setQuickExName] = useState('');
  const [previewHiit, setPreviewHiit] = useState<HiitPreset | null>(null);
  const [previewMobility, setPreviewMobility] = useState<MobilityRoutine | null>(
    null
  );

  // Modal states for builders
  const [showStrengthBuilder, setShowStrengthBuilder] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplExercisesText, setTplExercisesText] = useState('');

  const [showHiitBuilder, setShowHiitBuilder] = useState(false);
  const [hiitName, setHiitName] = useState('');
  const [hiitWork, setHiitWork] = useState(30);
  const [hiitRest, setHiitRest] = useState(15);
  const [hiitRounds, setHiitRounds] = useState(8);
  const [hiitExText, setHiitExText] = useState('');

  const [showMobBuilder, setShowMobBuilder] = useState(false);
  const [mobName, setMobName] = useState('');
  const [mobCat, setMobCat] = useState<MobilityCategory>('stretch');
  const [mobStepsText, setMobStepsText] = useState('');

  const previewStrength = previewStrengthId
    ? data.strengthTemplates.find((t) => t.id === previewStrengthId) || null
    : null;

  const handleAddExToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewStrength || !quickExName.trim()) return;
    onUpdateStrengthTemplate({
      ...previewStrength,
      exercises: [
        ...previewStrength.exercises,
        { name: quickExName.trim(), defaultSets: 3, defaultReps: 10 },
      ],
    });
    setQuickExName('');
  };

  const handleRemoveExFromPreview = (idx: number) => {
    if (!previewStrength) return;
    onUpdateStrengthTemplate({
      ...previewStrength,
      exercises: previewStrength.exercises.filter((_, i) => i !== idx),
    });
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = tplExercisesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!tplName.trim() || lines.length === 0) return;

    onAddStrengthTemplate({
      id: `tpl-${Date.now()}`,
      name: tplName.trim(),
      subtitle: `${lines.length} упражнений`,
      exercises: lines.map((name) => ({
        name,
        defaultSets: 3,
        defaultReps: 10,
      })),
    });
    setTplName('');
    setTplExercisesText('');
    setShowStrengthBuilder(false);
  };

  const handleCreateHiit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiitName.trim()) return;
    const exercises = hiitExText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    onAddHiitPreset({
      id: `hiit-${Date.now()}`,
      name: hiitName.trim(),
      subtitle: `${hiitWork}с работа / ${hiitRest}с отдых • ${hiitRounds} раундов`,
      warmupSec: 10,
      workSec: Math.max(5, hiitWork),
      restSec: Math.max(0, hiitRest),
      rounds: Math.max(1, hiitRounds),
      exercises,
    });
    setHiitName('');
    setHiitExText('');
    setShowHiitBuilder(false);
  };

  const handleCreateMobility = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = mobStepsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!mobName.trim() || lines.length === 0) return;

    onAddMobilityRoutine({
      id: `mob-${Date.now()}`,
      name: mobName.trim(),
      category: mobCat,
      subtitle: `${lines.length} упражнений`,
      steps: lines.map((line, i) => {
        const perSide = line.includes('*2');
        const cleaned = line.replace('*2', '').trim();
        const match = cleaned.match(/^(.*?)[\s-]+(\d+)\s*с?$/);
        const name = match ? match[1].trim() : cleaned;
        const durationSec = match ? Math.max(10, parseInt(match[2], 10)) : 45;
        return {
          id: `st-${Date.now()}-${i}`,
          name,
          durationSec,
          perSide,
        };
      }),
    });
    setMobName('');
    setMobStepsText('');
    setShowMobBuilder(false);
  };

  return (
    <div className="space-y-4 pb-28">
      <div className="pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Тренировки
        </h1>
      </div>

      {/* Segmented Control */}
      <div className="grid grid-cols-3 rounded-2xl bg-zinc-900 p-1">
        {[
          { id: 'strength' as const, label: 'Силовые', icon: Dumbbell },
          { id: 'hiit' as const, label: 'HIIT', icon: Zap },
          { id: 'mobility' as const, label: 'Зарядка', icon: Sparkles },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                active
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 active:text-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* STRENGTH TAB */}
      {tab === 'strength' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onStartStrength(null)}
            className="flex w-full items-center justify-between rounded-2xl bg-emerald-500 px-4 py-4 text-left text-zinc-950 shadow-lg shadow-emerald-500/15 active:scale-[0.98]"
          >
            <div>
              <p className="text-base font-extrabold">Свободная тренировка</p>
              <p className="text-xs font-medium text-zinc-900/80">
                Начни с чистого листа и добавляй упражнения по ходу
              </p>
            </div>
            <Play className="h-6 w-6 fill-current" />
          </button>

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Твои программы (нажми чтобы открыть план)
            </h2>
            <button
              type="button"
              onClick={() => setShowStrengthBuilder(true)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" /> Новая
            </button>
          </div>

          {data.strengthTemplates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => setPreviewStrengthId(tpl.id)}
              className="cursor-pointer rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-colors active:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white">{tpl.name}</h3>
                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    {tpl.exercises.length} упр.
                    {tpl.subtitle ? ` • ${tpl.subtitle}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStrengthTemplate(tpl.id);
                  }}
                  className="rounded-lg p-1.5 text-zinc-600 active:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-2.5 line-clamp-2 text-xs text-zinc-400">
                {tpl.exercises.map((e) => e.name).join(' • ')}
              </p>

              <div className="mt-3.5 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewStrengthId(tpl.id);
                  }}
                  className="flex-1 rounded-xl bg-zinc-800/80 py-2.5 text-xs font-semibold text-zinc-200 active:bg-zinc-700"
                >
                  Смотреть план
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartStrength(tpl);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-400 active:bg-emerald-500/25"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Начать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HIIT TAB */}
      {tab === 'hiit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Нажми на карточку, чтобы увидеть упражнения
            </p>
            <button
              type="button"
              onClick={() => setShowHiitBuilder(true)}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300"
            >
              <Plus className="h-3.5 w-3.5" /> Свой
            </button>
          </div>

          {data.hiitPresets.map((preset) => {
            const totalMin = Math.ceil(
              (preset.warmupSec +
                preset.rounds * preset.workSec +
                (preset.rounds - 1) * preset.restSec) /
                60
            );
            return (
              <div
                key={preset.id}
                onClick={() => setPreviewHiit(preset)}
                className="cursor-pointer rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-colors active:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white">
                        {preset.name}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    </div>
                    {preset.subtitle && (
                      <p className="text-xs text-zinc-400">{preset.subtitle}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHiitPreset(preset.id);
                    }}
                    className="rounded-lg p-1.5 text-zinc-600 active:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-emerald-300">
                    Работа {preset.workSec}с
                  </span>
                  <span className="rounded-lg bg-sky-500/15 px-2.5 py-1 text-sky-300">
                    Отдых {preset.restSec}с
                  </span>
                  <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-zinc-300">
                    {preset.rounds} раундов • ~{totalMin} мин
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartHiit(preset);
                  }}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-extrabold text-zinc-950 active:scale-[0.98]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Запустить таймер
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MOBILITY / STRETCHING TAB */}
      {tab === 'mobility' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Нажми на карточку, чтобы увидеть шаги комплекса
            </p>
            <button
              type="button"
              onClick={() => setShowMobBuilder(true)}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300"
            >
              <Plus className="h-3.5 w-3.5" /> Свой
            </button>
          </div>

          {data.mobilityRoutines.map((routine) => {
            const totalSec = routine.steps.reduce(
              (acc, s) => acc + s.durationSec * (s.perSide ? 2 : 1),
              0
            );
            const catLabel =
              routine.category === 'morning'
                ? 'Зарядка'
                : routine.category === 'stretch'
                  ? 'Растяжка'
                  : 'Мобильность';

            return (
              <div
                key={routine.id}
                onClick={() => setPreviewMobility(routine)}
                className="cursor-pointer rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-colors active:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                        {catLabel}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <Clock className="h-3 w-3" /> ~{Math.ceil(totalSec / 60)}{' '}
                        мин
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white">
                        {routine.name}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    </div>
                    {routine.subtitle && (
                      <p className="text-xs text-zinc-400">{routine.subtitle}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMobilityRoutine(routine.id);
                    }}
                    className="rounded-lg p-1.5 text-zinc-600 active:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartMobility(routine);
                  }}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 py-2.5 text-xs font-bold text-white active:scale-[0.98]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Начать комплекс
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* STRENGTH PLAN PREVIEW MODAL */}
      {previewStrength && (
        <div
          onClick={() => setPreviewStrengthId(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 safe-bottom"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  План силовой тренировки
                </p>
                <h3 className="mt-0.5 text-xl font-bold text-white">
                  {previewStrength.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewStrengthId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {previewStrength.exercises.map((ex, idx) => {
                const prev = getPreviousExerciseSets(data.sessions, ex.name);
                const prevWeight = prev?.[0]?.weight;
                return (
                  <div
                    key={`${ex.name}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs font-bold text-zinc-400">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-100">
                          {ex.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {ex.defaultSets} подх. × {ex.defaultReps} повт.
                          {prevWeight ? ` • прошл. ${prevWeight} кг` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExFromPreview(idx)}
                      className="rounded-lg p-1.5 text-zinc-600 active:text-red-400"
                      title="Убрать из плана"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick add exercise to this template */}
            <form
              onSubmit={handleAddExToPreview}
              className="mt-3 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Добавить упражнение в план..."
                value={quickExName}
                onChange={(e) => setQuickExName(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-xl bg-zinc-900 px-3 text-xs text-white ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-10 items-center justify-center rounded-xl bg-zinc-800 px-3 text-emerald-400 active:bg-zinc-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                const tpl = previewStrength;
                setPreviewStrengthId(null);
                onStartStrength(tpl);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-extrabold text-zinc-950 active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-current" />
              Начать эту тренировку
            </button>
          </div>
        </div>
      )}

      {/* HIIT PLAN PREVIEW MODAL */}
      {previewHiit && (
        <div
          onClick={() => setPreviewHiit(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 safe-bottom"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  План HIIT • {previewHiit.rounds} раундов
                </p>
                <h3 className="mt-0.5 text-xl font-bold text-white">
                  {previewHiit.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewHiit(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex gap-2 text-xs font-semibold">
              <span className="rounded-xl bg-emerald-500/15 px-3 py-1.5 text-emerald-300">
                Работа: {previewHiit.workSec}с
              </span>
              <span className="rounded-xl bg-sky-500/15 px-3 py-1.5 text-sky-300">
                Отдых: {previewHiit.restSec}с
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {previewHiit.exercises.length > 0 ? (
                previewHiit.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-3 text-sm font-medium text-zinc-100"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs text-zinc-400">
                      {i + 1}
                    </span>
                    {ex}
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400">
                  Свободный интервальный таймер без фиксированных упражнений.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const p = previewHiit;
                setPreviewHiit(null);
                onStartHiit(p);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-zinc-950 active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-current" />
              Запустить таймер
            </button>
          </div>
        </div>
      )}

      {/* MOBILITY PLAN PREVIEW MODAL */}
      {previewMobility && (
        <div
          onClick={() => setPreviewMobility(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 safe-bottom"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                  План комплекса
                </p>
                <h3 className="mt-0.5 text-xl font-bold text-white">
                  {previewMobility.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMobility(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {previewMobility.steps.map((s, i) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-100">
                      {i + 1}. {s.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-violet-300">
                      {s.durationSec}с{s.perSide ? ' ×2' : ''}
                    </span>
                  </div>
                  {s.cue && (
                    <p className="mt-1 text-xs text-zinc-400">{s.cue}</p>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const r = previewMobility;
                setPreviewMobility(null);
                onStartMobility(r);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-3.5 text-sm font-bold text-white active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-current" />
              Начать комплекс
            </button>
          </div>
        </div>
      )}

      {/* Strength Template Builder Modal */}
      {showStrengthBuilder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateTemplate}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 safe-bottom"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Новая программа</h3>
              <button
                type="button"
                onClick={() => setShowStrengthBuilder(false)}
                className="text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Название (например: Спина + Бицепс)"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              className="mb-3 w-full rounded-xl bg-zinc-900 px-3.5 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
            />
            <textarea
              rows={5}
              required
              placeholder={'Упражнения (каждое с новой строки):\nПодтягивания\nТяга верхнего блока\nПодъём штанги на бицепс'}
              value={tplExercisesText}
              onChange={(e) => setTplExercisesText(e.target.value)}
              className="mb-4 w-full rounded-xl bg-zinc-900 px-3.5 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950"
            >
              Создать программу
            </button>
          </form>
        </div>
      )}

      {/* HIIT Builder Modal */}
      {showHiitBuilder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateHiit}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 safe-bottom"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Свой HIIT таймер</h3>
              <button
                type="button"
                onClick={() => setShowHiitBuilder(false)}
                className="text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Название (например: Моя Табата)"
              value={hiitName}
              onChange={(e) => setHiitName(e.target.value)}
              className="mb-3 w-full rounded-xl bg-zinc-900 px-3.5 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-amber-500 focus:outline-none"
            />
            <div className="mb-3 grid grid-cols-3 gap-2">
              <label className="text-xs text-zinc-400">
                Работа (с)
                <input
                  type="number"
                  value={hiitWork}
                  onChange={(e) => setHiitWork(parseInt(e.target.value, 10) || 20)}
                  className="mt-1 w-full rounded-xl bg-zinc-900 px-3 py-2.5 text-center font-mono text-sm text-white ring-1 ring-zinc-800"
                />
              </label>
              <label className="text-xs text-zinc-400">
                Отдых (с)
                <input
                  type="number"
                  value={hiitRest}
                  onChange={(e) => setHiitRest(parseInt(e.target.value, 10) || 10)}
                  className="mt-1 w-full rounded-xl bg-zinc-900 px-3 py-2.5 text-center font-mono text-sm text-white ring-1 ring-zinc-800"
                />
              </label>
              <label className="text-xs text-zinc-400">
                Раундов
                <input
                  type="number"
                  value={hiitRounds}
                  onChange={(e) => setHiitRounds(parseInt(e.target.value, 10) || 8)}
                  className="mt-1 w-full rounded-xl bg-zinc-900 px-3 py-2.5 text-center font-mono text-sm text-white ring-1 ring-zinc-800"
                />
              </label>
            </div>
            <textarea
              rows={3}
              placeholder={'Упражнения по кругу (необязательно, с новой строки):\nБёрпи\nПриседания\nПланка'}
              value={hiitExText}
              onChange={(e) => setHiitExText(e.target.value)}
              className="mb-4 w-full rounded-xl bg-zinc-900 px-3.5 py-3 text-sm text-white ring-1 ring-zinc-800 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-extrabold text-zinc-950"
            >
              Сохранить HIIT
            </button>
          </form>
        </div>
      )}

      {/* Mobility Builder Modal */}
      {showMobBuilder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateMobility}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 safe-bottom"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Свой комплекс</h3>
              <button
                type="button"
                onClick={() => setShowMobBuilder(false)}
                className="text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Название (например: Вечерняя растяжка)"
              value={mobName}
              onChange={(e) => setMobName(e.target.value)}
              className="mb-3 w-full rounded-xl bg-zinc-900 px-3.5 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-violet-500 focus:outline-none"
            />
            <div className="mb-3 grid grid-cols-3 gap-2">
              {(
                [
                  ['morning', 'Зарядка'],
                  ['stretch', 'Растяжка'],
                  ['mobility', 'Мобильность'],
                ] as const
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMobCat(cat)}
                  className={`rounded-xl py-2 text-xs font-semibold ${
                    mobCat === cat
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              rows={5}
              required
              placeholder={'Упражнения (можно указать секунды и *2 для обеих сторон):\nКошка-Корова - 50\nВыпад - 40 *2\nПоза ребёнка - 60'}
              value={mobStepsText}
              onChange={(e) => setMobStepsText(e.target.value)}
              className="mb-4 w-full rounded-xl bg-zinc-900 px-3.5 py-3 text-sm text-white ring-1 ring-zinc-800 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-violet-500 py-3.5 text-sm font-bold text-white"
            >
              Создать комплекс
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
