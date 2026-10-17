import { parseVDF, VDFObject } from './vdfParser';
import { GameItem } from '../../../types/game';

export interface SteamAppManifest {
  appid: string;
  name: string;
  installdir: string;
  sizeOnDisk?: number;
  lastUpdated?: number;
}

/**
 * Parses a Steam appmanifest_<appid>.acf file content into a SteamAppManifest
 */
export function parseSteamACF(content: string): SteamAppManifest | null {
  try {
    const parsed = parseVDF(content);
    const appState = (parsed['AppState'] as VDFObject) || parsed;

    if (!appState || typeof appState !== 'object') {
      return null;
    }

    const appid = String(appState['appid'] || '');
    const name = String(appState['name'] || '');
    const installdir = String(appState['installdir'] || '');

    if (!appid || !name) {
      return null;
    }

    const sizeOnDisk = appState['SizeOnDisk']
      ? parseInt(String(appState['SizeOnDisk']), 10)
      : undefined;
    const lastUpdated = appState['LastUpdated']
      ? parseInt(String(appState['LastUpdated']), 10)
      : undefined;

    return {
      appid,
      name,
      installdir,
      sizeOnDisk,
      lastUpdated,
    };
  } catch (err) {
    console.error('Failed to parse Steam ACF manifest:', err);
    return null;
  }
}

/**
 * Convert a SteamAppManifest into our unified GameItem interface
 */
export function steamManifestToGameItem(
  manifest: SteamAppManifest,
  libraryPath: string
): GameItem {
  const fullInstallDir = `${libraryPath.replace(/[\\/]+$/, '')}/steamapps/common/${manifest.installdir}`;

  return {
    id: `steam-${manifest.appid}`,
    title: manifest.name,
    category: 'game',
    platform: 'steam',
    appId: manifest.appid,
    installDir: fullInstallDir,
    executablePath: fullInstallDir, // Steam launches via protocol; dir is anchor
    launchUrl: `steam://run/${manifest.appid}`,
    coverUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${manifest.appid}/library_600x900_2x.jpg`,
    isCustom: false,
    playCount: 0,
    lastPlayed: null,
    tags: ['Steam'],
  };
}
