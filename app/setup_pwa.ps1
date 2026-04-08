Add-Type -AssemblyName System.Drawing

$sourceIcon = "C:\Users\chava\.gemini\antigravity\brain\8e075c65-729e-40d1-a01d-14aa6d9da9c0\stellix_app_icon_1775574994236.png"
$iconsDir = "d:\stellix-1 Android\app\public\icons"

if (-not (Test-Path $iconsDir)) { New-Item -ItemType Directory -Path $iconsDir -Force }

$sizes = @(192, 512)
$original = [System.Drawing.Image]::FromFile($sourceIcon)

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.DrawImage($original, 0, 0, $size, $size)
    
    $outPath = Join-Path $iconsDir "icon-${size}x${size}.png"
    $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created $outPath"
    
    $graphics.Dispose()
    $bitmap.Dispose()
}

$original.Dispose()
Write-Host "`nPWA Icons generated!"
