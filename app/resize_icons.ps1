Add-Type -AssemblyName System.Drawing

$sourceIcon = "C:\Users\chava\.gemini\antigravity\brain\8e075c65-729e-40d1-a01d-14aa6d9da9c0\stellix_app_icon_1775574994236.png"
$resDir = "d:\stellix-1 Android\app\android\app\src\main\res"

# Mipmap sizes for ic_launcher (standard icon)
$launcherSizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

# Foreground sizes for adaptive icons
$foregroundSizes = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}

$original = [System.Drawing.Image]::FromFile($sourceIcon)

foreach ($entry in $launcherSizes.GetEnumerator()) {
    $dir = Join-Path $resDir $entry.Key
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    
    $size = $entry.Value
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.DrawImage($original, 0, 0, $size, $size)
    
    $outPath = Join-Path $dir "ic_launcher.png"
    $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created $outPath ($size x $size)"
    
    # Also save as round icon
    $roundPath = Join-Path $dir "ic_launcher_round.png"
    $bitmap.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created $roundPath ($size x $size)"
    
    $graphics.Dispose()
    $bitmap.Dispose()
}

foreach ($entry in $foregroundSizes.GetEnumerator()) {
    $dir = Join-Path $resDir $entry.Key
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    
    $size = $entry.Value
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    # Center the icon with padding for adaptive icon safe zone (66.67% of total)
    $iconSize = [int]($size * 0.667)
    $offset = [int](($size - $iconSize) / 2)
    $graphics.Clear([System.Drawing.Color]::FromArgb(10, 14, 26))  # Dark background #0A0E1A
    $graphics.DrawImage($original, $offset, $offset, $iconSize, $iconSize)
    
    $outPath = Join-Path $dir "ic_launcher_foreground.png"
    $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created $outPath ($size x $size)"
    
    $graphics.Dispose()
    $bitmap.Dispose()
}

$original.Dispose()
Write-Host "`nAll icons generated successfully!"
