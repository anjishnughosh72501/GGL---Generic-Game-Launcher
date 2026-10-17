import { contextBridge, ipcRenderer } from 'electron';
import { DetectedSystemApp } from '../src/types/game';

export interface ElectronAPI {
  loadUserData: () => Promise<any>;
  saveUserData: (data: any) => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  launchExecutable: (
    executablePath: string,
    args?: string,
    installDir?: string
  ) => Promise<{ success: boolean; error?: string }>;
  showItemInFolder: (filePath: string) => Promise<boolean>;
  selectFile: (filterType: 'exe' | 'image' | 'icon' | 'folder') => Promise<string | null>;
  scanAllPlatforms: () => Promise<{
    steam: any;
    epic: any;
    gog: any;
  }>;
  indexSystemApps: () => Promise<DetectedSystemApp[]>;
  extractIcon: (filePath: string) => Promise<string | null>;
  resolveShortcut: (lnkPath: string) => Promise<{ name: string; target: string; args: string; icon: string } | null>;
}

const electronAPI: ElectronAPI = {
  loadUserData: () => ipcRenderer.invoke('load-user-data'),
  saveUserData: (data: any) => ipcRenderer.invoke('save-user-data', data),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  launchExecutable: (executablePath: string, args?: string, installDir?: string) =>
    ipcRenderer.invoke('launch-executable', executablePath, args, installDir),
  showItemInFolder: (filePath: string) =>
    ipcRenderer.invoke('show-item-in-folder', filePath),
  selectFile: (filterType: 'exe' | 'image' | 'icon' | 'folder') =>
    ipcRenderer.invoke('select-file', filterType),

  scanAllPlatforms: () => ipcRenderer.invoke('scan-all-platforms'),
  indexSystemApps: () => ipcRenderer.invoke('index-system-apps'),
  extractIcon: (filePath: string) => ipcRenderer.invoke('extract-icon', filePath),
  resolveShortcut: (lnkPath: string) => ipcRenderer.invoke('resolve-shortcut', lnkPath),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
