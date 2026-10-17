import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Plus,
  FolderOpen,
  Check,
  CheckCircle2,
  HardDrive,
  Gamepad2,
  Sparkles,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { DetectedSystemApp } from '../types/game';

export const SpotlightModal: React.FC = () => {
  const {
    isSpotlightOpen,
    setSpotlightOpen,
    systemApps,
    loadSystemApps,
    addProgramFromSystem,
    addCustomProgram,
    games,
    settings,
  } = useGameStore();

  const isDark = settings.themeMode === 'dark';
  const [activeTab, setActiveTab] = useState<'indexer' | 'custom'>('indexer');
  const [search, setSearch] = useState('');

  // Custom addition fields
  const [customTitle, setCustomTitle] = useState('');
  const [customExe, setCustomExe] = useState('');
  const [customArgs, setCustomArgs] = useState('');
  const [customCover, setCustomCover] = useState('');
  const [customCategory, setCustomCategory] = useState<'game' | 'app'>('game');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Set of already added paths and arguments
  const addedKeys = useMemo(() => {
    return new Set(
      games.map(
        (g) => `${g.executablePath.toLowerCase()}|${(g.launchArgs || '').toLowerCase()}`
      )
    );
  }, [games]);

  // Normalize string for fuzzy accent-insensitive search (e.g. pokemon matches Pokémon)
  const normalize = (str: string) =>
    (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Filter detected system apps
  const filteredApps = useMemo(() => {
    if (!search.trim()) return systemApps.slice(0, 50);
    const q = normalize(search);
    return systemApps
      .filter((app) => {
        const nName = normalize(app.name);
        const nPath = normalize(app.targetPath);
        const nArgs = normalize(app.launchArgs || '');
        return (
          nName.includes(q) ||
          nPath.includes(q) ||
          nArgs.includes(q) ||
          (q.includes('pokemon') && nName.includes('pok')) ||
          (q.includes('tcg') && (nName.includes('tcg') || nArgs.includes('tcg'))) ||
          (q.includes('bluestacks') && (app.source === 'bluestacks' || nPath.includes('bluestacks')))
        );
      })
      .slice(0, 50);
  }, [systemApps, search]);

  // Detected emulator games (BlueStacks, etc.)
  const emulatorGames = useMemo(() => {
    return systemApps.filter(
      (app) =>
        app.source === 'bluestacks' ||
        app.targetPath.includes('BlueStacks') ||
        (app.launchArgs && app.launchArgs.includes('launchApp'))
    );
  }, [systemApps]);

  // Load system apps when opening
  useEffect(() => {
    if (isSpotlightOpen) {
      loadSystemApps();
    }
  }, [isSpotlightOpen, loadSystemApps]);

  // Global Ctrl+K / Cmd+K keybinding listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen(!isSpotlightOpen);
      } else if (e.key === 'Escape' && isSpotlightOpen) {
        setSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpotlightOpen, setSpotlightOpen]);

  if (!isSpotlightOpen) return null;

  const handleSelectExe = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.selectFile) {
      const selected = await electronAPI.selectFile('exe');
      if (selected) {
        // If a .lnk shortcut was selected, resolve its target executable & arguments automatically
        if (selected.toLowerCase().endsWith('.lnk') && electronAPI.resolveShortcut) {
          const resolved = await electronAPI.resolveShortcut(selected);
          if (resolved) {
            setCustomExe(resolved.target);
            setCustomArgs(resolved.args);
            setCustomTitle(resolved.name || '');
            if (resolved.icon) setCustomCover(resolved.icon);
            if (resolved.target.includes('BlueStacks') || resolved.args.includes('launchApp')) {
              setCustomCategory('game');
            }
            return;
          }
        }
        setCustomExe(selected);
        if (!customTitle) {
          const fileName = selected.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '');
          if (fileName) setCustomTitle(fileName.replace(/[_-]/g, ' '));
        }
      }
    }
  };

  const handleSelectCover = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.selectFile) {
      const selected = await electronAPI.selectFile('image');
      if (selected) setCustomCover(selected);
    }
  };

  const handlePopulateFromApp = (app: DetectedSystemApp) => {
    setCustomTitle(app.name);
    setCustomExe(app.targetPath);
    setCustomArgs(app.launchArgs || '');
    if (app.iconPath) setCustomCover(app.iconPath);
    setCustomCategory(app.category || 'game');
    setActiveTab('custom');
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customExe.trim()) return;

    await addCustomProgram({
      title: customTitle.trim(),
      executablePath: customExe.trim(),
      launchArgs: customArgs.trim() || undefined,
      coverUrl: customCover.trim() || undefined,
      category: customCategory,
      tags: customTags,
    });

    // Reset
    setCustomTitle('');
    setCustomExe('');
    setCustomArgs('');
    setCustomCover('');
    setCustomTags([]);
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !customTags.includes(t)) {
      setCustomTags([...customTags, t]);
      setTagInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div

        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Raycast / Spotlight Top Search Header */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-zinc-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={
                activeTab === 'indexer'
                  ? 'Search installed PC apps, games, BlueStacks software...'
                  : 'Add a custom program or emulator game...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm bg-transparent outline-none placeholder:text-zinc-400 font-medium"
            />
          </div>

          {/* Mode Pill Switcher */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-xs font-medium ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}
          >
            <button
              onClick={() => setActiveTab('indexer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'indexer'
                  ? isDark
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Detected Software ({systemApps.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? isDark
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Custom File / Emulator
            </button>
          </div>

          <button
            onClick={() => setSpotlightOpen(false)}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'indexer' ? (
          /* System App Indexer List */
          <div className="max-h-[440px] overflow-y-auto p-2 divide-y divide-zinc-100 dark:divide-zinc-800/40">
            {filteredApps.length > 0 ? (
              filteredApps.map((app, idx) => {
                const uniqueKey = `${app.targetPath.toLowerCase()}|${(app.launchArgs || '').toLowerCase()}`;
                const isAdded = addedKeys.has(uniqueKey);
                const isBlueStacks = app.source === 'bluestacks' || app.targetPath.includes('BlueStacks');

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isBlueStacks
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            : isDark
                            ? 'bg-zinc-800 border-zinc-700/60 text-zinc-400'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-500'
                        }`}
                      >
                        {isBlueStacks ? (
                          <Smartphone className="w-5 h-5" />
                        ) : app.category === 'game' ? (
                          <Gamepad2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <HardDrive className="w-5 h-5" />
                        )}
                      </div>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100">
                            {app.name}
                          </span>
                          {isBlueStacks && (
                            <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                              BlueStacks Game
                            </span>
                          )}
                          {app.source === 'desktop' && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-400 shrink-0">
                              Desktop
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-400 truncate font-mono mt-0.5">
                          {app.launchArgs ? `${app.targetPath} ${app.launchArgs}` : app.targetPath}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-4 flex items-center gap-2">
                      {isAdded ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>In Hub</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => addProgramFromSystem(app)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isBlueStacks
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                              : isDark
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Hub</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-zinc-400">
                No matching desktop software found on this PC.
              </div>
            )}
          </div>
        ) : (
          /* Manual Custom File & Emulator Addition Form */
          <form onSubmit={handleAddCustom} className="p-6 space-y-4 max-h-[460px] overflow-y-auto">
            {/* Quick Emulator Suggestions Row if BlueStacks is detected */}
            {emulatorGames.length > 0 && (
              <div
                className={`p-3 rounded-xl border mb-3 ${
                  isDark ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50/50 border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    Detected BlueStacks / Emulator Games:
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Click to auto-fill form</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {emulatorGames.map((eg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePopulateFromApp(eg)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                          : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800'
                      }`}
                    >
                      <Plus className="w-3 h-3 text-indigo-400" />
                      <span>{eg.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  Program Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pokémon TCGP, Genshin, RetroArch"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  Category
                </label>
                <div
                  className={`flex items-center p-0.5 rounded-xl border text-xs ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCustomCategory('game')}
                    className={`flex-1 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                      customCategory === 'game'
                        ? isDark
                          ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                          : 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-400'
                    }`}
                  >
                    Game
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomCategory('app')}
                    className={`flex-1 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                      customCategory === 'app'
                        ? isDark
                          ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                          : 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-400'
                    }`}
                  >
                    Application
                  </button>
                </div>
              </div>
            </div>

            {/* Executable Path Picker */}
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                Executable File (.exe, .bat, or .lnk shortcut) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="C:\Program Files\BlueStacks_nxt\HD-Player.exe or Desktop shortcut"
                  value={customExe}
                  onChange={(e) => setCustomExe(e.target.value)}
                  className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={handleSelectExe}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Browse...</span>
                </button>
              </div>
            </div>

            {/* Launch Arguments */}
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                Launch Arguments (e.g. BlueStacks package name or custom parameters)
              </label>
              <input
                type="text"
                placeholder='--instance Pie64 --cmd launchApp --package "jp.pokemon.pokemontcgp"'
                value={customArgs}
                onChange={(e) => setCustomArgs(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
              />
            </div>

            {/* Cover Image or File */}
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                Poster / Icon Artwork (URL or local .ico/.png image file)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="C:\ProgramData\BlueStacks_nxt\Engine\Pie64\AppCache\jp.pokemon.pokemontcgp.ico or URL"
                  value={customCover}
                  onChange={(e) => setCustomCover(e.target.value)}
                  className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSelectCover}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Browse...</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                Tags & Categories
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add tag (e.g. BlueStacks, TCG, Mobile)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-300'
                  }`}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {customTags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => setCustomTags(customTags.filter((x) => x !== t))}
                      className="hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSpotlightOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Add to Hub
              </button>
            </div>
          </form>
        )}

        {/* Modal Footer info */}
        <div
          className={`px-4 py-2.5 border-t text-[11px] flex items-center justify-between ${
            isDark ? 'border-zinc-800/80 bg-zinc-950/60 text-zinc-400' : 'border-zinc-200/80 bg-zinc-50 text-zinc-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Indexes Desktop, Start Menu, Registry & BlueStacks Games</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">
              Esc
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
