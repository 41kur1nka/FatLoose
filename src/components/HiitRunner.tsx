import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Pause,
  Play,
  SkipForward,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { HiitPreset, WorkoutSession } from '../types';
import {
  playCountdownTick,
  playFinishFanfare,
  playGoSignal,
  playRestSignal,
  unlockAudio,
} from '../utils/audio';
import { useWakeLock } from '../utils/wakeLock';
import { formatDuration, getTodayStr } from '../utils/analytics';

interface HiitRunnerProps {
  preset: HiitPreset;
  soundEnabled: boolean;
  onComplete: (session: WorkoutSession) => void;
  onClose: () => void;
}

type Phase = 'ready' | 'warmup' | 'work' | 'rest' | 'done';

export const HiitRunner: React.FC<HiitRunnerProps> = ({
  preset,
  soundEnabled: initialSound,
  onComplete,
  onClose,
}) => {
  const [phase, setPhase] = useState<Phase>('ready');
  const [round, setRound] = useState(1);
  const [remainingMs, setRemainingMs] = useState(preset.warmupSec * 1000);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(initialSound);
  const startedAtRef = useRef<number>(Date.now());
  const phaseEndRef = useRef<number>(0);
  const lastBeepSecRef = useRef<number>(-1);
  const savedRef = useRef(false);

  const isRunning =
    (phase === 'warmup' || phase === 'work' || phase === 'rest') && !paused;
  const wakeLocked = useWakeLock(isRunning);

  const currentExercise =
    preset.exercises.length > 0
      ? preset.exercises[(round - 1) % preset.exercises.length]
      : `Раунд ${round}`;

  const nextExercise =
    preset.exercises.length > 0 && round < preset.rounds
      ? preset.exercises[round % preset.exercises.length]
      : round < preset.rounds
        ? `Раунд ${round + 1}`
        : 'Финиш!';

  const startPhase = (nextPhase: Phase, durationSec: number, nextRound?: number) => {
    if (nextRound !== undefined) setRound(nextRound);
    setPhase(nextPhase);
    const ms = durationSec * 1000;
    setRemainingMs(ms);
    phaseEndRef.current = Date.now() + ms;
    lastBeepSecRef.current = -1;

    if (nextPhase === 'work') playGoSignal(soundOn);
    else if (nextPhase === 'rest') playRestSignal(soundOn);
    else if (nextPhase === 'done') playFinishFanfare(soundOn);
  };

  const handleStart = () => {
    unlockAudio();
    startedAtRef.current = Date.now();
    setPaused(false);
    if (preset.warmupSec > 0) {
      startPhase('warmup', preset.warmupSec, 1);
    } else {
      startPhase('work', preset.workSec, 1);
    }
  };

  const togglePause = () => {
    unlockAudio();
    if (paused) {
      phaseEndRef.current = Date.now() + remainingMs;
      setPaused(false);
    } else {
      setRemainingMs(Math.max(0, phaseEndRef.current - Date.now()));
      setPaused(true);
    }
  };

  const advancePhase = () => {
    if (phase === 'warmup') {
      startPhase('work', preset.workSec, 1);
    } else if (phase === 'work') {
      if (round >= preset.rounds) {
        finishSession();
      } else if (preset.restSec > 0) {
        startPhase('rest', preset.restSec, round);
      } else {
        startPhase('work', preset.workSec, round + 1);
      }
    } else if (phase === 'rest') {
      startPhase('work', preset.workSec, round + 1);
    }
  };

  const finishSession = () => {
    startPhase('done', 0);
    if (!savedRef.current) {
      savedRef.current = true;
      const elapsedSec = Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000)
      );
      onComplete({
        id: `sess-${Date.now()}`,
        type: 'hiit',
        title: preset.name,
        date: getTodayStr(),
        startedAt: new Date(startedAtRef.current).toISOString(),
        durationSec: elapsedSec,
        roundsCompleted: preset.rounds,
        workSec: preset.workSec,
        restSec: preset.restSec,
      });
    }
  };

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      const left = phaseEndRef.current - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        advancePhase();
      } else {
        setRemainingMs(left);
        const sec = Math.ceil(left / 1000);
        if (sec <= 3 && sec >= 1 && sec !== lastBeepSecRef.current) {
          lastBeepSecRef.current = sec;
          playCountdownTick(soundOn);
        }
      }
    }, 80);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, phase, round, soundOn]);

  const bgClass =
    phase === 'work'
      ? 'bg-gradient-to-b from-emerald-950 via-zinc-950 to-zinc-950'
      : phase === 'rest'
        ? 'bg-gradient-to-b from-sky-950 via-zinc-950 to-zinc-950'
        : phase === 'warmup'
          ? 'bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950'
          : 'bg-zinc-950';

  const accentText =
    phase === 'work'
      ? 'text-emerald-400'
      : phase === 'rest'
        ? 'text-sky-400'
        : phase === 'warmup'
          ? 'text-amber-400'
          : 'text-emerald-400';

  const displaySec = Math.ceil(remainingMs / 1000);
  const totalPhaseSec =
    phase === 'warmup'
      ? preset.warmupSec
      : phase === 'work'
        ? preset.workSec
        : preset.restSec;
  const progressPct =
    totalPhaseSec > 0
      ? Math.max(0, Math.min(100, (remainingMs / (totalPhaseSec * 1000)) * 100))
      : 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between px-5 safe-top safe-bottom transition-colors duration-500 ${bgClass}`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-300 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <p className="text-xs font-medium text-zinc-400">{preset.name}</p>
          {phase !== 'ready' && phase !== 'done' && (
            <p className="text-xs font-semibold text-zinc-200">
              Раунд {round} из {preset.rounds}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSoundOn((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-300 active:scale-95"
        >
          {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-zinc-500" />}
        </button>
      </div>

      {/* Main Content */}
      {phase === 'ready' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            HIIT • {preset.rounds} раундов
          </span>
          <h2 className="mt-3 text-3xl font-bold text-zinc-50">{preset.name}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Работа {preset.workSec}с • Отдых {preset.restSec}с • Всего ~
            {Math.ceil(
              (preset.warmupSec +
                preset.rounds * preset.workSec +
                (preset.rounds - 1) * preset.restSec) /
                60
            )}{' '}
            мин
          </p>

          {preset.exercises.length > 0 && (
            <div className="mt-6 w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Упражнения по кругу
              </p>
              <ul className="space-y-1.5 text-sm text-zinc-200">
                {preset.exercises.map((ex, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[11px] text-zinc-400">
                      {i + 1}
                    </span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleStart}
            className="mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            <Play className="h-5 w-5 fill-current" />
            Поехали!
          </button>
        </div>
      )}

      {(phase === 'warmup' || phase === 'work' || phase === 'rest') && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`text-sm font-extrabold uppercase tracking-[0.2em] ${accentText}`}
            >
              {phase === 'warmup'
                ? 'Приготовься'
                : phase === 'work'
                  ? 'РАБОТАЙ!'
                  : 'ОТДЫХ'}
            </span>
            {wakeLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] text-amber-300">
                <Sun className="h-3 w-3" /> Экран активен
              </span>
            )}
          </div>

          <div className="my-2 font-mono text-[112px] font-black leading-none tracking-tight text-white tabular-nums">
            {displaySec}
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800/80">
            <div
              className={`h-full transition-all duration-100 ${
                phase === 'work'
                  ? 'bg-emerald-400'
                  : phase === 'rest'
                    ? 'bg-sky-400'
                    : 'bg-amber-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="mt-8 max-w-sm">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {phase === 'rest' ? 'Дальше' : 'Сейчас'}
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {phase === 'rest' ? nextExercise : currentExercise}
            </p>
            {phase === 'work' && (
              <p className="mt-2 text-xs text-zinc-400">
                Следующее: {nextExercise}
              </p>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-white">Огонь! Готово!</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {preset.name} записан в твою историю и карту активности.
          </p>
          <div className="mt-6 grid w-full max-w-xs grid-cols-2 gap-3">
            <div className="rounded-2xl bg-zinc-900/80 p-3">
              <p className="text-xs text-zinc-500">Раундов</p>
              <p className="text-xl font-bold text-zinc-100">{preset.rounds}</p>
            </div>
            <div className="rounded-2xl bg-zinc-900/80 p-3">
              <p className="text-xs text-zinc-500">Время</p>
              <p className="text-xl font-bold text-zinc-100">
                {formatDuration(
                  Math.round((Date.now() - startedAtRef.current) / 1000)
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full max-w-xs rounded-2xl bg-emerald-500 py-4 text-base font-bold text-zinc-950 active:scale-[0.98]"
          >
            Отлично
          </button>
        </div>
      )}

      {/* Bottom Controls */}
      {phase !== 'ready' && phase !== 'done' && (
        <div className="flex items-center justify-center gap-4 pb-4">
          <button
            type="button"
            onClick={togglePause}
            className="flex h-16 w-40 items-center justify-center gap-2 rounded-2xl bg-zinc-100 text-base font-bold text-zinc-950 active:scale-95"
          >
            {paused ? (
              <>
                <Play className="h-5 w-5 fill-current" /> Продолжить
              </>
            ) : (
              <>
                <Pause className="h-5 w-5 fill-current" /> Пауза
              </>
            )}
          </button>
          <button
            type="button"
            onClick={advancePhase}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-200 active:scale-95"
            aria-label="Пропустить фазу"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
