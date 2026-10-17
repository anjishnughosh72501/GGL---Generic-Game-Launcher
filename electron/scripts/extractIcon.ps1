param(
    [Parameter(Mandatory=$true)]
    [string]$filePath,
    [Parameter(Mandatory=$false)]
    [string]$outputPath
)

$ErrorActionPreference = 'SilentlyContinue'

if (-not (Test-Path $filePath)) {
    exit 1
}

Add-Type -AssemblyName System.Drawing

$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($filePath)
if ($icon) {
    $bitmap = $icon.ToBitmap()
    if ($outputPath) {
        $parent = [System.IO.Path]::GetDirectoryName($outputPath)
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output "OK"
    } else {
        $ms = New-Object System.IO.MemoryStream
        $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $base64 = [Convert]::ToBase64String($bytes)
        Write-Output "data:image/png;base64,$base64"
    }
} else {
    exit 2
}
