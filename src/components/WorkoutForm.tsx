import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mountain,
  Send,
  Sparkles,
  Footprints,
  WifiOff,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { analyzeWorkoutWithGemini } from '../services/aiCoach';
import { sendWorkoutToGoogleSheets } from '../services/sheets';
import { WORKOUT_TYPES, WorkoutPayload, WorkoutRecord, WorkoutType } from '../types';
import {
  calculatePace,
  calculatePaceSeconds,
  calculateSpeedKmh,
  formatPaceShort,
  getTodayYYYYMMDD,
} from '../utils/pace';

interface WorkoutFormProps {
  scriptUrl: string;
  demoMode: boolean;
  onWorkoutSaved: (record: WorkoutRecord) => void;
  onOpenSettings: () => void;
}

interface StatusBanner {
  kind: 'success' | 'local' | 'error';
  title: string;
  detail: string;
}

const TYPE_ICONS: Record<WorkoutType, React.ReactNode> = {
  Correr: <Activity className="h-4 w-4" aria-hidden="true" />,
  Caminata: <Footprints className="h-4 w-4" aria-hidden="true" />,
  Trail: <Mountain className="h-4 w-4" aria-hidden="true" />,
};

export const WorkoutForm: React.FC<WorkoutFormProps> = ({
  scriptUrl,
  demoMode,
  onWorkoutSaved,
  onOpenSettings,
}) => {
  const [fecha, setFecha] = useState<string>(getTodayYYYYMMDD);
  const [tipo, setTipo] = useState<WorkoutType>('Correr');
  const [distanciaInput, setDistanciaInput] = useState<string>('5.00');
  const [duracionInput, setDuracionInput] = useState<string>('28');
  const [notas, setNotas] = useState<string>('');

  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<StatusBanner | null>(null);

  const distanciaNum = useMemo(() => {
    const normalized = distanciaInput.replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [distanciaInput]);

  const duracionNum = useMemo(() => {
    const normalized = duracionInput.replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [duracionInput]);

  const paceSeconds = useMemo(
    () => calculatePaceSeconds(distanciaNum, duracionNum),
    [distanciaNum, duracionNum]
  );

  const paceShort = useMemo(() => formatPaceShort(paceSeconds), [paceSeconds]);
  const paceFull = useMemo(
    () => calculatePace(distanciaNum, duracionNum),
    [distanciaNum, duracionNum]
  );
  const speedKmh = useMemo(
    () => calculateSpeedKmh(distanciaNum, duracionNum),
    [distanciaNum, duracionNum]
  );

  const isValidWorkout = fecha.trim().length > 0 && distanciaNum > 0 && duracionNum > 0;

  const handleAnalyze = async () => {
    if (!isValidWorkout) {
      setAiError('Ingresa una distancia y duración mayores a 0 para analizar tu sesión.');
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    try {
      const feedback = await analyzeWorkoutWithGemini({
        fecha,
        tipo,
        distancia_km: Number(distanciaNum.toFixed(2)),
        duracion_min: Number(duracionNum.toFixed(1)),
        notas: notas.trim(),
        ritmo: paceFull,
      });
      setAiFeedback(feedback);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'No se pudo obtener el comentario de la IA.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidWorkout) {
      setStatusBanner({
        kind: 'error',
        title: 'Datos incompletos',
        detail: 'Verifica que la fecha, distancia (km) y duración (min) sean válidas.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusBanner(null);

    const payload: WorkoutPayload = {
      fecha,
      tipo,
      distancia_km: Number(distanciaNum.toFixed(2)),
      duracion_min: Number(duracionNum.toFixed(1)),
      notas: notas.trim(),
    };

    const newRecord: WorkoutRecord = {
      ...payload,
      id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ritmo: paceFull,
      syncStatus: demoMode ? 'local' : 'sheets',
      aiFeedback: aiFeedback ?? undefined,
      createdAt: new Date().toISOString(),
    };

    if (demoMode) {
      onWorkoutSaved(newRecord);
      setStatusBanner({
        kind: 'local',
        title: 'Guardado en modo demo/local',
        detail: 'La sesión se almacenó en este dispositivo sin enviarse a Google Sheets.',
      });
      setNotas('');
      setAiFeedback(null);
      setIsSubmitting(false);
      return;
    }

    try {
      await sendWorkoutToGoogleSheets(scriptUrl, payload);
      onWorkoutSaved(newRecord);
      setStatusBanner({
        kind: 'success',
        title: 'Envío disparado hacia Google Sheets',
        detail:
          'El entrenamiento se guardó en tu historial local y se envió vía POST (no-cors) a tu Apps Script (/exec).',
      });
      setNotas('');
      setAiFeedback(null);
    } catch (err) {
      const localFallback: WorkoutRecord = {
        ...newRecord,
        syncStatus: 'local',
      };
      onWorkoutSaved(localFallback);
      setStatusBanner({
        kind: 'error',
        title: 'Guardado solo localmente',
        detail:
          err instanceof Error
            ? `${err.message} Se guardó en tu historial local para reintentar luego.`
            : 'No se pudo disparar el envío a Google Sheets. Se guardó localmente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="form-heading" className="space-y-4">
      {/* Live Pace Hero Scoreboard (Adidas Running dark telemetry aesthetic) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0D0D0F] text-white p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 flex gap-2 opacity-15 -skew-x-12"
        >
          <span className="h-36 w-3 bg-[#D9FF00]" />
          <span className="h-36 w-3 bg-[#D9FF00]" />
          <span className="h-36 w-3 bg-[#D9FF00]" />
        </div>

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-neutral-400 tracking-wide">
              Ritmo calculado en tiempo real
            </p>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span
                data-testid="live-pace"
                className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-[#D9FF00] tabular-nums"
              >
                {paceShort}
              </span>
              <span className="text-sm font-medium text-neutral-300">min/km</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-neutral-400">Velocidad media</p>
            <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
              {speedKmh} <span className="text-xs font-normal text-neutral-400">km/h</span>
            </p>
          </div>
        </div>

        <div className="relative mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <span>{tipo}</span>
            <span aria-hidden="true" className="text-neutral-600">
              ·
            </span>
            <span className="font-mono tabular-nums">
              {distanciaNum > 0 ? `${distanciaNum.toFixed(2)} km` : '0.00 km'}
            </span>
            <span aria-hidden="true" className="text-neutral-600">
              ·
            </span>
            <span className="font-mono tabular-nums">
              {duracionNum > 0 ? `${duracionNum} min` : '0 min'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs font-medium text-neutral-300 hover:text-[#D9FF00] transition-colors underline underline-offset-4 cursor-pointer"
          >
            {demoMode ? 'Modo demo/local activo' : 'Conectado a Sheets'}
          </button>
        </div>
      </div>

      {/* Main Quick Workout Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white border border-neutral-200 p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            id="form-heading"
            className="font-display text-2xl font-bold tracking-tight text-[#0D0D0F] uppercase"
          >
            Registrar sesión
          </h2>
          <span className="text-xs text-neutral-500">Sincronización directa</span>
        </div>

        {/* Tipo Segmented Control */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-2">
            Tipo de entrenamiento
          </label>
          <div
            role="radiogroup"
            aria-label="Tipo de entrenamiento"
            className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100"
          >
            {WORKOUT_TYPES.map((item) => {
              const active = tipo === item;
              return (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTipo(item)}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#0D0D0F] text-white shadow-sm'
                      : 'text-neutral-600 hover:text-[#0D0D0F] hover:bg-white/60'
                  }`}
                >
                  {TYPE_ICONS[item]}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date, Distance, Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label
              htmlFor="workout-fecha"
              className="block text-xs font-semibold text-neutral-600 mb-1.5"
            >
              Fecha
            </label>
            <input
              id="workout-fecha"
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full min-h-[48px] px-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono font-medium text-[#0D0D0F] tabular-nums focus:outline-none focus:border-[#0D0D0F] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="workout-distancia"
              className="block text-xs font-semibold text-neutral-600 mb-1.5"
            >
              Distancia (km)
            </label>
            <div className="relative">
              <input
                id="workout-distancia"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                placeholder="5.00"
                value={distanciaInput}
                onChange={(e) => setDistanciaInput(e.target.value)}
                className="w-full min-h-[48px] pl-3.5 pr-11 rounded-xl bg-neutral-50 border border-neutral-200 text-base font-mono font-semibold text-[#0D0D0F] tabular-nums focus:outline-none focus:border-[#0D0D0F] focus:bg-white transition-colors"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                km
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="workout-duracion"
              className="block text-xs font-semibold text-neutral-600 mb-1.5"
            >
              Duración (min)
            </label>
            <div className="relative">
              <input
                id="workout-duracion"
                type="number"
                inputMode="decimal"
                step="0.5"
                min="1"
                required
                placeholder="28"
                value={duracionInput}
                onChange={(e) => setDuracionInput(e.target.value)}
                className="w-full min-h-[48px] pl-3.5 pr-12 rounded-xl bg-neutral-50 border border-neutral-200 text-base font-mono font-semibold text-[#0D0D0F] tabular-nums focus:outline-none focus:border-[#0D0D0F] focus:bg-white transition-colors"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                min
              </span>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label
            htmlFor="workout-notas"
            className="block text-xs font-semibold text-neutral-600 mb-1.5"
          >
            Notas de la sesión
          </label>
          <textarea
            id="workout-notas"
            rows={2}
            placeholder="Sensaciones, terreno, clima o pulsaciones..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-[#0D0D0F] placeholder:text-neutral-400 focus:outline-none focus:border-[#0D0D0F] focus:bg-white transition-colors resize-none"
          />
        </div>

        {/* AI Coaching Result */}
        {aiFeedback && (
          <div className="rounded-xl bg-neutral-900 text-white p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D9FF00]">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Análisis de entrenador IA</span>
              </div>
              <button
                type="button"
                onClick={() => setAiFeedback(null)}
                aria-label="Cerrar análisis de IA"
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-neutral-100">{aiFeedback}</p>
          </div>
        )}

        {aiError && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-sm text-red-800"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
            <span>{aiError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !isValidWorkout}
            className="min-h-[48px] sm:flex-1 px-4 py-3 rounded-xl border border-neutral-300 bg-white text-[#0D0D0F] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Analizar con IA</span>
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !isValidWorkout}
            className="min-h-[52px] sm:flex-[1.35] px-5 py-3 rounded-xl bg-[#D9FF00] text-[#0D0D0F] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#c8ec00] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Enviando...</span>
              </>
            ) : demoMode ? (
              <>
                <WifiOff className="h-4 w-4" aria-hidden="true" />
                <span>Guardar en modo local</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Guardar y enviar a Sheets</span>
              </>
            )}
          </button>
        </div>

        {/* Submission Status Feedback */}
        {statusBanner && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl p-3.5 border flex items-start justify-between gap-3 ${
              statusBanner.kind === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusBanner.kind === 'local'
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {statusBanner.kind === 'success' ? (
                <CheckCircle2
                  className="h-4 w-4 mt-0.5 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
              ) : statusBanner.kind === 'local' ? (
                <WifiOff
                  className="h-4 w-4 mt-0.5 shrink-0 text-neutral-700"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="h-4 w-4 mt-0.5 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
              )}
              <div className="text-xs leading-relaxed">
                <p className="font-semibold">{statusBanner.title}</p>
                <p className="mt-0.5 opacity-90">{statusBanner.detail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              aria-label="Cerrar notificación"
              className="p-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </form>
    </section>
  );
};
