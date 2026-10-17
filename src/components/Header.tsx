import React from 'react';
import {
  Search,
  X,
  LayoutGrid,
  Square,
  List,
  ArrowUpDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ViewMode, HubSettings } from '../types/game';
import { ThemeSwitcher } from './ThemeSwitcher';

export const Header: React.FC = () => {
  const {
    settings,
    setSearchQuery,
    setViewMode,
    setSortBy,
    toggleSortOrder,
    toggleShowHidden,
  } = useGameStore();

  const isDark = settings.themeMode === 'dark';

  const viewModes: Array<{ id: ViewMode; icon: React.ReactNode; label: string }> = [
    { id: 'grid-poster', icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'Poster Grid' },
    { id: 'grid-square', icon: <Square className="w-3.5 h-3.5" />, label: 'Square Grid' },
    { id: 'list', icon: <List className="w-3.5 h-3.5" />, label: 'List View' },
  ];

  const sortOptions: Array<{ key: HubSettings['sortBy']; label: string }> = [
    { key: 'lastPlayed', label: 'Recently Launched' },
    { key: 'playCount', label: 'Most Launched' },
    { key: 'title', label: 'Name Alphabetical' },
    { key: 'category', label: 'Category' },
  ];

  return (
    <header className="relative z-40 h-16 px-6 border-b border-subtle bg-surface/90 backdrop-blur-md shrink-0 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* App Branding & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* GGL Branding Badge */}
        <div
          className="flex items-center gap-2 select-none shrink-0"
          title="GGL - Generic Game Launcher"
        >
          <div className="flex items-center justify-center px-2.5 py-1 rounded-xl bg-accent text-accent-fg font-black text-xs tracking-wider shadow-xs font-mono">
            GGL
          </div>
          <span className="hidden lg:inline text-xs font-bold text-primary tracking-tight">
            Generic Game Launcher
          </span>
        </div>

        {/* Search Bar with Full Text Selection & Token Styling */}
        <div
          className="relative flex-1 group"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted group-hover:text-accent transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search games, apps, tags..."
            value={settings.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-subtle bg-base/80 hover:bg-base focus:bg-base text-primary placeholder:text-muted outline-none transition-all duration-200 focus:border-accent/80 focus:ring-2 focus:ring-accent/15 select-text shadow-xs"
          />
          {settings.searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface-hover text-muted hover:text-primary hover:scale-110 active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Appearance, Sort, View Mode, Visibility */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Appearance Popover Switcher */}
        <ThemeSwitcher />

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5">
          <select
            value={settings.sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-subtle bg-surface text-primary outline-none cursor-pointer hover:bg-surface-hover transition-colors shadow-xs"
          >
            {sortOptions.map((opt) => (
              <option key={opt.key} value={opt.key} className="bg-surface text-primary">
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={toggleSortOrder}
            className="p-1.5 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-muted hover:text-primary cursor-pointer transition-colors shadow-xs"
            title={`Sort ${settings.sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl border border-subtle bg-surface shadow-xs">
          {viewModes.map((v) => {
            const isActive = settings.viewMode === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface-hover text-accent font-semibold shadow-xs border border-subtle'
                    : 'text-muted hover:text-primary hover:bg-surface-hover/50'
                }`}
                title={v.label}
              >
                {v.icon}
              </button>
            );
          })}
        </div>

        {/* Hidden Items Visibility Toggle */}
        <button
          onClick={toggleShowHidden}
          className={`p-2 rounded-xl border transition-colors cursor-pointer shadow-xs ${
            settings.showHidden
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : 'border-subtle bg-surface hover:bg-surface-hover text-muted hover:text-primary'
          }`}
          title={settings.showHidden ? 'Hide hidden items' : 'Show hidden items'}
        >
          {settings.showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
