import { History, PlusCircle, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { WorkoutForm } from './components/WorkoutForm';
import { WorkoutHistory } from './components/WorkoutHistory';
import { WorkoutRecord } from './types';
import {
  buildSampleWorkouts,
  loadAppsScriptUrl,
  loadDemoMode,
  loadWorkouts,
  saveAppsScriptUrl,
  saveDemoMode,
  saveWorkouts,
} from './utils/storage';

type AppTab = 'registrar' | 'historial' | 'conexion';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('registrar');
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>(() => loadWorkouts());
  const [scriptUrl, setScriptUrl] = useState<string>(() => loadAppsScriptUrl());
  const [demoMode, setDemoMode] = useState<boolean>(() => loadDemoMode());

  useEffect(() => {
    saveWorkouts(workouts);
  }, [workouts]);

  const handleChangeScriptUrl = (url: string) => {
    setScriptUrl(url);
    saveAppsScriptUrl(url);
  };

  const handleToggleDemoMode = (enabled: boolean) => {
    setDemoMode(enabled);
    saveDemoMode(enabled);
  };

  const handleWorkoutSaved = (record: WorkoutRecord) => {
    setWorkouts((prev) => [record, ...prev]);
  };

  const handleUpdateWorkout = (id: string, patch: Partial<WorkoutRecord>) => {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const handleLoadSamples = () => {
    const samples = buildSampleWorkouts();
    setWorkouts((prev) => [...samples, ...prev]);
  };

  const handleClearWorkouts = () => {
    setWorkouts([]);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F6] text-[#0D0D0F] flex flex-col">
      {/* Top Bar: 3-zone contract on desktop, compact 52px header on mobile */}
      <header className="sticky top-0 z-30 h-[52px] lg:h-16 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('registrar');
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <svg
              width="24"
              height="18"
              viewBox="0 0 24 18"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M2 16L6 8H9.5L5.5 16H2Z" fill="#0D0D0F" />
              <path d="M9 16L14.5 5H18L12.5 16H9Z" fill="#0D0D0F" />
              <path d="M16 16L22.5 2H24L20.5 16H16Z" fill="#0D0D0F" />
            </svg>
            <span className="font-display text-xl sm:text-2xl font-extrabold italic tracking-tight text-[#0D0D0F] uppercase">
              RunTracker Sheets
            </span>
          </a>

          {/* Zone 2: Desktop Navigation Links */}
          <nav
            aria-label="Navegación principal"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-600"
          >
            <button
              type="button"
              onClick={() => setActiveTab('registrar')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'registrar'
                  ? 'text-[#0D0D0F] font-semibold underline underline-offset-8 decoration-2'
                  : 'hover:text-[#0D0D0F]'
              }`}
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'historial'
                  ? 'text-[#0D0D0F] font-semibold underline underline-offset-8 decoration-2'
                  : 'hover:text-[#0D0D0F]'
              }`}
            >
              Historial
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('conexion')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'conexion'
                  ? 'text-[#0D0D0F] font-semibold underline underline-offset-8 decoration-2'
                  : 'hover:text-[#0D0D0F]'
              }`}
            >
              Conexión Apps Script
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleToggleDemoMode(!demoMode)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                demoMode
                  ? 'bg-[#0D0D0F] text-[#D9FF00]'
                  : 'bg-neutral-100 text-[#0D0D0F] hover:bg-neutral-200'
              }`}
            >
              {demoMode ? 'Modo local activo' : 'Modo Sheets activo'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-24 lg:py-8">
        {/* Desktop 2-Column Workspace when on Registrar/Historial, or full Conexión view */}
        <div className="hidden lg:block">
          {activeTab === 'conexion' ? (
            <div className="max-w-3xl mx-auto">
              <SettingsPanel
                scriptUrl={scriptUrl}
                onChangeScriptUrl={handleChangeScriptUrl}
                demoMode={demoMode}
                onToggleDemoMode={handleToggleDemoMode}
                onLoadSamples={handleLoadSamples}
                onClearWorkouts={handleClearWorkouts}
                workoutCount={workouts.length}
              />
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-5">
                <WorkoutForm
                  scriptUrl={scriptUrl}
                  demoMode={demoMode}
                  onWorkoutSaved={handleWorkoutSaved}
                  onOpenSettings={() => setActiveTab('conexion')}
                />
              </div>
              <div className="col-span-7">
                <WorkoutHistory
                  workouts={workouts}
                  scriptUrl={scriptUrl}
                  demoMode={demoMode}
                  onUpdateWorkout={handleUpdateWorkout}
                  onDeleteWorkout={handleDeleteWorkout}
                  onLoadSamples={handleLoadSamples}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile-First Single-Column Tabbed Views */}
        <div className="lg:hidden">
          {activeTab === 'registrar' && (
            <WorkoutForm
              scriptUrl={scriptUrl}
              demoMode={demoMode}
              onWorkoutSaved={handleWorkoutSaved}
              onOpenSettings={() => setActiveTab('conexion')}
            />
          )}

          {activeTab === 'historial' && (
            <WorkoutHistory
              workouts={workouts}
              scriptUrl={scriptUrl}
              demoMode={demoMode}
              onUpdateWorkout={handleUpdateWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onLoadSamples={handleLoadSamples}
            />
          )}

          {activeTab === 'conexion' && (
            <SettingsPanel
              scriptUrl={scriptUrl}
              onChangeScriptUrl={handleChangeScriptUrl}
              demoMode={demoMode}
              onToggleDemoMode={handleToggleDemoMode}
              onLoadSamples={handleLoadSamples}
              onClearWorkouts={handleClearWorkouts}
              workoutCount={workouts.length}
            />
          )}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (56px height, total fixed mobile chrome = 108px < 15%) */}
      <nav
        aria-label="Navegación móvil"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-neutral-200 grid grid-cols-3 items-center"
      >
        <button
          type="button"
          onClick={() => setActiveTab('registrar')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 'registrar' ? 'text-[#0D0D0F]' : 'text-neutral-400'
          }`}
        >
          <PlusCircle
            className={`h-5 w-5 ${activeTab === 'registrar' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Registrar
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historial')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 'historial' ? 'text-[#0D0D0F]' : 'text-neutral-400'
          }`}
        >
          <History
            className={`h-5 w-5 ${activeTab === 'historial' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Historial ({workouts.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conexion')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 'conexion' ? 'text-[#0D0D0F]' : 'text-neutral-400'
          }`}
        >
          <Settings
            className={`h-5 w-5 ${activeTab === 'conexion' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Conexión
          </span>
        </button>
      </nav>
    </div>
  );
}
