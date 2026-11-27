import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { MobilityRoutine, WorkoutSession } from '../types';
import {
  playCountdownTick,
  playFinishFanfare,
  playStepTransition,
  unlockAudio,
} from '../utils/audio';
import { useWakeLock } from '../utils/wakeLock';
import { formatDuration, getTodayStr } from '../utils/analytics';

interface MobilityRunnerProps {
  routine: MobilityRoutine;
  soundEnabled: boolean;
  onComplete: (session: WorkoutSession) => void;
  onClose: () => void;
}

interface ExpandedStep {
  id: string;
  name: string;
  sideLabel?: string;
  durationSec: number;
  cue?: string;
}

export const MobilityRunner: React.FC<MobilityRunnerProps> = ({
  routine,
  soundEnabled: initialSound,
  onComplete,
  onClose,
}) => {
  const expandedSteps = useMemo<ExpandedStep[]>(() => {
    const out: ExpandedStep[] = [];
    for (const s of routine.steps) {
      if (s.perSide) {
        out.push({
          id: `${s.id}-L`,
          name: s.name,
          sideLabel: 'Левая сторона',
          durationSec: s.durationSec,
          cue: s.cue,
        });
        out.push({
          id: `${s.id}-R`,
          name: s.name,
          sideLabel: 'Правая сторона',
          durationSec: s.durationSec,
          cue: s.cue,
        });
      } else {
        out.push({
          id: s.id,
          name: s.name,
          durationSec: s.durationSec,
          cue: s.cue,
        });
      }
    }
    return out;
  }, [routine]);

  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(initialSound);
  const [remainingMs, setRemainingMs] = useState(
    (expandedSteps[0]?.durationSec || 30) * 1000
  );

  const startedAtRef = useRef<number>(Date.now());
  const stepEndRef = useRef<number>(0);
  const lastBeepSecRef = useRef<number>(-1);
  const savedRef = useRef(false);

  const isRunning = started && !done && !paused;
  const wakeLocked = useWakeLock(isRunning);

  const currentStep = expandedSteps[stepIdx];
  const nextStep = expandedSteps[stepIdx + 1];

  const totalRoutineSec = useMemo(
    () => expandedSteps.reduce((acc, s) => acc + s.durationSec, 0),
    [expandedSteps]
  );

  const goToStep = (idx: number, playChime = true) => {
    if (idx >= expandedSteps.length) {
      finishRoutine();
      return;
    }
    const clamped = Math.max(0, idx);
    setStepIdx(clamped);
    const ms = expandedSteps[clamped].durationSec * 1000;
    setRemainingMs(ms);
    stepEndRef.current = Date.now() + ms;
    lastBeepSecRef.current = -1;
    if (playChime) playStepTransition(soundOn);
  };

  const handleStart = () => {
    unlockAudio();
    startedAtRef.current = Date.now();
    setStarted(true);
    setPaused(false);
    goToStep(0, true);
  };

  const togglePause = () => {
    unlockAudio();
    if (paused) {
      stepEndRef.current = Date.now() + remainingMs;
      setPaused(false);
    } else {
      setRemainingMs(Math.max(0, stepEndRef.current - Date.now()));
      setPaused(true);
    }
  };

  const finishRoutine = () => {
    setDone(true);
    playFinishFanfare(soundOn);
    if (!savedRef.current) {
      savedRef.current = true;
      const elapsedSec = Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000)
      );
      onComplete({
        id: `sess-${Date.now()}`,
        type: 'mobility',
        title: routine.name,
        date: getTodayStr(),
        startedAt: new Date(startedAtRef.current).toISOString(),
        durationSec: elapsedSec,
        stepsCompleted: expandedSteps.length,
      });
    }
  };

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      const left = stepEndRef.current - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        goToStep(stepIdx + 1, true);
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
  }, [isRunning, stepIdx, soundOn]);

  const displaySec = Math.ceil(remainingMs / 1000);
  const progress = currentStep
    ? Math.max(0, Math.min(1, remainingMs / (currentStep.durationSec * 1000)))
    : 0;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-gradient-to-b from-violet-950/60 via-zinc-950 to-zinc-950 px-5 safe-top safe-bottom">
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
          <p className="text-xs font-medium text-zinc-400">{routine.name}</p>
          {started && !done && (
            <p className="text-xs font-semibold text-violet-300">
              Шаг {stepIdx + 1} из {expandedSteps.length}
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

      {/* Preview before start */}
      {!started && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
            {expandedSteps.length} шагов • ~{Math.ceil(totalRoutineSec / 60)} мин
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white">{routine.name}</h2>
          {routine.subtitle && (
            <p className="mt-1.5 text-sm text-zinc-400">{routine.subtitle}</p>
          )}

          <div className="mt-6 max-h-64 w-full max-w-sm overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left">
            <ul className="space-y-2.5">
              {routine.steps.map((s, i) => (
                <li key={s.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium text-zinc-100">
                      {i + 1}. {s.name}
                    </span>
                    {s.perSide && (
                      <span className="ml-1.5 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300">
                        на обе стороны
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-xs text-zinc-400">
                    {s.durationSec}с{s.perSide ? '×2' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 text-lg font-bold text-white shadow-lg shadow-violet-500/20 active:scale-[0.98]"
          >
            <Play className="h-5 w-5 fill-current" />
            Начать комплекс
          </button>
        </div>
      )}

      {/* Active Step Player */}
      {started && !done && currentStep && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {wakeLocked && (
            <span className="mb-4 inline-flex items-center gap-1 rounded-full bg-zinc-900/80 px-2.5 py-0.5 text-[10px] text-amber-300">
              <Sun className="h-3 w-3" /> Экран не погаснет
            </span>
          )}

          {/* Circular Ring Timer */}
          <div className="relative flex items-center justify-center">
            <svg width="216" height="216" className="-rotate-90">
              <circle
                cx="108"
                cy="108"
                r={radius}
                fill="none"
                stroke="#27272a"
                strokeWidth="10"
              />
              <circle
                cx="108"
                cy="108"
                r={radius}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-100"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-6xl font-black text-white tabular-nums">
                {displaySec}
              </span>
              <span className="text-xs text-zinc-400">секунд</span>
            </div>
          </div>

          {currentStep.sideLabel && (
            <span className="mt-5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300">
              {currentStep.sideLabel}
            </span>
          )}

          <h3 className="mt-3 max-w-sm text-2xl font-bold text-white">
            {currentStep.name}
          </h3>
          {currentStep.cue && (
            <p className="mt-2 max-w-xs text-sm text-zinc-400">{currentStep.cue}</p>
          )}

          {nextStep && (
            <div className="mt-6 rounded-xl bg-zinc-900/70 px-4 py-2 text-xs text-zinc-400">
              Дальше:{' '}
              <span className="font-medium text-zinc-200">
                {nextStep.name}
                {nextStep.sideLabel ? ` (${nextStep.sideLabel})` : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Done */}
      {done && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-white">Тело скажет спасибо!</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {routine.name} завершён ({formatDuration(Math.round((Date.now() - startedAtRef.current) / 1000))}).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full max-w-xs rounded-2xl bg-violet-500 py-4 text-base font-bold text-white active:scale-[0.98]"
          >
            Готово
          </button>
        </div>
      )}

      {/* Controls */}
      {started && !done && (
        <div className="flex items-center justify-center gap-3 pb-4">
          <button
            type="button"
            onClick={() => goToStep(stepIdx - 1, false)}
            disabled={stepIdx === 0}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-200 disabled:opacity-30 active:scale-95"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePause}
            className="flex h-14 flex-1 max-w-[180px] items-center justify-center gap-2 rounded-2xl bg-zinc-100 text-base font-bold text-zinc-950 active:scale-95"
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
            onClick={() => goToStep(stepIdx + 1, true)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-200 active:scale-95"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
