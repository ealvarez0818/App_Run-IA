import { DEFAULT_APPS_SCRIPT_URL, WorkoutRecord } from '../types';
import { calculatePace, getTodayYYYYMMDD } from './pace';

const WORKOUTS_STORAGE_KEY = 'runtracker_sheets_workouts_v1';
const SCRIPT_URL_STORAGE_KEY = 'runtracker_sheets_script_url_v1';
const DEMO_MODE_STORAGE_KEY = 'runtracker_sheets_demo_mode_v1';

export function loadWorkouts(): WorkoutRecord[] {
  try {
    const raw = localStorage.getItem(WORKOUTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WorkoutRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveWorkouts(workouts: WorkoutRecord[]): void {
  try {
    localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadAppsScriptUrl(): string {
  try {
    const saved = localStorage.getItem(SCRIPT_URL_STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
    return DEFAULT_APPS_SCRIPT_URL;
  } catch {
    return DEFAULT_APPS_SCRIPT_URL;
  }
}

export function saveAppsScriptUrl(url: string): void {
  try {
    localStorage.setItem(SCRIPT_URL_STORAGE_KEY, url.trim());
  } catch {
    // Ignore storage errors
  }
}

export function loadDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveDemoMode(enabled: boolean): void {
  try {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

export function buildSampleWorkouts(): WorkoutRecord[] {
  const today = getTodayYYYYMMDD();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  const threeDaysAgoDate = new Date();
  threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3);
  const threeDaysAgo = `${threeDaysAgoDate.getFullYear()}-${String(threeDaysAgoDate.getMonth() + 1).padStart(2, '0')}-${String(threeDaysAgoDate.getDate()).padStart(2, '0')}`;

  return [
    {
      id: `demo-${Date.now()}-1`,
      fecha: today,
      tipo: 'Correr',
      distancia_km: 8.5,
      duracion_min: 42,
      notas: 'Rodaje progresivo por el parque, últimos 2 km a ritmo vivo.',
      ritmo: calculatePace(8.5, 42),
      syncStatus: 'local',
      aiFeedback:
        'Buen ritmo sostenido de 04:56 min/km en rodaje progresivo. Mantén la cadencia fluida y prioriza hidratación más 10 minutos de movilidad de cadera hoy.',
      createdAt: new Date().toISOString(),
    },
    {
      id: `demo-${Date.now()}-2`,
      fecha: yesterday,
      tipo: 'Trail',
      distancia_km: 12.2,
      duracion_min: 78,
      notas: 'Sendero técnico con desnivel positivo acumulado de 420 m.',
      ritmo: calculatePace(12.2, 78),
      syncStatus: 'local',
      createdAt: yesterdayDate.toISOString(),
    },
    {
      id: `demo-${Date.now()}-3`,
      fecha: threeDaysAgo,
      tipo: 'Caminata',
      distancia_km: 5.0,
      duracion_min: 52,
      notas: 'Recuperación activa al aire libre, pulsaciones muy bajas.',
      ritmo: calculatePace(5.0, 52),
      syncStatus: 'local',
      createdAt: threeDaysAgoDate.toISOString(),
    },
  ];
}
