import { WorkoutPayload } from '../types';

export async function sendWorkoutToGoogleSheets(
  scriptUrl: string,
  payload: WorkoutPayload
): Promise<void> {
  const trimmedUrl = scriptUrl.trim();
  if (!trimmedUrl) {
    throw new Error('Configura una URL de Google Apps Script (/exec) válida antes de enviar.');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    throw new Error('La URL de Google Apps Script no tiene un formato válido.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('La URL debe comenzar con https://');
  }

  const exactBody: WorkoutPayload = {
    fecha: payload.fecha,
    tipo: payload.tipo,
    distancia_km: payload.distancia_km,
    duracion_min: payload.duracion_min,
    notas: payload.notas,
  };

  await fetch(trimmedUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(exactBody),
  });
}
