import { GameItem, PlatformScanResult } from '../../types/game';

export interface NativeGOGBridge {
  queryRegistryGOGGames: () => Promise<
    Array<{
      gameId: string;
      gameName: string;
      path: string;
      exe: string;
    }>
  >;
  scanCommonGameDirs: (dirs: string[]) => Promise<
    Array<{
      title: string;
      installDir: string;
      exePath: string;
    }>
  >;
}

export async function scanGOGAndGenericGames(
  bridge?: NativeGOGBridge
): Promise<PlatformScanResult> {
  const result: PlatformScanResult = {
    platform: 'gog',
    foundGames: [],
  };

  if (!bridge) {
    return result;
  }

  try {
    const regGames = await bridge.queryRegistryGOGGames();
    const games: GameItem[] = [];

    for (const g of regGames) {
      const normPath = g.path.replace(/\\/g, '/').replace(/\/+$/, '');
      const normExe = g.exe ? g.exe.replace(/\\/g, '/').replace(/^\/+/, '') : '';
      const fullExePath = normExe ? `${normPath}/${normExe}` : normPath;

      games.push({
        id: `gog-${g.gameId}`,
        title: g.gameName,
        category: 'game',
        platform: 'gog',
        appId: g.gameId,
        installDir: normPath,
        executablePath: fullExePath,
        launchUrl: `goggalaxy://openGameView/${g.gameId}`,
        isCustom: false,
        playCount: 0,
        lastPlayed: null,
        tags: ['GOG'],
      });
    }

    // Also scan common game directories
    const commonDirs = ['C:/GOG Games', 'D:/GOG Games', 'C:/Games', 'D:/Games'];
    const genericGames = await bridge.scanCommonGameDirs(commonDirs);

    for (const gen of genericGames) {
      const exists = games.some(
        (existing) =>
          existing.title.toLowerCase() === gen.title.toLowerCase() ||
          existing.installDir.toLowerCase() === gen.installDir.toLowerCase()
      );
      if (!exists) {
        games.push({
          id: `generic-${gen.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          title: gen.title,
          category: 'game',
          platform: 'gog',
          installDir: gen.installDir,
          executablePath: gen.exePath,
          isCustom: false,
          playCount: 0,
          lastPlayed: null,
          tags: ['PC Games'],
        });
      }
    }

    result.foundGames = games;
    return result;
  } catch (err: any) {
    result.error = err.message || 'Error scanning GOG and generic games';
    return result;
  }
}
