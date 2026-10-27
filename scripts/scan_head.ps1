Add-Type -AssemblyName System.Drawing

$filePath = "G:\bakasur-food-tour-v3\public\images\eating\bakasur_head_only_transparent.png"
$bmp = New-Object System.Drawing.Bitmap($filePath)
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"

# Find bounding box of non-transparent pixels
$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Non-transparent bounds: X=[$minX, $maxX], Y=[$minY, $maxY]"

# Let's inspect regions:
# 1. Top left (where ASUR E: might be: Y from 0 to 150, X from 0 to 150)
# 2. Left side around mouth (Y from 200 to 450, X from 0 to 150)

$bmp.Dispose()
