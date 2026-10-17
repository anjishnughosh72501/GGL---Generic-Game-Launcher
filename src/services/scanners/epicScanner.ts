import { GameItem, PlatformScanResult } from '../../types/game';

export interface EpicManifestData {
  FormatVersion?: number;
  AppVersionString?: string;
  AppName: string;
  DisplayName: string;
  InstallationGuid?: string;
  InstallLocation: string;
  InstallSize?: number;
  LaunchExecutable: string;
  MainGameAppName?: string;
  CatalogNamespace?: string;
  CatalogItemId?: string;
}

export interface NativeEpicBridge {
  getProgramDataPath: () => Promise<string>;
  readDir: (dirPath: string) => Promise<string[]>;
  readFile: (filePath: string) => Promise<string>;
  fileExists: (filePath: string) => Promise<boolean>;
}

export function parseEpicManifest(
  rawJson: string
): EpicManifestData | null {
  try {
    const data = JSON.parse(rawJson);
    if (!data.AppName || !data.DisplayName) {
      return null;
    }
    return data as EpicManifestData;
  } catch (err) {
    console.error('Failed to parse Epic manifest JSON:', err);
    return null;
  }
}

export function epicManifestToGameItem(manifest: EpicManifestData): GameItem {
  const normLocation = manifest.InstallLocation.replace(/\\/g, '/').replace(/\/+$/, '');
  const normExe = manifest.LaunchExecutable.replace(/\\/g, '/').replace(/^\/+/, '');
  const fullExePath = `${normLocation}/${normExe}`;

  return {
    id: `epic-${manifest.AppName}`,
    title: manifest.DisplayName,
    category: 'game',
    platform: 'epic',
    appName: manifest.AppName,
    appId: manifest.CatalogItemId || manifest.AppName,
    installDir: normLocation,
    executablePath: fullExePath,
    launchUrl: `com.epicgames.launcher://apps/${manifest.AppName}?action=launch&silent=true`,
    coverUrl: undefined, // Will use styled card fallback or custom upload
    isCustom: false,
    playCount: 0,
    lastPlayed: null,
    tags: ['Epic Games'],
  };
}

export async function scanEpicGames(
  bridge?: NativeEpicBridge
): Promise<PlatformScanResult> {
  const result: PlatformScanResult = {
    platform: 'epic',
    foundGames: [],
  };

  if (!bridge) {
    return result;
  }

  try {
    const programData = await bridge.getProgramDataPath();
    const normalizedProgramData = programData.replace(/\\/g, '/').replace(/\/+$/, '');
    const manifestsDir = `${normalizedProgramData}/Epic/EpicGamesLauncher/Data/Manifests`;

    result.detectedPath = manifestsDir;

    const exists = await bridge.fileExists(manifestsDir);
    if (!exists) {
      result.error = `Epic manifests folder not found at ${manifestsDir}`;
      return result;
    }

    const files = await bridge.readDir(manifestsDir);
    const itemFiles = files.filter((f) => f.toLowerCase().endsWith('.item'));

    const games: GameItem[] = [];

    for (const file of itemFiles) {
      try {
        const filePath = `${manifestsDir}/${file}`;
        const content = await bridge.readFile(filePath);
        const manifest = parseEpicManifest(content);

        if (manifest) {
          // Filter out Epic Unreal Engine or tool apps if desired, but keep games
          const gameItem = epicManifestToGameItem(manifest);
          games.push(gameItem);
        }
      } catch (fileErr) {
        console.warn(`Error reading Epic manifest file ${file}:`, fileErr);
      }
    }

    result.foundGames = games;
    return result;
  } catch (err: any) {
    result.error = err.message || 'Unknown error scanning Epic Games';
    return result;
  }
}
