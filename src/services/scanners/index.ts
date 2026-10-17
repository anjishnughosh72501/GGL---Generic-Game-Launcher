import { GameItem, PlatformScanResult, DetectedSystemApp } from '../../types/game';
import { SAMPLE_GAMES } from './mockGames';

export interface UnifiedScanSummary {
  games: GameItem[];
  scannedAt: number;
  steamCount: number;
  epicCount: number;
  gogCount: number;
  appCount: number;
  customCount: number;
  errors: Record<string, string>;
}

export async function scanAllPlatforms(
  existingCustomItems: GameItem[] = [],
  forceMockFallback: boolean = false
): Promise<UnifiedScanSummary> {
  const electronAPI = (window as any).electronAPI;
  const errors: Record<string, string> = {};
  let detectedItems: GameItem[] = [];

  if (electronAPI && !forceMockFallback) {
    try {
      const results: {
        steam?: PlatformScanResult;
        epic?: PlatformScanResult;
        gog?: PlatformScanResult;
      } = await electronAPI.scanAllPlatforms();

      if (results.steam) {
        if (results.steam.error) errors.steam = results.steam.error;
        detectedItems.push(...results.steam.foundGames);
      }

      if (results.epic) {
        if (results.epic.error) errors.epic = results.epic.error;
        detectedItems.push(...results.epic.foundGames);
      }

      if (results.gog) {
        if (results.gog.error) errors.gog = results.gog.error;
        detectedItems.push(...results.gog.foundGames);
      }
    } catch (err: any) {
      console.warn('Native scanning failed, using fallback:', err);
      errors.bridge = err.message || 'Scanning bridge error';
    }
  }

  // If no native games found or running in browser/preview mode, provide sample items
  if (detectedItems.length === 0) {
    detectedItems = [...SAMPLE_GAMES];
  }

  // Merge with user-added custom applications (preserve custom items)
  const combinedMap = new Map<string, GameItem>();

  for (const item of detectedItems) {
    combinedMap.set(item.id, item);
  }

  for (const custom of existingCustomItems) {
    combinedMap.set(custom.id, custom);
  }

  const finalItems = Array.from(combinedMap.values());

  return {
    games: finalItems,
    scannedAt: Date.now(),
    steamCount: finalItems.filter((g) => g.platform === 'steam').length,
    epicCount: finalItems.filter((g) => g.platform === 'epic').length,
    gogCount: finalItems.filter((g) => g.platform === 'gog').length,
    appCount: finalItems.filter((g) => g.category === 'app').length,
    customCount: finalItems.filter((g) => g.isCustom).length,
    errors,
  };
}

/**
 * Scan installed system software across Start Menu and Registry
 */
export async function scanSystemApplications(): Promise<DetectedSystemApp[]> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.indexSystemApps) {
    try {
      return await electronAPI.indexSystemApps();
    } catch (err) {
      console.warn('System app indexing error:', err);
    }
  }

  // Fallback mock system apps for preview
  return [
    {
      name: 'Google Chrome',
      targetPath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      installDir: 'C:\\Program Files\\Google\\Chrome\\Application',
      source: 'startmenu',
    },
    {
      name: 'Discord',
      targetPath: 'C:\\Users\\Rick\\AppData\\Local\\Discord\\Update.exe',
      installDir: 'C:\\Users\\Rick\\AppData\\Local\\Discord',
      source: 'startmenu',
    },
    {
      name: 'Visual Studio Code',
      targetPath: 'C:\\Program Files\\Microsoft VS Code\\Code.exe',
      installDir: 'C:\\Program Files\\Microsoft VS Code',
      source: 'startmenu',
    },
    {
      name: 'Spotify',
      targetPath: 'C:\\Users\\Rick\\AppData\\Roaming\\Spotify\\Spotify.exe',
      installDir: 'C:\\Users\\Rick\\AppData\\Roaming\\Spotify',
      source: 'startmenu',
    },
    {
      name: 'Notion',
      targetPath: 'C:\\Users\\Rick\\AppData\\Local\\Programs\\Notion\\Notion.exe',
      installDir: 'C:\\Users\\Rick\\AppData\\Local\\Programs\\Notion',
      source: 'startmenu',
    },
    {
      name: 'OBS Studio',
      targetPath: 'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe',
      installDir: 'C:\\Program Files\\obs-studio',
      source: 'startmenu',
    },
    {
      name: 'Figma',
      targetPath: 'C:\\Users\\Rick\\AppData\\Local\\Figma\\Figma.exe',
      installDir: 'C:\\Users\\Rick\\AppData\\Local\\Figma',
      source: 'startmenu',
    },
  ];
}
