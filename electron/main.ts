import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec, execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { parseVDF, extractLibraryFolders } from '../src/services/scanners/parsers/vdfParser';
import { parseSteamACF, steamManifestToGameItem } from '../src/services/scanners/parsers/acfParser';
import { parseEpicManifest, epicManifestToGameItem } from '../src/services/scanners/epicScanner';
import { PlatformScanResult, GameItem, DetectedSystemApp } from '../src/types/game';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

let mainWindow: BrowserWindow | null = null;

function getScriptPath(scriptName: string): string {
  const candidate1 = path.join(__dirname, 'scripts', scriptName);
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.join(__dirname, '../electron/scripts', scriptName);
  if (fs.existsSync(candidate2)) return candidate2;
  return candidate1;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 920,
    minHeight: 600,
    title: 'GGL - Generic Game Launcher',
    backgroundColor: '#09090B',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'rgba(9, 9, 11, 0.95)',
      symbolColor: '#A1A1AA',
      height: 38,
    },
    webPreferences: {
      preload: fs.existsSync(path.join(__dirname, 'preload.cjs'))
        ? path.join(__dirname, 'preload.cjs')
        : path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function getDatabaseFilePath(): string {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'fluent-hub-db.json');
}

function setupIpcHandlers() {
  // 1. Storage persistence
  ipcMain.handle('load-user-data', async () => {
    try {
      const dbPath = getDatabaseFilePath();
      if (fs.existsSync(dbPath)) {
        const raw = await fs.promises.readFile(dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading db file:', err);
    }
    return null;
  });

  ipcMain.handle('save-user-data', async (_event, data) => {
    try {
      const dbPath = getDatabaseFilePath();
      await fs.promises.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error saving db file:', err);
      return false;
    }
  });

  // 2. Protocols and Executables Launching
  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle(
    'launch-executable',
    async (_event, executablePath: string, args: string = '', installDir?: string) => {
      try {
        if (!fs.existsSync(executablePath)) {
          return { success: false, error: `Executable not found: ${executablePath}` };
        }

        const workingDir =
          installDir && fs.existsSync(installDir)
            ? installDir
            : path.dirname(executablePath);

        const argList = args ? args.split(/\s+/).filter(Boolean) : [];

        const child = spawn(executablePath, argList, {
          cwd: workingDir,
          detached: true,
          stdio: 'ignore',
          windowsHide: false,
        });

        child.unref();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Execution error' };
      }
    }
  );

  ipcMain.handle('show-item-in-folder', async (_event, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to show item in folder:', err);
      return false;
    }
  });

  // 3. File Chooser
  ipcMain.handle('select-file', async (_event, filterType: 'exe' | 'image' | 'icon' | 'folder') => {
    if (!mainWindow) return null;

    if (filterType === 'folder') {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
      });
      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    }

    const filters =
      filterType === 'exe'
        ? [
            { name: 'Executable Files', extensions: ['exe', 'bat', 'cmd', 'lnk'] },
            { name: 'All Files', extensions: ['*'] },
          ]
        : filterType === 'icon'
        ? [
            { name: 'Icon & Program Files', extensions: ['ico', 'png', 'exe', 'lnk', 'jpg', 'webp', 'svg'] },
            { name: 'All Files', extensions: ['*'] },
          ]
        : [
            { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp', 'ico', 'svg'] },
            { name: 'All Files', extensions: ['*'] },
          ];

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters,
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });


  // 4. System Installed Program Indexer
  ipcMain.handle('index-system-apps', async (): Promise<DetectedSystemApp[]> => {
    try {
      const script = getScriptPath('indexInstalledApps.ps1');
      if (!fs.existsSync(script)) {
        console.warn('indexInstalledApps.ps1 not found');
        return [];
      }

      const { stdout } = await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script],
        { maxBuffer: 20 * 1024 * 1024 }
      );

      if (!stdout || !stdout.trim()) return [];
      const parsed = JSON.parse(stdout.trim());
      const list = Array.isArray(parsed) ? parsed : [parsed];

      return list.map((item: any) => {
        let name = item.name || '';
        try {
          name = decodeURIComponent(escape(name));
        } catch {
          // ignore
        }
        return {
          ...item,
          name,
        };
      });
    } catch (err) {
      console.error('Error indexing system apps:', err);
      return [];
    }
  });

  // 5. Shortcut (.lnk) Target & Arguments Resolver
  ipcMain.handle('resolve-shortcut', async (_event, lnkPath: string) => {
    try {
      if (process.platform === 'win32' && lnkPath.toLowerCase().endsWith('.lnk')) {
        const { stdout } = await execAsync(
          `powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('${lnkPath.replace(/'/g, "''")}'); @{target=$s.TargetPath; args=$s.Arguments; icon=$s.IconLocation; name=[System.IO.Path]::GetFileNameWithoutExtension('${lnkPath.replace(/'/g, "''")}')} | ConvertTo-Json"`
        );
        if (stdout && stdout.trim()) {
          const parsed = JSON.parse(stdout.trim());
          let name = parsed.name || '';
          try {
            name = decodeURIComponent(escape(name));
          } catch {}
          return {
            name,
            target: parsed.target || '',
            args: parsed.args || '',
            icon: parsed.icon ? parsed.icon.split(',')[0].trim() : '',
          };
        }
      }
    } catch (e) {
      console.warn('Error resolving shortcut:', e);
    }
    return null;
  });

  // 5. Native Icon Extractor
  ipcMain.handle('extract-icon', async (_event, filePath: string): Promise<string | null> => {
    try {
      if (!filePath || !fs.existsSync(filePath)) return null;

      const script = getScriptPath('extractIcon.ps1');
      if (!fs.existsSync(script)) return null;

      const { stdout } = await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-filePath', filePath],
        { maxBuffer: 10 * 1024 * 1024 }
      );

      const cleaned = stdout.trim();
      if (cleaned.startsWith('data:image/png;base64,')) {
        return cleaned;
      }
      return null;
    } catch (err) {
      console.warn(`Could not extract icon for ${filePath}:`, err);
      return null;
    }
  });

  // 6. Universal Game Artwork Search (Local Folder + Online Steam Store CDN)
  ipcMain.handle('search-game-artwork', async (_event, title: string, installDir?: string) => {
    // Check local directory for cover / poster files first
    if (installDir && fs.existsSync(installDir)) {
      try {
        const files = await fs.promises.readdir(installDir);
        const coverFile = files.find((f) =>
          /^(cover|poster|folder|boxart|header|capsule)\.(jpe?g|png|webp)$/i.test(f)
        );
        if (coverFile) {
          const fullPath = path.join(installDir, coverFile);
          return { coverUrl: `file:///${fullPath.replace(/\\/g, '/')}`, iconUrl: null };
        }
      } catch (e) {
        // ignore
      }
    }

    // Dynamic Steam Store Search API (works universally for all PC titles)
    const cleanTitle = title
      .replace(/\s*\(.*?\)/g, '')
      .replace(/\s*\[.*?\]/g, '')
      .replace(/[_-]/g, ' ')
      .trim();

    try {
      const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
        cleanTitle
      )}&l=english&cc=US`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const data: any = await res.json();
        if (data.items && data.items.length > 0) {
          const match = data.items[0];
          const libraryUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${match.id}/library_600x900_2x.jpg`;
          
          // Verify if the 600x900 poster exists
          try {
            const headRes = await fetch(libraryUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (headRes.ok) {
              return {
                coverUrl: libraryUrl,
                iconUrl: match.tiny_image || null,
              };
            }
          } catch {
            // head check failed, proceed to appdetails
          }

          // If 600x900 is absent, query appdetails for authentic high-res header image
          try {
            const detailsRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${match.id}`);
            if (detailsRes.ok) {
              const detailsData: any = await detailsRes.json();
              if (detailsData[match.id]?.success && detailsData[match.id]?.data) {
                const appInfo = detailsData[match.id].data;
                const headerCover = appInfo.header_image || appInfo.capsule_image || match.tiny_image;
                if (headerCover) {
                  return {
                    coverUrl: headerCover,
                    iconUrl: match.tiny_image || null,
                  };
                }
              }
            }
          } catch {
            // details fetch failed
          }

          // Fallback to tiny_image or libraryUrl
          return {
            coverUrl: match.tiny_image || libraryUrl,
            iconUrl: match.tiny_image || null,
          };
        }
      }
    } catch (e) {
      console.warn(`Error querying Steam artwork for ${title}:`, e);
    }

    return { coverUrl: null, iconUrl: null };
  });

  // 7. Platform Game Scanners
  ipcMain.handle('scan-all-platforms', async () => {

    const [steam, epic, gog] = await Promise.all([
      scanNativeSteam(),
      scanNativeEpic(),
      scanNativeGOG(),
    ]);

    return { steam, epic, gog };
  });
}

/**
 * Native Steam Scanner
 */
async function scanNativeSteam(): Promise<PlatformScanResult> {
  const result: PlatformScanResult = { platform: 'steam', foundGames: [] };

  try {
    let steamPath: string | null = null;

    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync(
          'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath'
        );
        const match = stdout.match(/SteamPath\s+REG_SZ\s+(.*)/i);
        if (match && match[1]) {
          steamPath = match[1].trim();
        }
      } catch (e) {
        // Fallback
      }
    }

    if (!steamPath) {
      const candidates = [
        'C:\\Program Files (x86)\\Steam',
        'C:\\Program Files\\Steam',
        'D:\\Steam',
        'E:\\Steam',
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          steamPath = c;
          break;
        }
      }
    }

    if (!steamPath || !fs.existsSync(steamPath)) {
      result.error = 'Steam installation not detected';
      return result;
    }

    result.detectedPath = steamPath;
    const vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');

    if (!fs.existsSync(vdfPath)) {
      result.error = 'libraryfolders.vdf not found';
      return result;
    }

    const vdfRaw = await fs.promises.readFile(vdfPath, 'utf-8');
    const parsedVdf = parseVDF(vdfRaw);
    const libraryFolders = extractLibraryFolders(parsedVdf);

    if (!libraryFolders.some((f) => f.toLowerCase() === steamPath!.toLowerCase())) {
      libraryFolders.unshift(steamPath);
    }

    const games: GameItem[] = [];

    for (const lib of libraryFolders) {
      const steamAppsDir = path.join(lib, 'steamapps');
      if (!fs.existsSync(steamAppsDir)) continue;

      try {
        const entries = await fs.promises.readdir(steamAppsDir);
        for (const file of entries) {
          if (/^appmanifest_\d+\.acf$/i.test(file)) {
            try {
              const fullAcfPath = path.join(steamAppsDir, file);
              const acfContent = await fs.promises.readFile(fullAcfPath, 'utf-8');
              const manifest = parseSteamACF(acfContent);

              if (manifest && manifest.appid !== '228980') {
                const item = steamManifestToGameItem(manifest, lib);
                games.push({
                  ...item,
                  category: 'game',
                });
              }
            } catch (err) {
              // skip bad manifest
            }
          }
        }
      } catch (err) {
        // skip unreadable folder
      }
    }

    result.foundGames = games;
    return result;
  } catch (err: any) {
    result.error = err.message || 'Error scanning Steam';
    return result;
  }
}

/**
 * Native Epic Games Scanner
 */
async function scanNativeEpic(): Promise<PlatformScanResult> {
  const result: PlatformScanResult = { platform: 'epic', foundGames: [] };

  try {
    const programData =
      process.env.ProgramData ||
      process.env.ALLUSERSPROFILE ||
      'C:\\ProgramData';

    const manifestsDir = path.join(
      programData,
      'Epic',
      'EpicGamesLauncher',
      'Data',
      'Manifests'
    );

    result.detectedPath = manifestsDir;

    if (!fs.existsSync(manifestsDir)) {
      result.error = 'Epic Games manifests directory not found';
      return result;
    }

    const entries = await fs.promises.readdir(manifestsDir);
    const games: GameItem[] = [];

    for (const entry of entries) {
      if (entry.toLowerCase().endsWith('.item')) {
        try {
          const itemPath = path.join(manifestsDir, entry);
          const raw = await fs.promises.readFile(itemPath, 'utf-8');
          const manifest = parseEpicManifest(raw);
          if (manifest) {
            const item = epicManifestToGameItem(manifest);
            let coverUrl = item.coverUrl;
            if (!coverUrl && manifest.InstallLocation && fs.existsSync(manifest.InstallLocation)) {
              try {
                const files = await fs.promises.readdir(manifest.InstallLocation);
                const coverFile = files.find((f) =>
                  /^(cover|poster|folder|boxart|header|capsule)\.(jpe?g|png|webp)$/i.test(f)
                );
                if (coverFile) {
                  coverUrl = `file:///${path.join(manifest.InstallLocation, coverFile).replace(/\\/g, '/')}`;
                }
              } catch (e) {
                // ignore
              }
            }
            games.push({
              ...item,
              coverUrl,
              category: 'game',
            });
          }
        } catch (e) {
          // ignore corrupted manifest
        }
      }
    }

    result.foundGames = games;
    return result;
  } catch (err: any) {
    result.error = err.message || 'Error scanning Epic Games';
    return result;
  }
}

/**
 * Native GOG & Generic Games Scanner
 */
async function scanNativeGOG(): Promise<PlatformScanResult> {
  const result: PlatformScanResult = { platform: 'gog', foundGames: [] };

  try {
    const games: GameItem[] = [];

    // Query registry if on Windows
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync(
          'reg query "HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games" /s'
        );
        const blocks = stdout.split(/\r?\n\r?\n/);
        for (const block of blocks) {
          const gameIdMatch = block.match(/Games\\(\d+)/i);
          const nameMatch = block.match(/gameName\s+REG_SZ\s+(.*)/i);
          const pathMatch = block.match(/path\s+REG_SZ\s+(.*)/i);
          const exeMatch = block.match(/exe\s+REG_SZ\s+(.*)/i);

          if (gameIdMatch && nameMatch && pathMatch) {
            const gameId = gameIdMatch[1];
            const gameName = nameMatch[1].trim();
            const installPath = pathMatch[1].trim();
            const exe = exeMatch ? exeMatch[1].trim() : '';

            games.push({
              id: `gog-${gameId}`,
              title: gameName,
              category: 'game',
              platform: 'gog',
              appId: gameId,
              installDir: installPath,
              executablePath: exe ? path.join(installPath, exe) : installPath,
              launchUrl: `goggalaxy://openGameView/${gameId}`,
              isCustom: false,
              playCount: 0,
              lastPlayed: null,
              tags: ['GOG'],
            });
          }
        }
      } catch (e) {
        // Registry key not present
      }
    }

function findPrimaryGameExecutable(folderName: string, files: string[]): string | undefined {
  const cleanFolder = folderName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const candidates = files.filter(
    (f) =>
      f.toLowerCase().endsWith('.exe') &&
      !/unins|setup|crash|redist|update|config|benchmark|test|report|helper|stats|eula|dotnet/i.test(f)
  );
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  // 1. Exact match (without punctuation/spaces) e.g. AssettoCorsa.exe for "Assetto Corsa"
  const exact = candidates.find(
    (f) => f.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/exe$/, '') === cleanFolder
  );
  if (exact) return exact;

  // 2. Starts with folder name or folder starts with exe
  const startsWith = candidates.find((f) => {
    const clean = f.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/exe$/, '');
    return clean.startsWith(cleanFolder) || cleanFolder.startsWith(clean);
  });
  if (startsWith) return startsWith;

  // 3. Contains 'launcher' or 'game' or 'play' or 'start'
  const launcher = candidates.find((f) => /launcher|game|play|start/i.test(f));
  if (launcher) return launcher;

  // 4. Non-short executable name (e.g. AssettoCorsa.exe over acs.exe)
  const nonShort = candidates.filter((f) => f.replace(/\.exe$/i, '').length > 4);
  if (nonShort.length > 0) return nonShort[0];

  return candidates[0];
}

    // Common directories
    const commonFolders = ['C:\\Games', 'D:\\Games', 'C:\\GOG Games', 'D:\\GOG Games'];
    for (const folder of commonFolders) {
      if (fs.existsSync(folder)) {
        try {
          const subdirs = await fs.promises.readdir(folder, { withFileTypes: true });
          for (const dirent of subdirs) {
            if (dirent.isDirectory()) {
              const gameDir = path.join(folder, dirent.name);
              const files = await fs.promises.readdir(gameDir);
              const exe = findPrimaryGameExecutable(dirent.name, files);
              if (exe) {
                const title = dirent.name.replace(/[_-]/g, ' ');
                const alreadyFound = games.some(
                  (g) => g.title.toLowerCase() === title.toLowerCase()
                );
                if (!alreadyFound) {
                  let coverUrl: string | undefined = undefined;
                  const coverFile = files.find((f) =>
                    /^(cover|poster|folder|boxart|header|capsule)\.(jpe?g|png|webp)$/i.test(f)
                  );
                  if (coverFile) {
                    coverUrl = `file:///${path.join(gameDir, coverFile).replace(/\\/g, '/')}`;
                  }
                  games.push({
                    id: `generic-${dirent.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    title,
                    category: 'game',
                    platform: 'gog',
                    installDir: gameDir,
                    executablePath: path.join(gameDir, exe),
                    coverUrl,
                    isCustom: false,
                    playCount: 0,
                    lastPlayed: null,
                    tags: ['PC Games'],
                  });
                }
              }
            }
          }
        } catch (e) {
          // ignore unreadable folder
        }
      }
    }

    result.foundGames = games;
    return result;
  } catch (err: any) {
    result.error = err.message || 'Error scanning GOG';
    return result;
  }
}

