import type { AppData, StrengthSet, WeightEntry, WorkoutSession } from '../types';

export function getTodayStr(): string {
  const d = new Date();
  return formatDateLocal(d);
}

export function formatDateLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return formatDateLocal(dt);
}

export function formatShortDateRu(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function formatDuration(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export interface WeightTrendPoint {
  date: string;
  weightKg: number;
  trendKg: number;
  note?: string;
}

export interface WeightSummary {
  points: WeightTrendPoint[];
  latestRaw: number | null;
  latestTrend: number | null;
  weeklyDelta: number | null;
  totalDelta: number | null;
  remainingToTarget: number | null;
}

export function calculateWeightTrend(
  entries: WeightEntry[],
  startWeightKg: number | null,
  targetWeightKg: number | null
): WeightSummary {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return {
      points: [],
      latestRaw: null,
      latestTrend: null,
      weeklyDelta: null,
      totalDelta: null,
      remainingToTarget: null,
    };
  }

  // 7-day rolling window average based on calendar dates
  const points: WeightTrendPoint[] = sorted.map((entry, idx) => {
    const windowStart = addDays(entry.date, -6);
    let sum = 0;
    let count = 0;
    for (let i = idx; i >= 0; i--) {
      if (sorted[i].date >= windowStart) {
        sum += sorted[i].weightKg;
        count++;
      } else {
        break;
      }
    }
    const trendKg = Math.round((sum / count) * 100) / 100;
    return {
      date: entry.date,
      weightKg: entry.weightKg,
      trendKg,
      note: entry.note,
    };
  });

  const latest = points[points.length - 1];
  const baseWeight = startWeightKg ?? points[0].weightKg;
  const totalDelta = Math.round((latest.trendKg - baseWeight) * 10) / 10;

  // Weekly delta: compare latest trend with trend ~7 days earlier
  let weeklyDelta: number | null = null;
  if (points.length >= 2) {
    const targetPrevDate = addDays(latest.date, -7);
    let closest = points[0];
    let minDiff = Infinity;
    for (const p of points) {
      if (p.date === latest.date) continue;
      const diff = Math.abs(
        new Date(p.date).getTime() - new Date(targetPrevDate).getTime()
      );
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    const daysApart =
      (new Date(latest.date).getTime() - new Date(closest.date).getTime()) /
      86400000;
    if (daysApart >= 2) {
      const normalized = ((latest.trendKg - closest.trendKg) / daysApart) * 7;
      weeklyDelta = Math.round(normalized * 10) / 10;
    }
  }

  const remainingToTarget =
    targetWeightKg !== null
      ? Math.round((latest.trendKg - targetWeightKg) * 10) / 10
      : null;

  return {
    points,
    latestRaw: latest.weightKg,
    latestTrend: Math.round(latest.trendKg * 10) / 10,
    weeklyDelta,
    totalDelta,
    remainingToTarget,
  };
}

export interface StreakInfo {
  current: number;
  best: number;
  activeToday: boolean;
  restToday: boolean;
  thisWeekCount: number;
}

export function calculateStreak(
  sessions: WorkoutSession[],
  restDays: string[]
): StreakInfo {
  const workoutDates = new Set(sessions.map((s) => s.date));
  const restSet = new Set(restDays);
  const today = getTodayStr();
  const activeToday = workoutDates.has(today);
  const restToday = restSet.has(today);

  // Current streak: count backwards from today (or yesterday if today not yet logged)
  let current = 0;
  let cursor = activeToday || restToday ? today : addDays(today, -1);
  while (workoutDates.has(cursor) || restSet.has(cursor)) {
    if (workoutDates.has(cursor)) {
      current++;
    }
    cursor = addDays(cursor, -1);
  }

  // Best streak across all recorded dates
  const allDates = Array.from(new Set([...workoutDates, ...restSet])).sort();
  let best = current;
  let run = 0;
  let prev: string | null = null;
  for (const d of allDates) {
    if (prev && addDays(prev, 1) !== d) {
      run = 0;
    }
    if (workoutDates.has(d)) {
      run++;
      if (run > best) best = run;
    }
    prev = d;
  }

  // Sessions in current week (Monday -> Sunday)
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0..Sun=6
  const monday = addDays(today, -dayOfWeek);
  const thisWeekCount = sessions.filter((s) => s.date >= monday && s.date <= today).length;

  return { current, best, activeToday, restToday, thisWeekCount };
}

export interface ExercisePR {
  name: string;
  bestWeight: number;
  bestRepsAtWeight: number;
  best1RM: number;
  date: string;
}

export function calculateExercisePRs(sessions: WorkoutSession[]): Record<string, ExercisePR> {
  const map: Record<string, ExercisePR> = {};
  const strengthSessions = sessions
    .filter((s) => s.type === 'strength' && s.exercises)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  for (const session of strengthSessions) {
    for (const ex of session.exercises || []) {
      const key = ex.name.trim().toLowerCase();
      for (const set of ex.sets) {
        if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
        const est = estimate1RM(set.weight, set.reps);
        const existing = map[key];
        if (
          !existing ||
          est > existing.best1RM ||
          (est === existing.best1RM && set.weight > existing.bestWeight)
        ) {
          map[key] = {
            name: ex.name,
            bestWeight: set.weight,
            bestRepsAtWeight: set.reps,
            best1RM: est,
            date: session.date,
          };
        }
      }
    }
  }
  return map;
}

export function getPreviousExerciseSets(
  sessions: WorkoutSession[],
  exerciseName: string
): StrengthSet[] | null {
  const target = exerciseName.trim().toLowerCase();
  const sorted = sessions
    .filter((s) => s.type === 'strength' && s.exercises)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  for (const session of sorted) {
    const found = session.exercises?.find(
      (e) => e.name.trim().toLowerCase() === target
    );
    if (found && found.sets.some((s) => s.completed)) {
      return found.sets.filter((s) => s.completed);
    }
  }
  return null;
}

export interface HeatmapDay {
  date: string;
  count: number;
  types: string[];
  isRest: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function getHeatmapDays(
  sessions: WorkoutSession[],
  restDays: string[],
  weeks = 12
): HeatmapDay[] {
  const today = getTodayStr();
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0..Sun=6
  const endOfCurrentWeek = addDays(today, 6 - dayOfWeek);
  const totalDays = weeks * 7;
  const startDate = addDays(endOfCurrentWeek, -(totalDays - 1));

  const restSet = new Set(restDays);
  const byDate: Record<string, WorkoutSession[]> = {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }

  const days: HeatmapDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const list = byDate[date] || [];
    days.push({
      date,
      count: list.length,
      types: Array.from(new Set(list.map((s) => s.type))),
      isRest: restSet.has(date),
      isToday: date === today,
      isFuture: date > today,
    });
  }
  return days;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0..1
  progressLabel: string;
}

export function calculateAchievements(data: AppData): Achievement[] {
  const totalSessions = data.sessions.length;
  const strengthCount = data.sessions.filter((s) => s.type === 'strength').length;
  const hiitCount = data.sessions.filter((s) => s.type === 'hiit').length;
  const mobilityCount = data.sessions.filter((s) => s.type === 'mobility').length;
  const maxTonnage = data.sessions.reduce(
    (max, s) => Math.max(max, s.totalTonnage || 0),
    0
  );
  const streak = calculateStreak(data.sessions, data.settings.restDays);
  const weightSummary = calculateWeightTrend(
    data.weightEntries,
    data.settings.startWeightKg,
    data.settings.targetWeightKg
  );
  const lostKg =
    weightSummary.totalDelta !== null && weightSummary.totalDelta < 0
      ? Math.abs(weightSummary.totalDelta)
      : 0;

  return [
    {
      id: 'first-workout',
      title: 'Первый шаг',
      description: 'Заверши свою первую тренировку',
      icon: '🚀',
      unlocked: totalSessions >= 1,
      progress: Math.min(1, totalSessions / 1),
      progressLabel: `${Math.min(1, totalSessions)}/1`,
    },
    {
      id: 'streak-7',
      title: 'Неделя в огне',
      description: '7 активных тренировок в серии',
      icon: '🔥',
      unlocked: streak.best >= 7,
      progress: Math.min(1, streak.best / 7),
      progressLabel: `${Math.min(7, streak.best)}/7`,
    },
    {
      id: 'iron-10',
      title: 'Железная привычка',
      description: '10 силовых тренировок в зале',
      icon: '🏋️',
      unlocked: strengthCount >= 10,
      progress: Math.min(1, strengthCount / 10),
      progressLabel: `${Math.min(10, strengthCount)}/10`,
    },
    {
      id: 'tonnage-5k',
      title: '5 тонн за раз',
      description: 'Подними 5 000 кг суммарно за одну тренировку',
      icon: '⚡',
      unlocked: maxTonnage >= 5000,
      progress: Math.min(1, maxTonnage / 5000),
      progressLabel: `${Math.min(5000, Math.round(maxTonnage))} / 5000 кг`,
    },
    {
      id: 'hiit-5',
      title: 'Жиросжигатель',
      description: 'Заверши 5 домашних HIIT-сессий',
      icon: '💥',
      unlocked: hiitCount >= 5,
      progress: Math.min(1, hiitCount / 5),
      progressLabel: `${Math.min(5, hiitCount)}/5`,
    },
    {
      id: 'mobility-7',
      title: 'Гибкость и тонус',
      description: '7 зарядок, растяжек или сессий мобильности',
      icon: '🧘',
      unlocked: mobilityCount >= 7,
      progress: Math.min(1, mobilityCount / 7),
      progressLabel: `${Math.min(7, mobilityCount)}/7`,
    },
    {
      id: 'weight-log-14',
      title: 'Контроль тренда',
      description: 'Запиши вес 14 раз для точного графика',
      icon: '📉',
      unlocked: data.weightEntries.length >= 14,
      progress: Math.min(1, data.weightEntries.length / 14),
      progressLabel: `${Math.min(14, data.weightEntries.length)}/14`,
    },
    {
      id: 'minus-2kg',
      title: 'Минус 2 кг по тренду',
      description: 'Снизь средний 7-дневный вес на 2 кг',
      icon: '🏆',
      unlocked: lostKg >= 2,
      progress: Math.min(1, lostKg / 2),
      progressLabel: `${lostKg.toFixed(1)} / 2.0 кг`,
    },
  ];
}
