Add-Type -AssemblyName System.Drawing

$clean = "g:\bakasur-food-tour-v3\public\images\food_tour\india_tour_illustration_clean.png"
$bmp = New-Object System.Drawing.Bitmap($clean)
$w = $bmp.Width
$h = $bmp.Height

Write-Host "Checking for any remaining non-navy pixels inside the map..."
$nonNavyInside = 0
for ($y = 10; $y -lt 210; $y++) {
    for ($x = 20; $x -lt 220; $x++) {
        $p = $bmp.GetPixel($x, $y)
        $isBg = ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240)
        $isNavy = ($p.B -gt 70 -and $p.R -lt 45 -and $p.G -lt 65)
        if (-not $isBg -and -not $isNavy) {
            $nonNavyInside++
        }
    }
}

Write-Host "Remaining non-navy/non-bg pixels inside map area: $nonNavyInside"

# Check Bakasur character at bottom-right (X > 200, Y > 170)
$bakasurPixels = 0
for ($y = 170; $y -lt $h; $y++) {
    for ($x = 200; $x -lt $w; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
            $bakasurPixels++
        }
    }
}
Write-Host "Bakasur character pixels preserved at bottom-right: $bakasurPixels"

$bmp.Dispose()
