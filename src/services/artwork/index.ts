/**
 * Automated Artwork & Thumbnail Pipeline
 * Tier 1: Steam CDN
 * Tier 2: Native Executable / Shortcut Icon Extraction (.exe/.ico via PowerShell)
 * Tier 3: Web Cover Art Fetch
 * Tier 4: Spotify/Notion-style Clean Monogram
 */

const iconCache = new Map<string, string>();

/**
 * Curated high-res cover art repository for popular PC games
 * Automatically maps games to official Steam CDN 600x900 / 300x450 library assets
 */
const KNOWN_GAME_COVERS: Record<string, string> = {
  assettocorsa: 'https://steamcdn-a.akamaihd.net/steam/apps/244210/library_600x900_2x.jpg',
  fifa16: 'https://www.fifplay.com/img/public/fifa-16-cover.jpg',
  fifa22: 'https://steamcdn-a.akamaihd.net/steam/apps/1506830/library_600x900_2x.jpg',
  minecraft: 'https://cdn2.steamgriddb.com/grid/c089f21f15aa8ffc8a82cf91c4943f75.png',
  pokemontcgp: 'https://images.seeklogo.com/logo-png/54/1/pokemon-tcg-pocket-logo-png_seeklogo-543224.png',
  cyberpunk2077: 'https://steamcdn-a.akamaihd.net/steam/apps/1091500/library_600x900_2x.jpg',
  witcher3: 'https://steamcdn-a.akamaihd.net/steam/apps/292030/library_600x900_2x.jpg',
  eldenring: 'https://steamcdn-a.akamaihd.net/steam/apps/1245620/library_600x900_2x.jpg',
  gtav: 'https://steamcdn-a.akamaihd.net/steam/apps/271590/library_600x900_2x.jpg',
  gta5: 'https://steamcdn-a.akamaihd.net/steam/apps/271590/library_600x900_2x.jpg',
  forzahorizon5: 'https://steamcdn-a.akamaihd.net/steam/apps/1551360/library_600x900_2x.jpg',
  baldursgate3: 'https://steamcdn-a.akamaihd.net/steam/apps/1086940/library_600x900_2x.jpg',
  counterstrike2: 'https://steamcdn-a.akamaihd.net/steam/apps/730/library_600x900_2x.jpg',
  dota2: 'https://steamcdn-a.akamaihd.net/steam/apps/570/library_600x900_2x.jpg',
  apexlegends: 'https://steamcdn-a.akamaihd.net/steam/apps/1172470/library_600x900_2x.jpg',
  rocketleague: 'https://steamcdn-a.akamaihd.net/steam/apps/252950/library_600x900_2x.jpg',
};

export function getKnownCoverUrl(title: string): string | null {
  if (!title) return null;
  const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  return KNOWN_GAME_COVERS[key] || null;
}

export async function resolveAppIcon(
  executablePath: string
): Promise<string | null> {
  if (!executablePath) return null;

  if (iconCache.has(executablePath)) {
    return iconCache.get(executablePath)!;
  }

  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.extractIcon) {
    try {
      const dataUrl = await electronAPI.extractIcon(executablePath);
      if (dataUrl) {
        iconCache.set(executablePath, dataUrl);
        return dataUrl;
      }
    } catch (err) {
      console.warn(`Icon extraction error for ${executablePath}:`, err);
    }
  }

  return null;
}

export function getMonogram(title: string): string {
  if (!title) return 'AP';
  const clean = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'AP';
}

export function getSoftSlateGradient(title: string, isDark: boolean = true): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hues = [215, 225, 240, 260, 280, 200, 160, 340];
  const hue = hues[Math.abs(hash) % hues.length];

  if (isDark) {
    return `linear-gradient(145deg, hsl(${hue}, 20%, 14%) 0%, hsl(${hue}, 25%, 9%) 100%)`;
  } else {
    return `linear-gradient(145deg, hsl(${hue}, 28%, 94%) 0%, hsl(${hue}, 25%, 88%) 100%)`;
  }
}

