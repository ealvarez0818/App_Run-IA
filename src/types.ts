export type WorkoutType = 'Correr' | 'Caminata' | 'Trail';

export type WorkoutFilter = 'Todos' | WorkoutType;

export type SyncStatus = 'sheets' | 'local';

export interface WorkoutPayload {
  fecha: string;
  tipo: WorkoutType;
  distancia_km: number;
  duracion_min: number;
  notas: string;
}

export interface WorkoutRecord extends WorkoutPayload {
  id: string;
  ritmo: string;
  syncStatus: SyncStatus;
  aiFeedback?: string;
  createdAt: string;
}

export const WORKOUT_TYPES: WorkoutType[] = ['Correr', 'Caminata', 'Trail'];

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyQq8dbXdXuNeicqzAa0bKuecidfsiX7GFk86JPrmjY8nNqVPJ_E0wSkzZxucsn8EnA/exec';
