export type WorkoutType = 'strength' | 'hiit' | 'mobility';

export interface StrengthSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  isPR?: boolean;
}

export interface StrengthExerciseLog {
  id: string;
  name: string;
  sets: StrengthSet[];
}

export interface StrengthTemplateExercise {
  name: string;
  defaultSets: number;
  defaultReps: number;
}

export interface StrengthTemplate {
  id: string;
  name: string;
  subtitle?: string;
  exercises: StrengthTemplateExercise[];
}

export interface HiitPreset {
  id: string;
  name: string;
  subtitle?: string;
  warmupSec: number;
  workSec: number;
  restSec: number;
  rounds: number;
  exercises: string[];
}

export interface MobilityStep {
  id: string;
  name: string;
  durationSec: number;
  cue?: string;
  perSide?: boolean;
}

export type MobilityCategory = 'morning' | 'stretch' | 'mobility';

export interface MobilityRoutine {
  id: string;
  name: string;
  category: MobilityCategory;
  subtitle?: string;
  steps: MobilityStep[];
}

export interface WorkoutSession {
  id: string;
  type: WorkoutType;
  title: string;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO
  durationSec: number;
  // Strength specific
  exercises?: StrengthExerciseLog[];
  totalTonnage?: number;
  totalSets?: number;
  prsCount?: number;
  // HIIT specific
  roundsCompleted?: number;
  workSec?: number;
  restSec?: number;
  // Mobility specific
  stepsCompleted?: number;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD (unique per day)
  weightKg: number;
  note?: string;
}

export interface UserSettings {
  targetWeightKg: number | null;
  startWeightKg: number | null;
  weeklyGoal: number; // sessions per week
  soundEnabled: boolean;
  restDays: string[]; // YYYY-MM-DD marked as planned rest / streak freeze
}

export interface AppData {
  sessions: WorkoutSession[];
  strengthTemplates: StrengthTemplate[];
  hiitPresets: HiitPreset[];
  mobilityRoutines: MobilityRoutine[];
  weightEntries: WeightEntry[];
  settings: UserSettings;
}
