import { GameItem } from '../../types/game';

export interface LaunchResult {
  success: boolean;
  gameId: string;
  error?: string;
  launchMethod: 'protocol' | 'executable' | 'mock';
  timestamp: number;
}

/**
 * Launches a game by either invoking its registered URI protocol
 * or by spawning a detached child process executable.
 */
export async function launchGame(game: GameItem): Promise<LaunchResult> {
  const electronAPI = (window as any).electronAPI;
  const now = Date.now();

  // If in desktop Electron environment:
  if (electronAPI) {
    try {
      if (game.launchUrl) {
        // Launch via protocol scheme (e.g. steam://run/1091500)
        await electronAPI.openExternal(game.launchUrl);
        return {
          success: true,
          gameId: game.id,
          launchMethod: 'protocol',
          timestamp: now,
        };
      } else if (game.executablePath) {
        // Launch binary directly as detached process
        const res = await electronAPI.launchExecutable(
          game.executablePath,
          game.launchArgs || '',
          game.installDir
        );
        return {
          success: res.success,
          gameId: game.id,
          error: res.error,
          launchMethod: 'executable',
          timestamp: now,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        gameId: game.id,
        error: err.message || 'Failed to launch game',
        launchMethod: game.launchUrl ? 'protocol' : 'executable',
        timestamp: now,
      };
    }
  }

  // Fallback in web/preview mode:
  console.log(`[Preview Launch] Launching "${game.title}" (Protocol: ${game.launchUrl || 'N/A'}, Path: ${game.executablePath})`);
  if (game.launchUrl) {
    try {
      window.open(game.launchUrl, '_blank');
    } catch (e) {
      console.warn('Browser could not open protocol', e);
    }
  }

  return {
    success: true,
    gameId: game.id,
    launchMethod: 'mock',
    timestamp: now,
  };
}

/**
 * Open file location in native Windows Explorer
 */
export async function showItemInFolder(pathOrFile: string): Promise<boolean> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.showItemInFolder) {
    return await electronAPI.showItemInFolder(pathOrFile);
  }
  console.log('[Preview Explorer] Show in folder:', pathOrFile);
  return true;
}
