import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  RotateCcw,
  Trash2,
  WifiOff,
} from 'lucide-react';
import React, { useState } from 'react';
import { DEFAULT_APPS_SCRIPT_URL } from '../types';

interface SettingsPanelProps {
  scriptUrl: string;
  onChangeScriptUrl: (url: string) => void;
  demoMode: boolean;
  onToggleDemoMode: (enabled: boolean) => void;
  onLoadSamples: () => void;
  onClearWorkouts: () => void;
  workoutCount: number;
}

const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.fecha,
    data.tipo,
    data.distancia_km,
    data.duracion_min,
    data.notas
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  scriptUrl,
  onChangeScriptUrl,
  demoMode,
  onToggleDemoMode,
  onLoadSamples,
  onClearWorkouts,
  workoutCount,
}) => {
  const [draftUrl, setDraftUrl] = useState<string>(scriptUrl);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [showScriptCode, setShowScriptCode] = useState<boolean>(false);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftUrl.trim() || DEFAULT_APPS_SCRIPT_URL;
    setDraftUrl(cleaned);
    onChangeScriptUrl(cleaned);
    setSavedNotice('URL de Google Apps Script guardada en localStorage.');
  };

  const handleResetDefault = () => {
    setDraftUrl(DEFAULT_APPS_SCRIPT_URL);
    onChangeScriptUrl(DEFAULT_APPS_SCRIPT_URL);
    setSavedNotice('Se restauró la URL /exec por defecto.');
  };

  return (
    <section aria-labelledby="settings-heading" className="space-y-4">
      <div className="rounded-2xl bg-white border border-neutral-200 p-5 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h2
            id="settings-heading"
            className="font-display text-2xl font-bold tracking-tight text-[#0D0D0F] uppercase"
          >
            Conexión con Google Sheets
          </h2>
          <p className="text-sm text-neutral-600">
            Envío directo mediante Google Apps Script sin OAuth Client ID. La URL se guarda
            localmente en tu navegador.
          </p>
        </div>

        {/* Apps Script URL Form */}
        <form onSubmit={handleSaveUrl} className="space-y-3">
          <div>
            <label
              htmlFor="apps-script-url"
              className="block text-xs font-semibold text-neutral-700 mb-1.5"
            >
              URL de Google Apps Script (/exec)
            </label>
            <input
              id="apps-script-url"
              type="url"
              required
              value={draftUrl}
              onChange={(e) => {
                setDraftUrl(e.target.value);
                setSavedNotice(null);
              }}
              placeholder={DEFAULT_APPS_SCRIPT_URL}
              className="w-full min-h-[48px] px-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm font-mono text-[#0D0D0F] focus:outline-none focus:border-[#0D0D0F] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D0D0F] text-white text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Guardar URL
            </button>
            <button
              type="button"
              onClick={handleResetDefault}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Restaurar por defecto</span>
            </button>
          </div>

          {savedNotice && (
            <div
              role="status"
              className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-900 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{savedNotice}</span>
            </div>
          )}
        </form>

        {/* Demo / Offline Mode Switch */}
        <div className="pt-5 border-t border-neutral-200 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-neutral-700" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#0D0D0F]">
                Modo demo / local (sin conexión)
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Guarda los entrenamientos solo en localStorage sin enviar peticiones POST a Google
              Sheets. Ideal para pruebas offline.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={demoMode}
            aria-label="Activar modo demo o local sin conexión"
            onClick={() => onToggleDemoMode(!demoMode)}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors cursor-pointer ${
              demoMode ? 'bg-[#0D0D0F]' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                demoMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Local Data Testing Controls */}
        <div className="pt-5 border-t border-neutral-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[#0D0D0F]">Datos locales de prueba</p>
              <p className="text-xs text-neutral-500 tabular-nums">
                Actualmente hay {workoutCount} sesiones almacenadas en este navegador.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onLoadSamples}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-neutral-300 bg-white text-[#0D0D0F] text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cargar sesiones de ejemplo</span>
            </button>

            {workoutCount > 0 &&
              (confirmClear ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearWorkouts();
                      setConfirmClear(false);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Sí, borrar historial
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs sm:text-sm font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Borrar historial local</span>
                </button>
              ))}
          </div>
        </div>

        {/* Collapsible Apps Script Reference */}
        <div className="pt-5 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => setShowScriptCode((prev) => !prev)}
            className="w-full min-h-[44px] flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-[#0D0D0F] cursor-pointer"
          >
            <span>Ver estructura esperada en Google Apps Script (doPost)</span>
            {showScriptCode ? (
              <ChevronUp className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            )}
          </button>

          {showScriptCode && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-neutral-600">
                La aplicación envía exactamente{' '}
                <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded">
                  {'{ fecha, tipo, distancia_km, duracion_min, notas }'}
                </code>{' '}
                con <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded">no-cors</code>{' '}
                y <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded">text/plain</code>.
              </p>
              <pre className="rounded-xl bg-[#0D0D0F] text-neutral-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                {APPS_SCRIPT_SNIPPET}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
