import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MainView } from './components/MainView';
import { SpotlightModal } from './components/SpotlightModal';
import { EditGameModal } from './components/EditGameModal';
import { StatsModal } from './components/StatsModal';
import { LaunchProcessHUD } from './components/LaunchProcessHUD';

import { applyThemeTokens } from './styles/themes';
import { AppLogo } from './components/AppLogo';

export const App: React.FC = () => {
  const { initializeStore, activeMenuId, setActiveMenuId } = useGameStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // System OS Dark/Light scheme change listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSchemeChange = () => {
        const { settings } = useGameStore.getState();
        if (settings.themeMode === 'system') {
          applyThemeTokens(settings.themePalette, 'system');
        }
      };
      mediaQuery.addEventListener('change', handleSchemeChange);
      return () => mediaQuery.removeEventListener('change', handleSchemeChange);
    }
  }, []);

  // Global dismissal for active context menu on whitespace click or Escape key
  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeMenuId) setActiveMenuId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeMenuId) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId, setActiveMenuId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden transition-colors duration-200 bg-base text-primary">
      {/* Sidebar (Clean layout, no name on sidebar) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Electron Window Drag Region with subtle title */}
        <div
          className="h-7 w-full shrink-0 select-none flex items-center justify-between px-4 bg-surface/40 border-b border-subtle"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-2">
            <AppLogo className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono font-semibold tracking-wider text-muted">
              GGL &bull; Generic Game Launcher
            </span>
          </div>
        </div>

        {/* Top Header */}
        <Header />

        {/* Main Content View (Grid / List) */}
        <main className="flex-1 flex overflow-hidden bg-base relative z-0">
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
