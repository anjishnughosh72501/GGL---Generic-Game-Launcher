import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Laptop, Palette, Check } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { THEMES, ThemePalette, ThemeMode } from '../styles/themes';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { settings, setThemePalette, setThemeMode } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeTheme = THEMES[settings.themePalette] || THEMES.zinc;
  const isDark = settings.themeMode === 'dark';

  const modes: Array<{ id: ThemeMode; label: string; icon: React.ReactNode }> = [
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'system', label: 'Auto', icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      {compact ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-muted hover:text-primary transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs"
          title={`Appearance: ${activeTheme.name}`}
          aria-label="Theme Settings"
        >
          <div
            className="w-3 h-3 rounded-full mr-1.5 shadow-xs"
            style={{ backgroundColor: activeTheme.swatch }}
          />
          <Palette className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-primary transition-all duration-200 text-xs font-medium cursor-pointer shadow-xs group"
          title="Change Theme & Appearance"
        >
          <div
            className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10 shadow-xs transition-transform group-hover:scale-110"
            style={{ backgroundColor: activeTheme.swatch }}
          />
          <span className="hidden sm:inline text-[11px] font-medium">{activeTheme.name}</span>
          <Palette className="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors" />
        </button>
      )}

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-subtle bg-surface/95 backdrop-blur-xl p-4 shadow-2xl text-primary"
            style={{ boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-subtle">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold tracking-tight">Appearance & Theme</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-hover text-muted border border-subtle">
                GGL
              </span>
            </div>

            {/* Mode Selector (Dark / Light / Auto) */}
            <div className="mb-4">
              <label className="text-[10px] uppercase font-semibold text-muted tracking-wider mb-1.5 block">
                Color Mode
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-base border border-subtle">
                {modes.map((m) => {
                  const isActive = settings.themeMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setThemeMode(m.id)}
                      className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-surface text-primary shadow-xs font-semibold border border-subtle'
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

            {/* Palettes Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">
                  Color Palette
                </label>
                <span className="text-[10px] text-muted font-medium">
                  {activeTheme.styleLabel}
                </span>
              </div>

              <div className="space-y-1">
                {(Object.keys(THEMES) as ThemePalette[]).map((paletteKey) => {
                  const t = THEMES[paletteKey];
                  const isSelected = settings.themePalette === paletteKey;

                  return (
                    <button
                      key={paletteKey}
                      onClick={() => setThemePalette(paletteKey)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-surface-hover border-accent/40 shadow-xs'
                          : 'border-transparent hover:bg-surface-hover/60 hover:border-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 ring-2 ring-black/20 shadow-xs"
                          style={{ backgroundColor: t.swatch }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="text-left">
                          <div
                            className={`text-xs ${
                              isSelected ? 'font-semibold text-primary' : 'font-medium text-muted'
                            }`}
                          >
                            {t.name}
                          </div>
                          <div className="text-[10px] text-muted">
                            {t.styleLabel}
                          </div>
                        </div>
                      </div>

                      {/* Swatch Preview Bar */}
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: t.dark['--bg-base'] }}
                          title="Dark backdrop"
                        />
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: t.light['--bg-base'] }}
                          title="Light backdrop"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
