import { describe, it, expect } from 'vitest';
import { parseVDF, extractLibraryFolders } from '../parsers/vdfParser';
import { parseSteamACF, steamManifestToGameItem } from '../parsers/acfParser';

describe('VDF Parser', () => {
  const sampleLibraryFoldersVdf = `
"libraryfolders"
{
	"0"
	{
		"path"		"C:\\\\Program Files (x86)\\\\Steam"
		"label"		""
		"contentid"		"8473957283"
		"total_size"		"0"
		"update_clean_bytes_tally"		"0"
		"time_last_update_corruption"		"0"
		"apps"
		{
			"228980"		"12839218"
			"1091500"		"738291038"
		}
	}
	"1"
	{
		"path"		"D:\\\\Games\\\\SteamLibrary"
		"label"		"FastSSD"
		"apps"
		{
			"730"		"394829"
		}
	}
}
  `;

  const legacyLibraryFoldersVdf = `
"LibraryFolders"
{
	"TimeNextStatsReport"		"12345678"
	"ContentStatsID"		"98765432"
	"1"		"D:\\\\SteamLibrary"
	"2"		"E:\\\\SteamStorage"
}
  `;

  it('correctly parses modern nested libraryfolders.vdf and extracts library paths', () => {
    const parsed = parseVDF(sampleLibraryFoldersVdf);
    expect(parsed).toBeDefined();
    expect(parsed['libraryfolders']).toBeDefined();

    const libraries = extractLibraryFolders(parsed);
    expect(libraries).toHaveLength(2);
    expect(libraries[0]).toBe('C:\\Program Files (x86)\\Steam');
    expect(libraries[1]).toBe('D:\\Games\\SteamLibrary');
  });

  it('correctly parses legacy numbered libraryfolders.vdf format', () => {
    const parsed = parseVDF(legacyLibraryFoldersVdf);
    const libraries = extractLibraryFolders(parsed);
    expect(libraries).toContain('D:\\SteamLibrary');
    expect(libraries).toContain('E:\\SteamStorage');
  });

  it('handles comments, empty strings, and escaped characters', () => {
    const vdfWithComments = `
      // This is a comment at top
      "Root"
      {
        "KeyWithSlash" "C:\\\\My\\\\Path" // inline comment
        "EmptyKey" ""
      }
    `;
    const parsed = parseVDF(vdfWithComments);
    const root = parsed['Root'] as Record<string, string>;
    expect(root['KeyWithSlash']).toBe('C:\\My\\Path');
    expect(root['EmptyKey']).toBe('');
  });
});

describe('Steam ACF Manifest Parser', () => {
  const sampleAcf = `
"AppState"
{
	"appid"		"1091500"
	"Universe"		"1"
	"name"		"Cyberpunk 2077"
	"StateFlags"		"4"
	"installdir"		"Cyberpunk 2077"
	"LastUpdated"		"1696200000"
	"SizeOnDisk"		"738291038"
	"buildid"		"123456"
	"LastOwner"		"76561198000000000"
	"BytesToDownload"		"0"
	"BytesDownloaded"		"0"
	"AutoUpdateBehavior"		"0"
	"AllowOtherDownloadsWhileRunning"		"0"
	"ScheduledAutoUpdate"		"0"
	"InstalledDepots"
	{
		"1091501"
		{
			"manifest"		"849204820"
			"size"		"738291038"
		}
	}
	"UserConfig"
	{
		"language"		"english"
	}
}
  `;

  it('parses appmanifest properly into SteamAppManifest object', () => {
    const manifest = parseSteamACF(sampleAcf);
    expect(manifest).not.toBeNull();
    expect(manifest?.appid).toBe('1091500');
    expect(manifest?.name).toBe('Cyberpunk 2077');
    expect(manifest?.installdir).toBe('Cyberpunk 2077');
    expect(manifest?.sizeOnDisk).toBe(738291038);
  });

  it('converts SteamAppManifest to a standardized GameItem', () => {
    const manifest = parseSteamACF(sampleAcf)!;
    const game = steamManifestToGameItem(manifest, 'C:/Steam');
    expect(game.id).toBe('steam-1091500');
    expect(game.title).toBe('Cyberpunk 2077');
    expect(game.category).toBe('game');
    expect(game.platform).toBe('steam');
    expect(game.launchUrl).toBe('steam://run/1091500');
    expect(game.coverUrl).toBe(
      'https://steamcdn-a.akamaihd.net/steam/apps/1091500/library_600x900_2x.jpg'
    );
    expect(game.installDir).toBe('C:/Steam/steamapps/common/Cyberpunk 2077');
    expect(game.isCustom).toBe(false);
  });
});
