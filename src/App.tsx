import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MainView } from './components/MainView';
import { SpotlightModal } from './components/SpotlightModal';
import { EditGameModal } from './components/EditGameModal';
import { StatsModal } from './components/StatsModal';
import { LaunchProcessHUD } from './components/LaunchProcessHUD';

export const App: React.FC = () => {
  const { initializeStore, settings } = useGameStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const isDark = settings.themeMode === 'dark';

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
      }`}
    >
      {/* Sidebar (Notion / Spotify style) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Electron Window Drag Region */}
        <div
          className="h-8 w-full shrink-0 select-none flex items-center justify-end px-4"
          style={{ WebkitAppRegion: 'drag' } as any}
        />

        {/* Top Header */}
        <Header />

        {/* Main Content View (Grid / List) */}
        <main className="flex-1 flex overflow-hidden">
          <MainView />
        </main>
      </div>

      {/* Raycast / Spotlight Two-Tiered Add Program Modal */}
      <SpotlightModal />

      {/* Item Details Editor Modal */}
      <EditGameModal />

      {/* Telemetry & Metrics Modal */}
      <StatsModal />

      {/* Step-by-Step Game Launching Process Visualizer */}
      <LaunchProcessHUD />
    </div>
  );
};
