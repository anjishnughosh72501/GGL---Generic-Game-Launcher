import { GameItem, PlatformScanResult } from '../../types/game';
import { parseVDF, extractLibraryFolders } from './parsers/vdfParser';
import { parseSteamACF, steamManifestToGameItem } from './parsers/acfParser';

/**
 * Interface for native file system and registry operations
 * Provided by Electron preload or IPC bridge in desktop mode
 */
export interface NativeSteamBridge {
  queryRegistrySteamPath: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<string>;
  readDir: (dirPath: string) => Promise<string[]>;
  fileExists: (filePath: string) => Promise<boolean>;
}

export async function scanSteamGames(
  bridge?: NativeSteamBridge
): Promise<PlatformScanResult> {
  const result: PlatformScanResult = {
    platform: 'steam',
    foundGames: [],
  };

  if (!bridge) {
    return result;
  }

  try {
    const steamPath = await bridge.queryRegistrySteamPath();
    if (!steamPath) {
      result.error = 'Steam path not found in registry';
      return result;
    }

    result.detectedPath = steamPath;
    const normalizedSteamPath = steamPath.replace(/\\/g, '/').replace(/\/+$/, '');
    const libraryVdfPath = `${normalizedSteamPath}/steamapps/libraryfolders.vdf`;

    const vdfExists = await bridge.fileExists(libraryVdfPath);
    if (!vdfExists) {
      result.error = `libraryfolders.vdf not found at ${libraryVdfPath}`;
      return result;
    }

    const vdfContent = await bridge.readFile(libraryVdfPath);
    const parsedVdf = parseVDF(vdfContent);
    const libraryFolders = extractLibraryFolders(parsedVdf);

    // Ensure the main steam path is included
    if (!libraryFolders.some((f) => f.toLowerCase() === normalizedSteamPath.toLowerCase())) {
      libraryFolders.unshift(normalizedSteamPath);
    }

    const games: GameItem[] = [];

    for (const library of libraryFolders) {
      const normalizedLib = library.replace(/\\/g, '/').replace(/\/+$/, '');
      const steamAppsDir = `${normalizedLib}/steamapps`;

      const dirExists = await bridge.fileExists(steamAppsDir);
      if (!dirExists) continue;

      try {
        const files = await bridge.readDir(steamAppsDir);
        const acfFiles = files.filter((f) => /^appmanifest_\d+\.acf$/i.test(f));

        for (const acfFile of acfFiles) {
          try {
            const acfPath = `${steamAppsDir}/${acfFile}`;
            const acfContent = await bridge.readFile(acfPath);
            const manifest = parseSteamACF(acfContent);

            if (manifest) {
              // Ignore Steamworks Common Redistributables
              if (manifest.appid === '228980') continue;

              const gameItem = steamManifestToGameItem(manifest, normalizedLib);
              games.push(gameItem);
            }
          } catch (fileErr) {
            console.warn(`Failed reading manifest ${acfFile}:`, fileErr);
          }
        }
      } catch (dirErr) {
        console.warn(`Failed reading steamapps dir ${steamAppsDir}:`, dirErr);
      }
    }

    result.foundGames = games;
    return result;
  } catch (err: any) {
    result.error = err.message || 'Unknown error scanning Steam';
    return result;
  }
}
