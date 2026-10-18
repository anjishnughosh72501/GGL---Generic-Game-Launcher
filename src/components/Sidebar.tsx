import React from 'react';
import {
  Compass,
  Gamepad2,
  LayoutGrid,
  Star,
  Clock,
  Plus,
  RefreshCw,
  BarChart2,
  HardDrive,
  Layers,
  Settings,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { HubSettings, PlatformType } from '../types/game';
import { AppLogo } from './AppLogo';

export const Sidebar: React.FC = () => {
  const {
    games,
    settings,
    setActiveFilter,
    setActivePlatform,
    setSpotlightOpen,
    setStatsOpen,
    setSettingsOpen,
    scanLibrary,
    isScanning,
  } = useGameStore();

  const totalCount = games.filter((g) => !g.hidden || settings.showHidden).length;
  const gameCount = games.filter((g) => g.category === 'game' && (!g.hidden || settings.showHidden)).length;
  const appCount = games.filter((g) => g.category === 'app' && (!g.hidden || settings.showHidden)).length;
  const favCount = games.filter((g) => g.favorite && (!g.hidden || settings.showHidden)).length;
  const recentCount = games.filter((g) => g.lastPlayed && (!g.hidden || settings.showHidden)).length;

  const navItems: Array<{
    id: HubSettings['activeFilter'];
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = [
    { id: 'all', label: 'All Items', icon: <Compass className="w-4 h-4" />, count: totalCount },
    { id: 'game', label: 'Games', icon: <Gamepad2 className="w-4 h-4" />, count: gameCount },
    { id: 'app', label: 'Applications', icon: <LayoutGrid className="w-4 h-4" />, count: appCount },
    { id: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" />, count: favCount },
    { id: 'recent', label: 'Recently Launched', icon: <Clock className="w-4 h-4" />, count: recentCount },
  ];

  const platforms: Array<{ id: 'all' | PlatformType; label: string }> = [
    { id: 'all', label: 'All Platforms' },
    { id: 'steam', label: 'Steam' },
    { id: 'epic', label: 'Epic Games' },
    { id: 'gog', label: 'GOG' },
    { id: 'system', label: 'System Apps' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <aside className="relative z-30 w-64 h-full shrink-0 flex flex-col justify-between p-4 border-r border-subtle bg-surface/90 backdrop-blur-md text-muted transition-colors duration-200 select-none">
      {/* Top Header Region (No Name shown on sidebar, per specification) */}
      <div>
        <div className="flex items-center justify-between px-2 py-2 mb-5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-zinc-200 shadow-xs p-1 overflow-hidden transition-transform hover:scale-105"
            title="GGL - Generic Game Launcher"
          >
            <AppLogo className="w-full h-full" variant="app" />
          </div>

          <button
            onClick={() => scanLibrary()}
            disabled={isScanning}
            className="p-2 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-muted hover:text-primary transition-all duration-200 cursor-pointer shadow-xs"
            title="Scan Libraries & Platforms"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>

        {/* Quick Nav Items */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider px-2 py-1">
            Library
          </div>
          {navItems.map((item) => {
            const isActive = settings.activeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveFilter(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-surface-hover text-primary font-semibold shadow-xs border border-subtle'
                    : 'text-muted hover:bg-surface-hover/60 hover:text-primary border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-accent' : 'text-muted'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-accent/15 text-accent font-semibold'
                      : 'text-muted'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Platform Filter Section */}
        <div className="mt-6 pt-4 border-t border-subtle">
          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
            <HardDrive className="w-3 h-3" />
            Platform
          </div>
          <div className="space-y-0.5 mt-1">
            {platforms.map((p) => {
              const isActive = settings.activePlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-surface-hover text-primary font-semibold border border-subtle'
                      : 'text-muted hover:text-primary hover:bg-surface-hover/60 border border-transparent'
                  }`}
                >
                  <span>{p.label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-xs" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Area: Add Program & Quick Settings */}
      <div className="pt-4 border-t border-subtle space-y-2.5">
        {/* Spotlight Add Button with Token Styling */}
        <button
          onClick={() => setSpotlightOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-md bg-accent text-accent-fg hover:bg-accent-hover transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Program</span>
          </div>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-black/20 text-accent-fg border border-white/20">
            Ctrl K
          </kbd>
        </button>

        {/* Footer Row: Settings & Stats */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-primary hover:bg-surface-hover border border-transparent hover:border-subtle transition-all duration-200 cursor-pointer shadow-xs"
            title="Open Settings & Themes"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setStatsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-primary hover:bg-surface-hover border border-transparent hover:border-subtle transition-all duration-200 cursor-pointer shadow-xs"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Telemetry</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
