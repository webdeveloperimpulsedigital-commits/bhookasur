Add-Type -AssemblyName System.Drawing

$filePath = "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_map.png"
$bmp = New-Object System.Drawing.Bitmap($filePath)
$w = $bmp.Width
$h = $bmp.Height

Write-Host "Map Mockup: $w x $h"

# Scan vertical line
for ($y = 0; $y -lt $h; $y += 20) {
    $p = $bmp.GetPixel([int]($w/2), $y)
    Write-Host "Y=$y : R=$($p.R) G=$($p.G) B=$($p.B)"
}

$bmp.Dispose()
