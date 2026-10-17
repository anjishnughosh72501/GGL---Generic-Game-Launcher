import { create } from 'zustand';
import {
  GameItem,
  HubSettings,
  DetectedSystemApp,
  ThemePalette,
  ThemeMode,
  ViewMode,
  PlatformType,
  LaunchProcessState,
} from '../types/game';
import { scanAllPlatforms, scanSystemApplications, UnifiedScanSummary } from '../services/scanners';
import { resolveAppIcon, resolveGameCover } from '../services/artwork';
import { applyThemeTokens } from '../styles/themes';
import { launchGame } from '../services/launcher';

interface StoredData {
  games: GameItem[];
  themePalette?: ThemePalette;
  themeMode?: ThemeMode;
  viewMode: ViewMode;
}

const STORAGE_KEY = 'fluent_hub_state';

async function persistToStorage(
  games: GameItem[],
  themePalette: ThemePalette,
  themeMode: ThemeMode,
  viewMode: ViewMode
) {
  try {
    const data: StoredData = { games, themePalette, themeMode, viewMode };
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.saveUserData) {
      await electronAPI.saveUserData(data);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.error('Failed to persist hub data:', err);
  }
}

async function loadFromStorage(): Promise<StoredData | null> {
  try {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.loadUserData) {
      const data = await electronAPI.loadUserData();
      if (data && data.games) return data;
    }
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch (err) {
    console.warn('Could not load stored data:', err);
  }
  return null;
}

interface HubStoreState {
  games: GameItem[];
  settings: HubSettings;
  isScanning: boolean;
  scanSummary: UnifiedScanSummary | null;
  systemApps: DetectedSystemApp[];
  isSpotlightOpen: boolean;
  isStatsOpen: boolean;
  editingGame: GameItem | null;
  activeLaunch: LaunchProcessState | null;
  activeMenuId: string | null;

  // Actions
  initializeStore: () => Promise<void>;
  setThemePalette: (themePalette: ThemePalette) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setActiveFilter: (filter: HubSettings['activeFilter']) => void;
  setActivePlatform: (platform: HubSettings['activePlatform']) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setSortBy: (sortBy: HubSettings['sortBy']) => void;
  toggleSortOrder: () => void;
  toggleShowHidden: () => void;
  scanLibrary: (forceMock?: boolean) => Promise<void>;
  loadSystemApps: () => Promise<void>;
  addProgramFromSystem: (app: DetectedSystemApp) => Promise<void>;
  addCustomProgram: (newApp: {
    title: string;
    executablePath: string;
    launchArgs?: string;
    coverUrl?: string;
    category: 'game' | 'app';
    tags: string[];
  }) => Promise<void>;
  updateGame: (id: string, updates: Partial<GameItem>) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleHide: (id: string) => Promise<void>;
  recordLaunch: (id: string) => Promise<void>;
  executeLaunch: (item: GameItem) => Promise<void>;
  dismissLaunchProcess: () => void;
  setSpotlightOpen: (open: boolean) => void;
  setStatsOpen: (open: boolean) => void;
  setEditingGame: (game: GameItem | null) => void;
  setActiveMenuId: (id: string | null) => void;
}

export const useGameStore = create<HubStoreState>((set, get) => ({
  games: [],
  settings: {
    themePalette: 'zinc',
    themeMode: 'dark',
    viewMode: 'grid-poster',
    activeFilter: 'all',
    activePlatform: 'all',
    searchQuery: '',
    selectedTag: null,
    sortBy: 'lastPlayed',
    sortOrder: 'desc',
    showHidden: false,
  },
  isScanning: false,
  scanSummary: null,
  systemApps: [],
  isSpotlightOpen: false,
  isStatsOpen: false,
  editingGame: null,
  activeLaunch: null,
  activeMenuId: null,

  setActiveMenuId: (id: string | null) => {
    set({ activeMenuId: id });
  },

  initializeStore: async () => {
    const stored = await loadFromStorage();
    let initialGames: GameItem[] = [];
    let initialPalette: ThemePalette = 'zinc';
    let initialTheme: ThemeMode = 'dark';
    let initialView: ViewMode = 'grid-poster';

    if (stored) {
      if (stored.games && stored.games.length > 0) initialGames = stored.games;
      if (stored.themePalette) initialPalette = stored.themePalette;
      if (stored.themeMode) initialTheme = stored.themeMode;
      if (stored.viewMode) initialView = stored.viewMode;
    }

    applyThemeTokens(initialPalette, initialTheme);

    set((state) => ({
      games: initialGames,
      settings: {
        ...state.settings,
        themePalette: initialPalette,
        themeMode: initialTheme,
        viewMode: initialView,
      },
    }));

    if (initialGames.length === 0) {
      await get().scanLibrary();
    }

    get().loadSystemApps();

    // Universal Background Thumbnail Enrichment:
    // Any existing game missing coverUrl or iconUrl is resolved in background and persisted
    setTimeout(async () => {
      const current = get().games;
      for (const g of current) {
        let changed = false;
        let cover = g.coverUrl;
        let icon = g.iconUrl;

        if (!cover && g.category === 'game') {
          try {
            const resolved = await resolveGameCover(g.title, g.installDir);
            if (resolved) {
              cover = resolved;
              changed = true;
            }
          } catch {
            // ignore
          }
        }

        if (!icon && g.executablePath) {
          try {
            const resolvedIcon = await resolveAppIcon(g.executablePath);
            if (resolvedIcon) {
              icon = resolvedIcon;
              changed = true;
            }
          } catch {
            // ignore
          }
        }

        if (changed) {
          await get().updateGame(g.id, { coverUrl: cover, iconUrl: icon });
        }
      }
    }, 1200);
  },

  setThemePalette: (themePalette) => {
    set((state) => {
      const newSettings = { ...state.settings, themePalette };
      applyThemeTokens(themePalette, state.settings.themeMode);
      persistToStorage(
        state.games,
        themePalette,
        state.settings.themeMode,
        state.settings.viewMode
      );
      return { settings: newSettings };
    });
  },

  setThemeMode: (themeMode) => {
    set((state) => {
      const newSettings = { ...state.settings, themeMode };
      applyThemeTokens(state.settings.themePalette, themeMode);
      persistToStorage(
        state.games,
        state.settings.themePalette,
        themeMode,
        state.settings.viewMode
      );
      return { settings: newSettings };
    });
  },

  setViewMode: (viewMode) => {
    set((state) => {
      const newSettings = { ...state.settings, viewMode };
      persistToStorage(
        state.games,
        state.settings.themePalette,
        state.settings.themeMode,
        viewMode
      );
      return { settings: newSettings };
    });
  },

  setActiveFilter: (activeFilter) => {
    set((state) => ({ settings: { ...state.settings, activeFilter } }));
  },

  setActivePlatform: (activePlatform) => {
    set((state) => ({ settings: { ...state.settings, activePlatform } }));
  },

  setSearchQuery: (searchQuery) => {
    set((state) => ({ settings: { ...state.settings, searchQuery } }));
  },

  setSelectedTag: (selectedTag) => {
    set((state) => ({ settings: { ...state.settings, selectedTag } }));
  },

  setSortBy: (sortBy) => {
    set((state) => ({ settings: { ...state.settings, sortBy } }));
  },

  toggleSortOrder: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        sortOrder: state.settings.sortOrder === 'asc' ? 'desc' : 'asc',
      },
    }));
  },

  toggleShowHidden: () => {
    set((state) => ({
      settings: { ...state.settings, showHidden: !state.settings.showHidden },
    }));
  },

  scanLibrary: async (forceMock: boolean = false) => {
    set({ isScanning: true });
    try {
      const currentCustom = get().games.filter((g) => g.isCustom);
      const summary = await scanAllPlatforms(currentCustom, forceMock);

      const existingMap = new Map(get().games.map((g) => [g.id, g]));
      const mergedItems = summary.games.map((scanned) => {
        const existing = existingMap.get(scanned.id);
        if (existing) {
          return {
            ...scanned,
            playCount: existing.playCount ?? scanned.playCount,
            lastPlayed: existing.lastPlayed ?? scanned.lastPlayed,
            favorite: existing.favorite ?? scanned.favorite,
            hidden: existing.hidden ?? scanned.hidden,
            tags: Array.from(new Set([...scanned.tags, ...existing.tags])),
          };
        }
        return scanned;
      });

      set({
        games: mergedItems,
        scanSummary: summary,
        isScanning: false,
      });

      await persistToStorage(
        mergedItems,
        get().settings.themePalette,
        get().settings.themeMode,
        get().settings.viewMode
      );
    } catch (err) {
      console.error('Scan error:', err);
      set({ isScanning: false });
    }
  },

  loadSystemApps: async () => {
    try {
      const apps = await scanSystemApplications();
      set({ systemApps: apps });
    } catch (err) {
      console.warn('Failed to index system apps:', err);
    }
  },

  addProgramFromSystem: async (app) => {
    const exists = get().games.some(
      (g) =>
        g.executablePath.toLowerCase() === app.targetPath.toLowerCase() &&
        (g.launchArgs || '') === (app.launchArgs || '')
    );
    if (exists) {
      set({ isSpotlightOpen: false });
      return;
    }

    let iconUrl: string | undefined = undefined;
    try {
      const iconTarget = app.iconPath || app.targetPath;
      const extracted = await resolveAppIcon(iconTarget);
      if (extracted) iconUrl = extracted;
    } catch (e) {
      // ignore
    }

    const isGame =
      app.category === 'game' ||
      /pok[eé]mon|game|tcg|craft|strike|bluestacks.*launchApp/i.test(
        app.name + ' ' + (app.launchArgs || '')
      );

    let coverUrl: string | undefined = undefined;
    if (isGame) {
      try {
        const resolved = await resolveGameCover(app.name, app.installDir || app.targetPath);
        if (resolved) coverUrl = resolved;
      } catch (e) {
        // ignore
      }
    }

    const newItem: GameItem = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: app.name,
      category: isGame ? 'game' : (app.category || 'app'),
      platform: app.source === 'bluestacks' ? 'custom' : 'system',
      executablePath: app.targetPath,
      launchArgs: app.launchArgs,
      installDir: app.installDir || '',
      coverUrl,
      iconUrl,
      isCustom: true,
      playCount: 0,
      lastPlayed: null,
      tags: isGame
        ? ['Game', app.source === 'bluestacks' ? 'BlueStacks' : 'PC Game']
        : ['Application'],
      favorite: false,
      hidden: false,
    };

    const updated = [newItem, ...get().games];
    set({ games: updated, isSpotlightOpen: false });
    await persistToStorage(
      updated,
      get().settings.themePalette,
      get().settings.themeMode,
      get().settings.viewMode
    );
  },

  addCustomProgram: async (newApp) => {
    let iconUrl: string | undefined = undefined;
    try {
      const extracted = await resolveAppIcon(newApp.executablePath);
      if (extracted) iconUrl = extracted;
    } catch (e) {
      // ignore
    }

    let coverUrl = newApp.coverUrl;
    if (!coverUrl && newApp.category === 'game') {
      try {
        const resolved = await resolveGameCover(newApp.title, newApp.executablePath);
        if (resolved) coverUrl = resolved;
      } catch (e) {
        // ignore
      }
    }

    const newItem: GameItem = {
      id: `custom-${Date.now()}`,
      title: newApp.title.trim(),
      category: newApp.category,
      platform: 'custom',
      executablePath: newApp.executablePath,
      launchArgs: newApp.launchArgs,
      coverUrl,
      iconUrl,
      installDir: newApp.executablePath.replace(/[/\\][^/\\]+$/, ''),
      isCustom: true,
      playCount: 0,
      lastPlayed: null,
      tags: newApp.tags.length > 0 ? newApp.tags : [newApp.category === 'game' ? 'Game' : 'App'],
      favorite: false,
      hidden: false,
    };

    const updated = [newItem, ...get().games];
    set({ games: updated, isSpotlightOpen: false });
    await persistToStorage(
      updated,
      get().settings.themePalette,
      get().settings.themeMode,
      get().settings.viewMode
    );
  },

  updateGame: async (id, updates) => {
    const updated = get().games.map((g) => (g.id === id ? { ...g, ...updates } : g));
    set({ games: updated, editingGame: null });
    await persistToStorage(
      updated,
      get().settings.themePalette,
      get().settings.themeMode,
      get().settings.viewMode
    );
  },

  deleteGame: async (id) => {
    const updated = get().games.filter((g) => g.id !== id);
    set({ games: updated });
    await persistToStorage(
      updated,
      get().settings.themePalette,
      get().settings.themeMode,
      get().settings.viewMode
    );
  },

  toggleFavorite: async (id) => {
    const updated = get().games.map((g) =>
      g.id === id ? { ...g, favorite: !g.favorite } : g
    );
    set({ games: updated });
    await persistToStorage(
      updated,
      get().settings.themePalette,
      get().settings.themeMode,
      get().settings.viewMode
    );
  },

  toggleHide: async (id) => {
    const updated = get().games.map((g) =>
      g.id === id ? { ...g, hidden: !g.hidden } : g
    );
    set({ games: updated });
    await persistToStorage(
      updated,
      get().settings.themePalette,
      get().settings.themeMode,
      get().settings.viewMode
    );
  },

  recordLaunch: async (id) => {
    const updated = get().games.map((g) =>
      g.id === id
        ? {
            ...g,
            playCount: (g.playCount || 0) + 1,
            lastPlayed: Date.now(),
          }
        : g
    );
    set({ games: updated });
    await persistToStorage(
      updated,
      get().settings.themePalette,
      get().settings.themeMode,
      get().settings.viewMode
    );
  },

  executeLaunch: async (item: GameItem) => {
    const startedAt = Date.now();
    const method: 'protocol' | 'executable' | 'mock' = item.launchUrl
      ? 'protocol'
      : item.executablePath
      ? 'executable'
      : 'mock';
    const target = item.launchUrl || item.executablePath;

    // Phase 1: Preparing
    set({
      activeLaunch: {
        item,
        step: 'preparing',
        stepMessage: 'Verifying executable path and program integrity...',
        progress: 25,
        details: { method, target, args: item.launchArgs, startedAt },
      },
    });

    await new Promise((r) => setTimeout(r, 280));

    // Phase 2: Resolving
    set({
      activeLaunch: {
        item,
        step: 'resolving',
        stepMessage: item.launchUrl
          ? `Resolving registered desktop protocol URI: ${item.launchUrl}`
          : `Configuring execution directory: ${item.installDir || 'Default directory'}`,
        progress: 55,
        details: { method, target, args: item.launchArgs, startedAt },
      },
    });

    await new Promise((r) => setTimeout(r, 320));

    // Phase 3: Spawning
    set({
      activeLaunch: {
        item,
        step: 'spawning',
        stepMessage: 'Spawning detached process handle in Windows session...',
        progress: 80,
        details: { method, target, args: item.launchArgs, startedAt },
      },
    });

    const res = await launchGame(item);
    const completedAt = Date.now();

    if (res.success) {
      await get().recordLaunch(item.id);
      set({
        activeLaunch: {
          item,
          step: 'running',
          stepMessage: `${item.title} is now running in Windows graphics session.`,
          progress: 100,
          details: { method, target, args: item.launchArgs, startedAt, completedAt },
        },
      });

      // Auto-dismiss notification after 4.5 seconds
      setTimeout(() => {
        const cur = get().activeLaunch;
        if (cur && cur.item.id === item.id && cur.step === 'running') {
          set({ activeLaunch: null });
        }
      }, 4500);
    } else {
      set({
        activeLaunch: {
          item,
          step: 'error',
          stepMessage: res.error || 'Failed to initialize application process',
          progress: 100,
          details: { method, target, args: item.launchArgs, startedAt, completedAt, error: res.error },
        },
      });
    }
  },

  dismissLaunchProcess: () => set({ activeLaunch: null }),
  setSpotlightOpen: (isSpotlightOpen) => set({ isSpotlightOpen }),
  setStatsOpen: (isStatsOpen) => set({ isStatsOpen }),
  setEditingGame: (editingGame) => set({ editingGame }),
}));
