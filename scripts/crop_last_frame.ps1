Add-Type -AssemblyName System.Drawing

$srcPath = "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_last_frame.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)
$w = $bmp.Width
$h = $bmp.Height

Write-Host "Source image size: $w x $h"

# Find Card Left and Right: outside card is dark grey background (R < 80, G < 80, B < 80)
# Inside card top is dark blue (R < 30, B > 90)
$left = 0
for ($x = 0; $x -lt [int]($w/2); $x++) {
    $p = $bmp.GetPixel($x, [int]($h/4))
    if ($p.B -gt 80 -and $p.R -lt 40) {
        $left = $x
        break
    }
}

$right = $w - 1
for ($x = $w - 1; $x -gt [int]($w/2); $x--) {
    $p = $bmp.GetPixel($x, [int]($h/4))
    if ($p.B -gt 80 -and $p.R -lt 40) {
        $right = $x
        break
    }
}

# Find Top
$top = 0
for ($y = 0; $y -lt [int]($h/4); $y++) {
    $p = $bmp.GetPixel([int]($w/2), $y)
    if ($p.B -gt 80 -and $p.R -lt 40) {
        $top = $y
        break
    }
}

# Find Bottom: inside card at bottom is white (R>240, G>240, B>240)
# Outside is dark grey
$bottom = $h - 1
for ($y = $h - 1; $y -gt [int]($h/2); $y--) {
    $p = $bmp.GetPixel([int]($w/2), $y)
    if ($p.R -gt 230 -and $p.G -gt 230 -and $p.B -gt 230) {
        $bottom = $y
        break
    }
}

# Find the boundary between blue top and white bottom
$dividerY = 0
for ($y = [int]($h * 0.4); $y -lt [int]($h * 0.7); $y++) {
    $p = $bmp.GetPixel([int]($w/2), $y)
    if ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240) {
        $dividerY = $y
        break
    }
}

Write-Host "Card bounds: Left=$left, Right=$right, Top=$top, Bottom=$bottom, DividerY=$dividerY"

$cardW = $right - $left + 1
$cardH = $bottom - $top + 1
$topH = $dividerY - $top

# Crop Top Half (Character Illustration on Blue)
$topBmp = New-Object System.Drawing.Bitmap($cardW, $topH)
$gTop = [System.Drawing.Graphics]::FromImage($topBmp)
$gTop.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRectTop = New-Object System.Drawing.Rectangle($left, $top, $cardW, $topH)
$destRectTop = New-Object System.Drawing.Rectangle(0, 0, $cardW, $topH)
$gTop.DrawImage($bmp, $destRectTop, $srcRectTop, [System.Drawing.GraphicsUnit]::Pixel)
$topBmp.Save("G:\bakasur-food-tour-v3\public\images\food_tour\bakasur_phone_pass.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gTop.Dispose()
$topBmp.Dispose()

Write-Host "Saved bakasur_phone_pass.png successfully!"

# Also crop full card
$fullBmp = New-Object System.Drawing.Bitmap($cardW, $cardH)
$gFull = [System.Drawing.Graphics]::FromImage($fullBmp)
$gFull.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRectFull = New-Object System.Drawing.Rectangle($left, $top, $cardW, $cardH)
$destRectFull = New-Object System.Drawing.Rectangle(0, 0, $cardW, $cardH)
$gFull.DrawImage($bmp, $destRectFull, $srcRectFull, [System.Drawing.GraphicsUnit]::Pixel)
$fullBmp.Save("G:\bakasur-food-tour-v3\public\images\food_tour\last_frame_card.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gFull.Dispose()
$fullBmp.Dispose()

Write-Host "Saved last_frame_card.png successfully!"

$bmp.Dispose()
