param()

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'SilentlyContinue'

$apps = [System.Collections.Generic.List[PSCustomObject]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$wscript = New-Object -ComObject WScript.Shell

function Add-AppEntry($name, $targetPath, $launchArgs, $installDir, $iconPath, $category, $source) {
    if (-not $name -or -not $targetPath) { return }
    $key = "$name|$targetPath|$launchArgs".ToLower()
    if ($seen.Contains($key)) { return }
    $seen.Add($key) | Out-Null

    $apps.Add([PSCustomObject]@{
        name = $name
        targetPath = $targetPath
        launchArgs = if ($launchArgs) { $launchArgs } else { "" }
        installDir = if ($installDir) { $installDir } else { [System.IO.Path]::GetDirectoryName($targetPath) }
        iconPath = if ($iconPath) { $iconPath } else { $targetPath }
        category = $category
        source = $source
    })
}

# 1. Desktop and Start Menu Shortcuts (.lnk)
$shortcutFolders = @(
    "$env:USERPROFILE\Desktop",
    "$env:PUBLIC\Desktop",
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs",
    "$env:ProgramData\Microsoft\Windows\Start Menu\Programs",
    "$env:APPDATA\Microsoft\Windows\Start Menu",
    "$env:ProgramData\Microsoft\Windows\Start Menu"
)

foreach ($folder in $shortcutFolders) {
    if (Test-Path $folder) {
        $files = Get-ChildItem -Path $folder -Filter *.lnk -Recurse -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            try {
                $shortcut = $wscript.CreateShortcut($file.FullName)
                $target = $shortcut.TargetPath
                if ($target -and ($target.EndsWith(".exe", [System.StringComparison]::OrdinalIgnoreCase) -or $target.EndsWith(".bat", [System.StringComparison]::OrdinalIgnoreCase))) {
                    if (Test-Path $target) {
                        $name = $file.BaseName
                        if ($name -match 'uninstall|readme|manual|help\b|website\b|configure\b' -or $target -match 'uninstall') {
                            continue
                        }

                        $cleanIcon = $target
                        if ($shortcut.IconLocation) {
                            $icoCandidate = $shortcut.IconLocation.Split(',')[0].Trim('"')
                            if ($icoCandidate -and (Test-Path $icoCandidate)) {
                                $cleanIcon = $icoCandidate
                            }
                        }

                        $isGame = ($name -match 'game|pok[eé]mon|tcg|craft|strike|valorant|genshin|honkai|roblox') -or 
                                  ($shortcut.Arguments -match 'launchApp|package|game')

                        $source = if ($folder -match 'Desktop') { "desktop" } else { "startmenu" }
                        if ($target -match 'BlueStacks') { $source = "bluestacks" }

                        Add-AppEntry $name $target $shortcut.Arguments ($shortcut.WorkingDirectory) $cleanIcon (if ($isGame) { "game" } else { "app" }) $source
                    }
                }
            } catch {
                # Skip broken shortcut
            }
        }
    }
}

# 2. BlueStacks Dedicated Game Scanner
# Scans BlueStacks engine AppCache for installed Android games (.ico packages)
$blueStacksDirs = @(
    "C:\Program Files\BlueStacks_nxt",
    "C:\Program Files (x86)\BlueStacks_nxt"
)

$hdPlayerExe = $null
foreach ($bDir in $blueStacksDirs) {
    $cand = Join-Path $bDir "HD-Player.exe"
    if (Test-Path $cand) {
        $hdPlayerExe = $cand
        break
    }
}

if ($hdPlayerExe) {
    $engineCacheDirs = @(
        "C:\ProgramData\BlueStacks_nxt\Engine"
    )
    foreach ($eDir in $engineCacheDirs) {
        if (Test-Path $eDir) {
            $icoFiles = Get-ChildItem -Path $eDir -Filter *.ico -Recurse -ErrorAction SilentlyContinue
            foreach ($ico in $icoFiles) {
                # e.g. jp.pokemon.pokemontcgp.ico
                $pkg = $ico.BaseName
                if ($pkg -and -not $pkg.StartsWith("ProductLogo") -and -not $pkg.StartsWith("BlueStacks")) {
                    $gameTitle = $pkg
                    if ($pkg -match 'pokemontcgp') { $gameTitle = "Pokémon TCGP" }
                    elseif ($pkg -match 'kioku') { $gameTitle = "Kioku" }
                    else {
                        # Format package to readable title (last segment)
                        $parts = $pkg.Split('.')
                        $gameTitle = $parts[-1].Substring(0, 1).ToUpper() + $parts[-1].Substring(1)
                    }

                    $instanceName = $ico.Directory.Parent.Name
                    if (-not $instanceName -or $instanceName -eq 'Engine') { $instanceName = "Pie64" }

                    $args = "--instance $instanceName --cmd launchApp --package `"$pkg`""
                    Add-AppEntry $gameTitle $hdPlayerExe $args (Split-Path $hdPlayerExe) $ico.FullName "game" "bluestacks"
                }
            }
        }
    }
}

# 3. Registry Uninstall Records
$regKeys = @(
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
)

foreach ($key in $regKeys) {
    $entries = Get-ItemProperty -Path $key -ErrorAction SilentlyContinue
    foreach ($entry in $entries) {
        if ($entry.DisplayName -and -not $entry.SystemComponent -and -not $entry.ParentKeyName) {
            $name = $entry.DisplayName.Trim()
            $installLocation = $entry.InstallLocation
            $displayIcon = $entry.DisplayIcon

            if ($displayIcon) {
                $iconCandidate = $displayIcon.Split(',')[0].Trim('"')
                if ($iconCandidate.EndsWith('.exe', [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $iconCandidate)) {
                    Add-AppEntry $name $iconCandidate "" $installLocation $iconCandidate "app" "registry"
                }
            }
        }
    }
}

$apps | ConvertTo-Json -Depth 3 -Compress
