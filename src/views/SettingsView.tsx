import React, { useRef, useState } from 'react';
import {
  Download,
  Share,
  Smartphone,
  Upload,
  Volume2,
} from 'lucide-react';
import type { AppData, UserSettings } from '../types';
import { exportAppDataJSON, parseImportedJSON } from '../db/storage';
import { playGoSignal, unlockAudio } from '../utils/audio';

interface SettingsViewProps {
  data: AppData;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onImportData: (newData: AppData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onUpdateSettings,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImportedJSON(text);
      onImportData(parsed);
      setImportMsg('Бэкап успешно восстановлен!');
    } catch (err) {
      setImportMsg(
        err instanceof Error ? err.message : 'Ошибка чтения файла бэкапа'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 pb-28">
      <div className="pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Настройки
        </h1>
      </div>

      {/* Goals */}
      <div className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Цели
        </h2>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              Тренировок в неделю
            </p>
            <p className="text-xs text-zinc-500">Для прогресса на главном экране</p>
          </div>
          <div className="flex items-center gap-2">
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onUpdateSettings({ weeklyGoal: n })}
                className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-bold ${
                  data.settings.weeklyGoal === n
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <label className="text-xs text-zinc-400">
            Стартовый вес (кг)
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="Авто"
              value={data.settings.startWeightKg ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onUpdateSettings({
                  startWeightKg: isNaN(v) ? null : v,
                });
              }}
              className="mt-1.5 h-10 w-full rounded-xl bg-zinc-950 px-3 font-mono text-sm text-white ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Целевой вес (кг)
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="Например 78"
              value={data.settings.targetWeightKg ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onUpdateSettings({
                  targetWeightKg: isNaN(v) ? null : v,
                });
              }}
              className="mt-1.5 h-10 w-full rounded-xl bg-zinc-950 px-3 font-mono text-sm text-white ring-1 ring-zinc-800 focus:ring-emerald-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Sound */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              Звуковые сигналы (HIIT / Зарядка)
            </p>
            <p className="text-xs text-zinc-500">
              Отсчёт 3-2-1 и смена фаз. В силовых всегда тихо.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ soundEnabled: !data.settings.soundEnabled })
            }
            className={`relative h-7 w-12 rounded-full transition-colors ${
              data.settings.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                data.settings.soundEnabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            playGoSignal(true);
          }}
          className="mt-3 flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 active:scale-95"
        >
          <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
          Проверить звук
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Данные и Бэкап
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Всё хранится локально на твоём iPhone (IndexedDB). Периодически сохраняй JSON-копию в «Файлы» / iCloud Drive.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => exportAppDataJSON(data)}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-xs font-bold text-white active:scale-95"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            Экспорт JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-xs font-bold text-white active:scale-95"
          >
            <Upload className="h-4 w-4 text-sky-400" />
            Импорт JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {importMsg && (
          <p className="text-xs font-medium text-emerald-400">{importMsg}</p>
        )}
      </div>

      {/* iPhone Install Guide */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Smartphone className="h-4 w-4 text-emerald-400" />
          Как установить на iPhone как приложение
        </div>
        <ol className="mt-2.5 space-y-1.5 text-xs text-zinc-400">
          <li>1. Открой сайт в Safari на iPhone.</li>
          <li className="flex items-center gap-1">
            2. Нажми кнопку <Share className="inline h-3.5 w-3.5 text-sky-400" />{' '}
            «Поделиться» внизу экрана.
          </li>
          <li>3. Выбери «На экран „Домой“» → «Добавить».</li>
          <li>4. Готово! Работает полноэкранно и полностью оффлайн.</li>
        </ol>
      </div>
    </div>
  );
};
