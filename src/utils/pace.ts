export function getTodayYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculatePaceSeconds(distanciaKm: number, duracionMin: number): number | null {
  if (!Number.isFinite(distanciaKm) || !Number.isFinite(duracionMin)) {
    return null;
  }
  if (distanciaKm <= 0 || duracionMin <= 0) {
    return null;
  }
  const totalSeconds = duracionMin * 60;
  return totalSeconds / distanciaKm;
}

export function formatPaceFromSeconds(secondsPerKm: number | null): string {
  if (secondsPerKm === null || !Number.isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return '--:-- min/km';
  }
  const rounded = Math.round(secondsPerKm);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} min/km`;
}

export function formatPaceShort(secondsPerKm: number | null): string {
  if (secondsPerKm === null || !Number.isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return '--:--';
  }
  const rounded = Math.round(secondsPerKm);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function calculatePace(distanciaKm: number, duracionMin: number): string {
  return formatPaceFromSeconds(calculatePaceSeconds(distanciaKm, duracionMin));
}

export function calculateSpeedKmh(distanciaKm: number, duracionMin: number): string {
  if (!Number.isFinite(distanciaKm) || !Number.isFinite(duracionMin) || distanciaKm <= 0 || duracionMin <= 0) {
    return '--';
  }
  const kmh = distanciaKm / (duracionMin / 60);
  return kmh.toFixed(1);
}
