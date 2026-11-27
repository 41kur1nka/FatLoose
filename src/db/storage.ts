import { DEFAULT_APP_DATA } from '../data/defaults';
import type { AppData } from '../types';

const DB_NAME = 'fatloose_pwa_db';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const KEY = 'app_data';
const LS_FALLBACK_KEY = 'fatloose_app_data_v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function mergeWithDefaults(raw: Partial<AppData> | null | undefined): AppData {
  if (!raw) return structuredClone(DEFAULT_APP_DATA);
  return {
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    strengthTemplates:
      Array.isArray(raw.strengthTemplates) && raw.strengthTemplates.length > 0
        ? raw.strengthTemplates
        : structuredClone(DEFAULT_APP_DATA.strengthTemplates),
    hiitPresets:
      Array.isArray(raw.hiitPresets) && raw.hiitPresets.length > 0
        ? raw.hiitPresets
        : structuredClone(DEFAULT_APP_DATA.hiitPresets),
    mobilityRoutines:
      Array.isArray(raw.mobilityRoutines) && raw.mobilityRoutines.length > 0
        ? raw.mobilityRoutines
        : structuredClone(DEFAULT_APP_DATA.mobilityRoutines),
    weightEntries: Array.isArray(raw.weightEntries) ? raw.weightEntries : [],
    settings: {
      ...DEFAULT_APP_DATA.settings,
      ...(raw.settings || {}),
      restDays: Array.isArray(raw.settings?.restDays) ? raw.settings.restDays : [],
    },
  };
}

export async function loadAppData(): Promise<AppData> {
  try {
    const db = await openDB();
    const data = await new Promise<AppData | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => resolve(req.result as AppData | undefined);
      req.onerror = () => reject(req.error);
    });
    if (data) return mergeWithDefaults(data);
  } catch {
    // Fallback to localStorage below
  }

  try {
    const ls = localStorage.getItem(LS_FALLBACK_KEY);
    if (ls) {
      return mergeWithDefaults(JSON.parse(ls) as Partial<AppData>);
    }
  } catch {
    // Ignore parse errors
  }

  return structuredClone(DEFAULT_APP_DATA);
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors on fallback
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback already saved in localStorage
  }
}

export function exportAppDataJSON(data: AppData): void {
  const payload = {
    app: 'FatLoose',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `fatloose-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedJSON(text: string): AppData {
  const parsed = JSON.parse(text);
  const candidate = parsed?.data ? parsed.data : parsed;
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('Некорректный формат файла бэкапа');
  }
  return mergeWithDefaults(candidate as Partial<AppData>);
}
