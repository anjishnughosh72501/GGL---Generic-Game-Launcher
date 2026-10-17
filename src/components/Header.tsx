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
    <header
      className={`h-16 px-6 border-b shrink-0 flex items-center justify-between gap-4 select-none transition-colors duration-200 ${
        isDark
          ? 'bg-zinc-900/40 border-zinc-800/60 text-zinc-100'
          : 'bg-white/60 border-zinc-200/80 text-zinc-900'
      }`}
    >
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-md">
        <Search
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }`}
        />
        <input
          type="text"
          placeholder="Search games, apps, tags..."
          value={settings.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-9 py-2 text-xs rounded-xl border outline-none transition-all placeholder:text-zinc-400 ${
            isDark
              ? 'bg-zinc-900/80 border-zinc-800 focus:border-zinc-700 text-zinc-100 focus:bg-zinc-900'
              : 'bg-zinc-100/90 border-zinc-200 focus:border-zinc-300 text-zinc-900 focus:bg-white'
          }`}
        />
        {settings.searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* View Mode & Sort Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Sort Controls */}
        <div className="flex items-center gap-1.5">
          <select
            value={settings.sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            {sortOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={toggleSortOrder}
            className={`p-1.5 rounded-xl border cursor-pointer transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100'
                : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
            }`}
            title={`Sort ${settings.sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div
          className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}
        >
          {viewModes.map((v) => {
            const isActive = settings.viewMode === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                      : 'bg-white text-zinc-900 shadow-xs'
                    : isDark
                    ? 'text-zinc-500 hover:text-zinc-300'
                    : 'text-zinc-400 hover:text-zinc-700'
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
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            settings.showHidden
              ? isDark
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                : 'bg-amber-50 border-amber-300 text-amber-600'
              : isDark
              ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100'
              : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
          }`}
          title={settings.showHidden ? 'Hide hidden items' : 'Show hidden items'}
        >
          {settings.showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
