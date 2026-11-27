import React, { useEffect, useState } from 'react';
import {
  Dumbbell,
  Flame,
  Settings,
  TrendingDown,
} from 'lucide-react';
import type {
  AppData,
  HiitPreset,
  MobilityRoutine,
  StrengthTemplate,
  UserSettings,
  WorkoutSession,
} from './types';
import { DEFAULT_APP_DATA } from './data/defaults';
import { loadAppData, saveAppData } from './db/storage';
import { getTodayStr } from './utils/analytics';
import { TodayView } from './views/TodayView';
import { WorkoutsView, type WorkoutTab } from './views/WorkoutsView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';
import { StrengthRunner } from './components/StrengthRunner';
import { HiitRunner } from './components/HiitRunner';
import { MobilityRunner } from './components/MobilityRunner';

type MainTab = 'today' | 'workouts' | 'progress' | 'settings';

export function App() {
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('today');
  const [workoutsSubTab, setWorkoutsSubTab] = useState<WorkoutTab>('strength');

  // Active fullscreen workout runners
  const [activeStrength, setActiveStrength] = useState<
    { template: StrengthTemplate | null } | null
  >(null);
  const [activeHiit, setActiveHiit] = useState<HiitPreset | null>(null);
  const [activeMobility, setActiveMobility] = useState<MobilityRoutine | null>(
    null
  );

  useEffect(() => {
    loadAppData().then((d) => {
      setData(d);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveAppData(data);
  }, [data, loaded]);

  const addSession = (session: WorkoutSession) => {
    setData((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
    }));
  };

  const deleteSession = (id: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== id),
    }));
  };

  const logWeight = (weightKg: number, date = getTodayStr()) => {
    setData((prev) => {
      const filtered = prev.weightEntries.filter((w) => w.date !== date);
      return {
        ...prev,
        weightEntries: [...filtered, { date, weightKg }].sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      };
    });
  };

  const deleteWeight = (date: string) => {
    setData((prev) => ({
      ...prev,
      weightEntries: prev.weightEntries.filter((w) => w.date !== date),
    }));
  };

  const toggleRestToday = () => {
    const today = getTodayStr();
    setData((prev) => {
      const exists = prev.settings.restDays.includes(today);
      const restDays = exists
        ? prev.settings.restDays.filter((d) => d !== today)
        : [...prev.settings.restDays, today];
      return {
        ...prev,
        settings: { ...prev.settings, restDays },
      };
    });
  };

  const updateSettings = (patch: Partial<UserSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  };

  if (!loaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-500">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-zinc-950 text-zinc-50 safe-top">
      <main className="px-4">
        {activeTab === 'today' && (
          <TodayView
            data={data}
            onQuickStartStrength={() => {
              setWorkoutsSubTab('strength');
              setActiveTab('workouts');
            }}
            onQuickStartHiit={() => {
              setWorkoutsSubTab('hiit');
              setActiveTab('workouts');
            }}
            onQuickStartMobility={() => {
              setWorkoutsSubTab('mobility');
              setActiveTab('workouts');
            }}
            onLogWeight={logWeight}
            onToggleRestToday={toggleRestToday}
            onOpenProgress={() => setActiveTab('progress')}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsView
            key={workoutsSubTab}
            data={data}
            initialTab={workoutsSubTab}
            onStartStrength={(tpl) => setActiveStrength({ template: tpl })}
            onStartHiit={(preset) => setActiveHiit(preset)}
            onStartMobility={(routine) => setActiveMobility(routine)}
            onAddStrengthTemplate={(tpl) =>
              setData((prev) => ({
                ...prev,
                strengthTemplates: [...prev.strengthTemplates, tpl],
              }))
            }
            onUpdateStrengthTemplate={(updated) =>
              setData((prev) => ({
                ...prev,
                strengthTemplates: prev.strengthTemplates.map((t) =>
                  t.id === updated.id ? updated : t
                ),
              }))
            }
            onDeleteStrengthTemplate={(id) =>
              setData((prev) => ({
                ...prev,
                strengthTemplates: prev.strengthTemplates.filter(
                  (t) => t.id !== id
                ),
              }))
            }
            onAddHiitPreset={(preset) =>
              setData((prev) => ({
                ...prev,
                hiitPresets: [...prev.hiitPresets, preset],
              }))
            }
            onDeleteHiitPreset={(id) =>
              setData((prev) => ({
                ...prev,
                hiitPresets: prev.hiitPresets.filter((p) => p.id !== id),
              }))
            }
            onAddMobilityRoutine={(routine) =>
              setData((prev) => ({
                ...prev,
                mobilityRoutines: [...prev.mobilityRoutines, routine],
              }))
            }
            onDeleteMobilityRoutine={(id) =>
              setData((prev) => ({
                ...prev,
                mobilityRoutines: prev.mobilityRoutines.filter(
                  (r) => r.id !== id
                ),
              }))
            }
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            data={data}
            onLogWeight={logWeight}
            onDeleteWeight={deleteWeight}
            onDeleteSession={deleteSession}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            data={data}
            onUpdateSettings={updateSettings}
            onImportData={(imported) => setData(imported)}
          />
        )}
      </main>

      {/* iOS Glassmorphic Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl safe-bottom">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 pt-2">
          {[
            { id: 'today' as const, label: 'Сегодня', icon: Flame },
            { id: 'workouts' as const, label: 'Тренировки', icon: Dumbbell },
            { id: 'progress' as const, label: 'Прогресс', icon: TrendingDown },
            { id: 'settings' as const, label: 'Настройки', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold transition-colors ${
                  active ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Fullscreen Workout Runners */}
      {activeStrength && (
        <StrengthRunner
          template={activeStrength.template}
          history={data.sessions}
          onComplete={addSession}
          onClose={() => setActiveStrength(null)}
        />
      )}

      {activeHiit && (
        <HiitRunner
          preset={activeHiit}
          soundEnabled={data.settings.soundEnabled}
          onComplete={addSession}
          onClose={() => setActiveHiit(null)}
        />
      )}

      {activeMobility && (
        <MobilityRunner
          routine={activeMobility}
          soundEnabled={data.settings.soundEnabled}
          onComplete={addSession}
          onClose={() => setActiveMobility(null)}
        />
      )}
    </div>
  );
}

export default App;
