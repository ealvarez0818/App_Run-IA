import { WorkoutType } from '../types';

export interface AnalyzeWorkoutInput {
  fecha: string;
  tipo: WorkoutType;
  distancia_km: number;
  duracion_min: number;
  notas: string;
  ritmo: string;
}

export async function analyzeWorkoutWithGemini(input: AnalyzeWorkoutInput): Promise<string> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => ({}))) as {
    feedback?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.error || 'No se pudo obtener el análisis de entrenamiento en este momento.'
    );
  }

  if (!data.feedback) {
    throw new Error('El análisis no devolvió contenido.');
  }

  return data.feedback;
}
