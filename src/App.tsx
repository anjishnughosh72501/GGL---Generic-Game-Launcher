import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MainView } from './components/MainView';
import { SpotlightModal } from './components/SpotlightModal';
import { EditGameModal } from './components/EditGameModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { LaunchProcessHUD } from './components/LaunchProcessHUD';
import { applyThemeTokens } from './styles/themes';

export const App: React.FC = () => {
  const {
    initializeStore,
    activeMenuId,
    setActiveMenuId,
    isSettingsOpen,
    setSettingsOpen,
  } = useGameStore();

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
      if (e.key === 'Escape') {
        if (activeMenuId) setActiveMenuId(null);
        if (isSettingsOpen) setSettingsOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId, setActiveMenuId, isSettingsOpen, setSettingsOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden transition-colors duration-200 bg-base text-primary">
      {/* Sidebar (Clean layout, no name on sidebar) */}
      <Sidebar />

      {/* Main Content Area (Clean top navigation bar, no redundant top name layer) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navigation Bar Header */}
        <Header />

        {/* Main Content View (Grid / List) */}
        <main className="flex-1 flex overflow-hidden bg-base relative z-0">
          <MainView />
        </main>
      </div>

      {/* Settings Modal Housing Appearance, Themes & Preferences */}
      <SettingsModal />

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
