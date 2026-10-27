Add-Type -AssemblyName System.Drawing

$srcPath = "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_map.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)
$w = $bmp.Width
$h = $bmp.Height

# Find Top: card header is navy blue (R < 30, B > 60)
$top = 0
for ($y = 0; $y -lt 50; $y++) {
    $p = $bmp.GetPixel([int]($w/2), $y)
    if ($p.B -gt 60 -and $p.R -lt 30) {
        $top = $y
        break
    }
}

# Find Bottom: inside is white (R>240, G>240, B>240)
$bottom = $h - 1
for ($y = $h - 1; $y -gt [int]($h*3/4); $y--) {
    $p = $bmp.GetPixel([int]($w/2), $y)
    if ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240) {
        $bottom = $y
        break
    }
}

# Find Left and Right
$left = 0
for ($x = 0; $x -lt [int]($w/2); $x++) {
    $p = $bmp.GetPixel($x, $top + 10)
    if ($p.B -gt 60 -and $p.R -lt 30) {
        $left = $x
        break
    }
}

$right = $w - 1
for ($x = $w - 1; $x -gt [int]($w/2); $x--) {
    $p = $bmp.GetPixel($x, $top + 10)
    if ($p.B -gt 60 -and $p.R -lt 30) {
        $right = $x
        break
    }
}

Write-Host "Map Card Bounds: Left=$left, Top=$top, Right=$right, Bottom=$bottom, Width=$($right - $left + 1), Height=$($bottom - $top + 1)"

# Crop full card
$cw = $right - $left + 1
$ch = $bottom - $top + 1

$destBmp = New-Object System.Drawing.Bitmap($cw, $ch)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRect = New-Object System.Drawing.Rectangle($left, $top, $cw, $ch)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $cw, $ch)
$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$destBmp.Save("G:\bakasur-food-tour-v3\public\images\food_tour\map_frame_card.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$destBmp.Dispose()

# Also crop just the India map section (around Y=115 to Y=370)
$mapTop = 115
$mapHeight = 255
$mapDest = New-Object System.Drawing.Bitmap($cw, $mapHeight)
$g2 = [System.Drawing.Graphics]::FromImage($mapDest)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRect2 = New-Object System.Drawing.Rectangle($left, $mapTop, $cw, $mapHeight)
$destRect2 = New-Object System.Drawing.Rectangle(0, 0, $cw, $mapHeight)
$g2.DrawImage($bmp, $destRect2, $srcRect2, [System.Drawing.GraphicsUnit]::Pixel)
$mapDest.Save("G:\bakasur-food-tour-v3\public\images\food_tour\india_tour_illustration.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose()
$mapDest.Dispose()

$bmp.Dispose()
Write-Host "Cropped map_frame_card.png and india_tour_illustration.png successfully!"
