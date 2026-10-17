/**
 * Universal Artwork & Thumbnail Pipeline
 * Tier 1: Local Game Directory Image Assets (cover/poster/header/folder/boxart.jpg/png)
 * Tier 2: Curated Offline High-Res Library Assets (FIFA, Pokémon TCGP, Minecraft, etc.)
 * Tier 3: Dynamic Online Steam CDN Resolution (Automatic fuzzy search across Steam store catalog)
 * Tier 4: Native Executable / Shortcut Icon Extraction (.exe/.ico via PowerShell)
 * Tier 5: Spotify/Notion-style Clean Monogram with Harmonic Gradient
 */

const iconCache = new Map<string, string>();
const coverCache = new Map<string, string>();

/**
 * Curated high-res cover art repository for non-Steam & standalone PC titles
 */
const KNOWN_GAME_COVERS: Record<string, string> = {
  // EA Sports FIFA Franchise
  fifa16: 'https://www.fifplay.com/img/public/fifa-16-cover.jpg',
  fifa15: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x3c.png',
  fifa17: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x3e.png',
  fifa18: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x3f.png',
  fifa19: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x3g.png',
  fifa20: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x3h.png',
  fifa21: 'https://steamcdn-a.akamaihd.net/steam/apps/1313860/library_600x900_2x.jpg',
  fifa22: 'https://steamcdn-a.akamaihd.net/steam/apps/1506830/library_600x900_2x.jpg',
  fifa23: 'https://steamcdn-a.akamaihd.net/steam/apps/1811260/library_600x900_2x.jpg',
  eafc24: 'https://steamcdn-a.akamaihd.net/steam/apps/2195250/library_600x900_2x.jpg',
  eafc25: 'https://steamcdn-a.akamaihd.net/steam/apps/2669320/library_600x900_2x.jpg',

  // Trees Hate You
  treeshateyou: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4171850/4550c09c2fa41435b7b695f31460bea297d4ce15/header.jpg?t=1787891955',

  // Standalone / Non-Steam / Emulators
  minecraft: 'https://cdn2.steamgriddb.com/grid/c089f21f15aa8ffc8a82cf91c4943f75.png',
  tlauncher: 'https://cdn2.steamgriddb.com/grid/c089f21f15aa8ffc8a82cf91c4943f75.png',
  minecraftlauncher: 'https://cdn2.steamgriddb.com/grid/c089f21f15aa8ffc8a82cf91c4943f75.png',
  pokemontcgp: 'https://images.seeklogo.com/logo-png/54/1/pokemon-tcg-pocket-logo-png_seeklogo-543224.png',
  pokemontcg: 'https://images.seeklogo.com/logo-png/54/1/pokemon-tcg-pocket-logo-png_seeklogo-543224.png',
  pokemontcgpocket: 'https://images.seeklogo.com/logo-png/54/1/pokemon-tcg-pocket-logo-png_seeklogo-543224.png',
  pokemontradingcardgamepocket: 'https://images.seeklogo.com/logo-png/54/1/pokemon-tcg-pocket-logo-png_seeklogo-543224.png',
  leagueoflegends: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.png',
  lol: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.png',
  valorant: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.png',
  fortnite: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co294w.png',
  genshinimpact: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x77.png',
  honkaistarrail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co696l.png',
  zenlesszonezero: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co84b7.png',
  roblox: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co238c.png',
  worldofwarcraft: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tc2.png',
  overwatch2: 'https://steamcdn-a.akamaihd.net/steam/apps/2357570/library_600x900_2x.jpg',

  // Popular Scanned PC Games
  assettocorsa: 'https://steamcdn-a.akamaihd.net/steam/apps/244210/library_600x900_2x.jpg',
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
  hades: 'https://steamcdn-a.akamaihd.net/steam/apps/1145360/library_600x900_2x.jpg',
  hades2: 'https://steamcdn-a.akamaihd.net/steam/apps/1145350/library_600x900_2x.jpg',
  hollowknight: 'https://steamcdn-a.akamaihd.net/steam/apps/367520/library_600x900_2x.jpg',
  stardewvalley: 'https://steamcdn-a.akamaihd.net/steam/apps/413150/library_600x900_2x.jpg',
  terraria: 'https://steamcdn-a.akamaihd.net/steam/apps/105600/library_600x900_2x.jpg',
  reddeadredemption2: 'https://steamcdn-a.akamaihd.net/steam/apps/1174180/library_600x900_2x.jpg',
  rdr2: 'https://steamcdn-a.akamaihd.net/steam/apps/1174180/library_600x900_2x.jpg',
};

export function getKnownCoverUrl(title: string): string | null {
  if (!title) return null;
  const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  return KNOWN_GAME_COVERS[key] || null;
}

/**
 * Universal Dynamic Artwork Resolver
 * Searches local directory assets -> Curated catalog -> Dynamic Steam Store Search API
 */
export async function resolveGameCover(
  title: string,
  installDir?: string
): Promise<string | null> {
  if (!title) return null;

  const cacheKey = `${title.toLowerCase()}|${installDir || ''}`;
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey)!;
  }

  // 1. Check offline curated repository
  const known = getKnownCoverUrl(title);
  if (known) {
    coverCache.set(cacheKey, known);
    return known;
  }

  // 2. Query via Electron IPC (inspects local directory for cover.jpg & queries Steam Store API)
  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.searchGameArtwork) {
    try {
      const result = await electronAPI.searchGameArtwork(title, installDir);
      if (result && result.coverUrl) {
        coverCache.set(cacheKey, result.coverUrl);
        return result.coverUrl;
      }
    } catch (err) {
      console.warn(`Artwork search error for ${title}:`, err);
    }
  }

  // 3. Fallback: Direct Steam Store Search API (works universally in browser/electron)
  try {
    const cleanTitle = title
      .replace(/\s*\(.*?\)/g, '')
      .replace(/\s*\[.*?\]/g, '')
      .replace(/[_-]/g, ' ')
      .trim();

    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      cleanTitle
    )}&l=english&cc=US`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const coverUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${data.items[0].id}/library_600x900_2x.jpg`;
        coverCache.set(cacheKey, coverUrl);
        return coverUrl;
      }
    }
  } catch (err) {
    // ignore
  }

  return null;
}

/**
 * Returns alternative fallback URL if primary Steam 600x900 asset 404s
 */
export function getSecondaryCoverUrl(url: string): string | null {
  if (!url) return null;
  // If library_600x900_2x fails, fall back to Steam header.jpg or capsule
  const match = url.match(/steam\/apps\/(\d+)\/library_600x900_2x\.jpg/);
  if (match && match[1]) {
    return `https://steamcdn-a.akamaihd.net/steam/apps/${match[1]}/header.jpg`;
  }
  return null;
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
