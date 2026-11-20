import {
  Check,
  Loader2,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { analyzeWorkoutWithGemini } from '../services/aiCoach';
import { sendWorkoutToGoogleSheets } from '../services/sheets';
import { WORKOUT_TYPES, WorkoutFilter, WorkoutRecord } from '../types';
import { calculatePace } from '../utils/pace';

interface WorkoutHistoryProps {
  workouts: WorkoutRecord[];
  scriptUrl: string;
  demoMode: boolean;
  onUpdateWorkout: (id: string, patch: Partial<WorkoutRecord>) => void;
  onDeleteWorkout: (id: string) => void;
  onLoadSamples: () => void;
}

const FILTER_OPTIONS: WorkoutFilter[] = ['Todos', ...WORKOUT_TYPES];

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  workouts,
  scriptUrl,
  demoMode,
  onUpdateWorkout,
  onDeleteWorkout,
  onLoadSamples,
}) => {
  const [activeFilter, setActiveFilter] = useState<WorkoutFilter>('Todos');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [rowFeedbackMsg, setRowFeedbackMsg] = useState<string | null>(null);

  const filteredWorkouts = useMemo(() => {
    if (activeFilter === 'Todos') return workouts;
    return workouts.filter((w) => w.tipo === activeFilter);
  }, [workouts, activeFilter]);

  const stats = useMemo(() => {
    const totalKm = filteredWorkouts.reduce((acc, w) => acc + w.distancia_km, 0);
    const totalMin = filteredWorkouts.reduce((acc, w) => acc + w.duracion_min, 0);
    const avgPace = calculatePace(totalKm, totalMin);
    return {
      count: filteredWorkouts.length,
      totalKm: totalKm.toFixed(2),
      avgPace: avgPace.replace(' min/km', ''),
    };
  }, [filteredWorkouts]);

  const handleResendToSheets = async (workout: WorkoutRecord) => {
    setSyncingId(workout.id);
    setRowFeedbackMsg(null);
    try {
      await sendWorkoutToGoogleSheets(scriptUrl, {
        fecha: workout.fecha,
        tipo: workout.tipo,
        distancia_km: workout.distancia_km,
        duracion_min: workout.duracion_min,
        notas: workout.notas,
      });
      onUpdateWorkout(workout.id, { syncStatus: 'sheets' });
      setRowFeedbackMsg(`Envío disparado hacia Google Sheets para la sesión del ${workout.fecha}.`);
    } catch (err) {
      setRowFeedbackMsg(
        err instanceof Error ? err.message : 'No se pudo enviar la sesión a Google Sheets.'
      );
    } finally {
      setSyncingId(null);
    }
  };

  const handleAnalyzeRow = async (workout: WorkoutRecord) => {
    setAnalyzingId(workout.id);
    setRowFeedbackMsg(null);
    try {
      const feedback = await analyzeWorkoutWithGemini({
        fecha: workout.fecha,
        tipo: workout.tipo,
        distancia_km: workout.distancia_km,
        duracion_min: workout.duracion_min,
        notas: workout.notas,
        ritmo: workout.ritmo,
      });
      onUpdateWorkout(workout.id, { aiFeedback: feedback });
    } catch (err) {
      setRowFeedbackMsg(
        err instanceof Error ? err.message : 'Error al analizar la sesión con IA.'
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <section aria-labelledby="history-heading" className="space-y-4">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-white border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Distancia</p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-[#0D0D0F] tabular-nums">
            {stats.totalKm}
            <span className="ml-1 text-xs font-medium text-neutral-500">km</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Sesiones</p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-[#0D0D0F] tabular-nums">
            {stats.count}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Ritmo medio</p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-[#0D0D0F] tabular-nums">
            {stats.avgPace}
            <span className="ml-1 text-xs font-medium text-neutral-500">/km</span>
          </p>
        </div>
      </div>

      {/* History Card */}
      <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-neutral-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="history-heading"
              className="font-display text-2xl font-bold tracking-tight text-[#0D0D0F] uppercase"
            >
              Historial de sesiones
            </h2>
            {workouts.length > 0 && (
              <span className="text-xs text-neutral-500 tabular-nums">
                {filteredWorkouts.length} de {workouts.length} guardadas
              </span>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filtrar por tipo de entrenamiento"
            className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 overflow-x-auto"
          >
            {FILTER_OPTIONS.map((filter) => {
              const active = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#0D0D0F] shadow-sm'
                      : 'text-neutral-600 hover:text-[#0D0D0F]'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {rowFeedbackMsg && (
            <div
              role="status"
              className="rounded-xl bg-neutral-900 text-white px-3.5 py-2.5 text-xs flex items-center justify-between gap-2"
            >
              <span>{rowFeedbackMsg}</span>
              <button
                type="button"
                onClick={() => setRowFeedbackMsg(null)}
                className="text-neutral-400 hover:text-white font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* List Body */}
        {filteredWorkouts.length === 0 ? (
          <div className="p-8 sm:p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-[#0D0D0F]">
              {workouts.length === 0
                ? 'Aún no hay entrenamientos registrados'
                : `No tienes sesiones de tipo "${activeFilter}"`}
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
              {workouts.length === 0
                ? 'Registra tu primera sesión arriba o carga datos de ejemplo para probar los filtros y el modo sin conexión.'
                : 'Prueba otro filtro o registra un nuevo entrenamiento.'}
            </p>
            {workouts.length === 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLoadSamples}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D0D0F] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cargar 3 sesiones de ejemplo
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {filteredWorkouts.map((workout) => {
              const isConfirming = confirmDeleteId === workout.id;
              return (
                <li key={workout.id} className="p-4 sm:px-6 sm:py-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      {/* Unboxed metadata line per Zero-Pill rule */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                        <span className="font-semibold text-[#0D0D0F]">{workout.tipo}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{workout.fecha}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            workout.syncStatus === 'sheets'
                              ? 'text-emerald-700 font-medium'
                              : 'text-neutral-500'
                          }
                        >
                          {workout.syncStatus === 'sheets'
                            ? 'Enviado a Sheets'
                            : 'Guardado local'}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-2xl font-bold text-[#0D0D0F] tabular-nums">
                          {workout.distancia_km.toFixed(2)} km
                        </span>
                        <span className="text-xs font-mono text-neutral-600 tabular-nums">
                          {workout.duracion_min} min
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-base sm:text-lg font-bold text-[#0D0D0F] tabular-nums">
                        {workout.ritmo.replace(' min/km', '')}
                      </p>
                      <p className="text-[11px] text-neutral-500">min/km</p>
                    </div>
                  </div>

                  {workout.notas && (
                    <p className="text-sm text-neutral-700 leading-relaxed">{workout.notas}</p>
                  )}

                  {workout.aiFeedback && (
                    <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-xs text-neutral-700 leading-relaxed">
                      <span className="font-semibold text-[#0D0D0F] mr-1.5">Coach IA:</span>
                      {workout.aiFeedback}
                    </div>
                  )}

                  {/* Row Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {!workout.aiFeedback && (
                      <button
                        type="button"
                        onClick={() => handleAnalyzeRow(workout)}
                        disabled={analyzingId === workout.id}
                        className="min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:text-[#0D0D0F] hover:bg-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {analyzingId === workout.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>Analizar con IA</span>
                      </button>
                    )}

                    {workout.syncStatus === 'local' && !demoMode && (
                      <button
                        type="button"
                        onClick={() => handleResendToSheets(workout)}
                        disabled={syncingId === workout.id}
                        className="min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0D0D0F] bg-[#D9FF00]/40 hover:bg-[#D9FF00] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {syncingId === workout.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Send className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>Enviar a Sheets</span>
                      </button>
                    )}

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteWorkout(workout.id);
                            setConfirmDeleteId(null);
                          }}
                          className="min-h-[44px] px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Confirmar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[44px] px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(workout.id)}
                        aria-label={`Eliminar sesión del ${workout.fecha}`}
                        className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
