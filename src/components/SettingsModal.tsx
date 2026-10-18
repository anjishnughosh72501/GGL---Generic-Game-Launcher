import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  LayoutGrid,
  Square,
  List,
  HardDrive,
  Info,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { THEMES, ThemePalette, ThemeMode } from '../styles/themes';
import { AppLogo } from './AppLogo';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    settings,
    setThemePalette,
    setThemeMode,
    setViewMode,
    toggleShowHidden,
    scanLibrary,
    isScanning,
    games,
  } = useGameStore();

  if (!isSettingsOpen) return null;

  const activeTheme = THEMES[settings.themePalette] || THEMES.zinc;

  const modes: Array<{ id: ThemeMode; label: string; icon: React.ReactNode }> = [
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'system', label: 'Auto', icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[85vh] rounded-3xl border border-subtle bg-surface text-primary shadow-2xl overflow-hidden flex flex-col transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-xs border border-zinc-200">
              <AppLogo className="w-full h-full" variant="app" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight text-primary">Settings & Preferences</h2>
              <p className="text-[11px] text-muted font-mono">GGL &bull; Generic Game Launcher</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-xl hover:bg-surface-hover text-muted hover:text-primary transition-colors cursor-pointer"
            title="Close Settings (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: THEMES & APPEARANCE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-subtle">
              <Palette className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                Appearance & Themes
              </h3>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="text-xs font-semibold text-muted block mb-2">
                Color Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-base border border-subtle">
                {modes.map((m) => {
                  const isActive = settings.themeMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setThemeMode(m.id)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-surface text-primary shadow-sm font-semibold border border-subtle'
                          : 'text-muted hover:text-primary hover:bg-surface-hover/50'
                      }`}
                    >
                      {m.icon}
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Palette Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted">
                  Color Palette
                </label>
                <span className="text-[11px] font-medium text-accent">
                  Active: {activeTheme.name} ({activeTheme.styleLabel})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(THEMES) as ThemePalette[]).map((paletteKey) => {
                  const t = THEMES[paletteKey];
                  const isSelected = settings.themePalette === paletteKey;

                  return (
                    <button
                      key={paletteKey}
                      type="button"
                      onClick={() => setThemePalette(paletteKey)}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border text-left ${
                        isSelected
                          ? 'bg-surface-hover border-accent shadow-xs ring-1 ring-accent/30'
                          : 'bg-base/60 border-subtle hover:bg-surface-hover/60 hover:border-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ring-2 ring-black/20 shadow-xs"
                          style={{ backgroundColor: t.swatch }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[2.5]" />}
                        </div>
                        <div>
                          <div className={`text-xs ${isSelected ? 'font-bold text-primary' : 'font-semibold text-muted'}`}>
                            {t.name}
                          </div>
                          <div className="text-[10px] text-muted">
                            {t.styleLabel}
                          </div>
                        </div>
                      </div>

                      {/* Swatch Previews */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-subtle shadow-xs"
                          style={{ backgroundColor: t.dark['--bg-base'] }}
                          title="Dark base"
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-subtle shadow-xs"
                          style={{ backgroundColor: t.light['--bg-base'] }}
                          title="Light base"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: DISPLAY & LAYOUT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-subtle">
              <LayoutGrid className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                Display & Preferences
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Default View Mode */}
              <div className="p-3.5 rounded-2xl border border-subtle bg-base/50 space-y-2">
                <label className="text-xs font-semibold text-primary block">
                  Library View Layout
                </label>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-subtle">
                  {[
                    { id: 'grid-poster', label: 'Poster', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                    { id: 'grid-square', label: 'Square', icon: <Square className="w-3.5 h-3.5" /> },
                    { id: 'list', label: 'List', icon: <List className="w-3.5 h-3.5" /> },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setViewMode(v.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        settings.viewMode === v.id
                          ? 'bg-base text-accent font-semibold border border-subtle shadow-xs'
                          : 'text-muted hover:text-primary'
                      }`}
                    >
                      {v.icon}
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hidden Items Visibility */}
              <div className="p-3.5 rounded-2xl border border-subtle bg-base/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-primary">Show Hidden Items</div>
                  <div className="text-[10px] text-muted">Reveal hidden games and apps in library</div>
                </div>
                <button
                  type="button"
                  onClick={toggleShowHidden}
                  className={`p-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
                    settings.showHidden
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 font-bold'
                      : 'border-subtle bg-surface text-muted hover:text-primary hover:bg-surface-hover'
                  }`}
                  title={settings.showHidden ? 'Currently showing hidden items' : 'Currently hiding hidden items'}
                >
                  {settings.showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: SCANNER & LIBRARY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-subtle">
              <HardDrive className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                Game Libraries & Scanners
              </h3>
            </div>

            <div className="p-4 rounded-2xl border border-subtle bg-base/50 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-primary">Automatic Scanners</div>
                <div className="text-[11px] text-muted mt-0.5">
                  Detects Steam libraries, Epic Games manifests, and Start Menu records ({games.length} total indexed)
                </div>
              </div>
              <button
                type="button"
                onClick={() => scanLibrary()}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-fg hover:bg-accent-hover transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Re-scan Now'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 4: ABOUT GGL */}
          <div className="p-4 rounded-2xl border border-subtle bg-base/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-xs border border-zinc-200">
                <AppLogo className="w-full h-full" variant="app" />
              </div>
              <div>
                <div className="text-xs font-bold text-primary">GGL - Generic Game Launcher</div>
                <div className="text-[11px] text-muted font-mono">v1.0.0 &bull; Windows Universal Launcher</div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-1 rounded-lg bg-surface text-muted border border-subtle">
              Active
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-subtle bg-base/20 shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-fg hover:bg-accent-hover transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
