Add-Type -AssemblyName System.Drawing

$src = "g:\bakasur-food-tour-v3\public\images\food_tour\india_tour_illustration.png"
$bmp = New-Object System.Drawing.Bitmap($src)
$w = $bmp.Width
$h = $bmp.Height

# Detect non-background, non-map pixels in the map region (X: 30..220, Y: 10..220)
# A pixel is "clean map" if (B > 70 and R < 45 and G < 60)
# A pixel is "card background" if (R > 240 and G > 240 and B > 240)
# Everything else in that region is a pin/label/food graphic!

$cleanBmp = New-Object System.Drawing.Bitmap($bmp)

$replacedCount = 0
for ($y = 0; $y -lt 210; $y++) {
    for ($x = 0; $x -lt 220; $x++) {
        $p = $bmp.GetPixel($x, $y)
        
        # Check if it's the light card background
        $isBg = ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240)
        
        # Check if it's already deep navy map
        $isNavy = ($p.B -gt 70 -and $p.R -lt 45 -and $p.G -lt 65)
        
        # If it's neither bg nor navy, it's a baked pin/label/icon!
        if (-not $isBg -and -not $isNavy) {
            # Check if this pixel is inside the India map body (i.e. surrounded by or near navy map)
            $cleanBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(10, 24, 96))
            $replacedCount++
        }
    }
}

Write-Host "Replaced $replacedCount pin/label pixels with pure India navy color!"
$cleanBmp.Save("g:\bakasur-food-tour-v3\public\images\food_tour\india_tour_illustration_clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cleanBmp.Dispose()
$bmp.Dispose()
