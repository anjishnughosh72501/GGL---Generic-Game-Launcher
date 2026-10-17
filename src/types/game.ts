export type PlatformType = 'steam' | 'epic' | 'gog' | 'custom' | 'system';
export type AppCategory = 'game' | 'app';
export type ViewMode = 'grid-poster' | 'grid-square' | 'list';
export type ThemeMode = 'dark' | 'light';

export interface GameItem {
  id: string;
  title: string;
  category: AppCategory;
  platform: PlatformType;
  executablePath: string;
  launchArgs?: string;
  launchUrl?: string; // steam://run/<appid> or com.epicgames.launcher://...
  coverUrl?: string; // Poster art (2:3 or 16:9)
  iconUrl?: string; // High-res icon (extracted or web PNG)
  installDir: string;
  isCustom: boolean;
  hidden?: boolean;
  favorite?: boolean;
  tags: string[];
  playCount: number;
  lastPlayed: number | null; // ms timestamp
  appId?: string;
  appName?: string;
  description?: string;
}

export interface PlatformScanResult {
  platform: PlatformType;
  foundGames: GameItem[];
  detectedPath?: string;
  error?: string;
}

export interface DetectedSystemApp {
  name: string;
  targetPath: string;
  launchArgs?: string;
  category?: 'game' | 'app';
  installDir: string;
  iconPath?: string;
  iconUrl?: string;
  source: 'startmenu' | 'desktop' | 'bluestacks' | 'registry';
}

export interface LaunchProcessState {
  item: GameItem;
  step: 'preparing' | 'resolving' | 'spawning' | 'running' | 'error';
  stepMessage: string;
  progress: number; // 0 to 100
  details: {
    method: 'protocol' | 'executable' | 'mock';
    target: string;
    args?: string;
    startedAt: number;
    completedAt?: number;
    error?: string;
  };
}

export interface HubSettings {
  themeMode: ThemeMode;
  viewMode: ViewMode;
  activeFilter: 'all' | 'game' | 'app' | 'favorites' | 'recent';
  activePlatform: 'all' | PlatformType;
  searchQuery: string;
  selectedTag: string | null;
  sortBy: 'lastPlayed' | 'playCount' | 'title' | 'category';
  sortOrder: 'asc' | 'desc';
  showHidden: boolean;
}
