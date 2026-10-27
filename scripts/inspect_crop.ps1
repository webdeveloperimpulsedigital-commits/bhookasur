Add-Type -AssemblyName System.Drawing

function Find-Card-Bounds($filePath) {
    $bmp = New-Object System.Drawing.Bitmap($filePath)
    $w = $bmp.Width
    $h = $bmp.Height
    Write-Host "Image size: $w x $h"

    # Let's find top, bottom, left, right of the card.
    # The outer background is grayish (around rgb 40-70 or similar).
    # The card header is dark blue (around rgb(4, 17, 91)) or similar, and bottom is white (rgb(255,255,255)).
    
    # Check pixels along vertical centerline
    $cx = [int]($w / 2)
    Write-Host "Vertical scan at X = $cx"
    for ($y = 0; $y -lt $h; $y += 10) {
        $pixel = $bmp.GetPixel($cx, $y)
        Write-Host "Y=$y : R=$($pixel.R), G=$($pixel.G), B=$($pixel.B)"
    }
    
    $bmp.Dispose()
}

Write-Host "--- MOCKUP 1 ---"
Find-Card-Bounds "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_1.png"

Write-Host "--- MOCKUP 2 ---"
Find-Card-Bounds "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_2.png"
