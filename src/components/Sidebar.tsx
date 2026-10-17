import React from 'react';
import {
  Compass,
  Gamepad2,
  LayoutGrid,
  Star,
  Clock,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  BarChart2,
  HardDrive,
  Layers,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { HubSettings, PlatformType } from '../types/game';

export const Sidebar: React.FC = () => {
  const {
    games,
    settings,
    setActiveFilter,
    setActivePlatform,
    setThemeMode,
    setSpotlightOpen,
    setStatsOpen,
    scanLibrary,
    isScanning,
  } = useGameStore();

  const isDark = settings.themeMode === 'dark';

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
    <aside
      className={`w-64 h-full shrink-0 flex flex-col justify-between p-4 border-r transition-colors duration-200 select-none ${
        isDark
          ? 'bg-zinc-950/80 border-zinc-800/60 text-zinc-300'
          : 'bg-zinc-50/90 border-zinc-200/80 text-zinc-700'
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="flex items-center justify-between px-2 py-2 mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                isDark ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60' : 'bg-white text-zinc-900 border border-zinc-200'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Fluent Hub
              </div>
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                PC Library & Launcher
              </div>
            </div>
          </div>

          <button
            onClick={() => scanLibrary()}
            disabled={isScanning}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-zinc-800/70 text-zinc-400' : 'hover:bg-zinc-200/70 text-zinc-500'
            }`}
            title="Scan Libraries & Platforms"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>

        {/* Quick Nav Items */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1">
            Library
          </div>
          {navItems.map((item) => {
            const isActive = settings.activeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveFilter(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'bg-zinc-200/80 text-zinc-900 shadow-sm'
                    : isDark
                    ? 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-zinc-900 dark:text-zinc-100' : ''}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? isDark
                        ? 'bg-zinc-700/60 text-zinc-300'
                        : 'bg-zinc-300/80 text-zinc-800'
                      : isDark
                      ? 'text-zinc-500'
                      : 'text-zinc-400'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Platform Filter Section */}
        <div className="mt-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
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
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                        : 'bg-zinc-200 text-zinc-900 font-semibold'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <span>{p.label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Area: Add Program & Theme Toggle */}
      <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-2.5">
        {/* Spotlight Add Button with Hovering Reaction */}
        <button
          onClick={() => setSpotlightOpen(true)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-md ${
            isDark
              ? 'bg-zinc-100 text-zinc-950 hover:bg-white hover:shadow-white/10'
              : 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 hover:shadow-zinc-900/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
            <span>Add Program</span>
          </div>
          <kbd
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              isDark ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-200'
            }`}
          >
            Ctrl K
          </kbd>
        </button>

        {/* Footer Row: Theme Switcher & Stats */}
        <div className="flex items-center justify-between px-1">
          {/* Light / Dark Mode Pill Switch */}
          <div
            className={`flex items-center p-0.5 rounded-full border ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-200/70 border-zinc-300/80'
            }`}
          >
            <button
              onClick={() => setThemeMode('light')}
              className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer hover:scale-115 active:scale-90 ${
                !isDark ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer hover:scale-115 active:scale-90 ${
                isDark ? 'bg-zinc-800 text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-700'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setStatsOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
              isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Stats</span>
          </button>
        </div>
      </div>

    </aside>
  );
};
