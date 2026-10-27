Add-Type -AssemblyName System.Drawing

function Crop-And-Save($srcPath, $x, $y, $w, $h, $destPath) {
    $srcBmp = New-Object System.Drawing.Bitmap($srcPath)
    $destBmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    $srcRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    
    $g.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $destBmp.Dispose()
    $srcBmp.Dispose()
    Write-Host "Saved: $destPath ($w x $h)"
}

# 1. Mockup 1 (Gastrium In)
# Full card: Left=16, Top=5, W=309, H=547
Crop-And-Save "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_1.png" 16 5 309 547 "G:\bakasur-food-tour-v3\public\images\food_tour\gastrium_in_card.png"

# Photo only: Left=16, Top=5, W=309, H=407
Crop-And-Save "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_1.png" 16 5 309 407 "G:\bakasur-food-tour-v3\public\images\food_tour\gastrium_in_photo.png"

# 2. Mockup 2 (Shukriya Dost / Map par dekho)
# Full card: Left=46, Top=26, W=309, H=547
Crop-And-Save "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_2.png" 46 26 309 547 "G:\bakasur-food-tour-v3\public\images\food_tour\shukriya_map_card.png"

# Photo only: Left=46, Top=26, W=309, H=330
Crop-And-Save "G:\bakasur-food-tour-v3\public\images\food_tour\user_mockup_2.png" 46 26 309 330 "G:\bakasur-food-tour-v3\public\images\food_tour\shukriya_map_photo.png"
