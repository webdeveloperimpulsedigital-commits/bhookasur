Add-Type -AssemblyName System.Drawing

$filePath = "G:\bakasur-food-tour-v3\public\images\eating\bakasur_head_only_transparent.png"
$bmp = New-Object System.Drawing.Bitmap($filePath)

Write-Host "Image Size: $($bmp.Width) x $($bmp.Height)"

# Let's inspect the samosa and the mouth
# Find where the samosa is (golden/orange/yellowish brown pixels on the left of his mouth)
# Samosa color roughly: R: 180-240, G: 120-180, B: 50-100
# Teeth: high R, G, B (white)
# Inside mouth cavity: reddish/dark red (R: 120-200, G: 30-80, B: 30-80)

for ($y = 250; $y -lt 450; $y += 5) {
    $rowStr = ""
    for ($x = 0; $x -lt 150; $x += 4) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -lt 30) {
            $rowStr += "."
        } elseif ($c.R -gt 200 -and $c.G -gt 200 -and $c.B -gt 200) {
            $rowStr += "T" # teeth
        } elseif ($c.R -gt 130 -and $c.G -lt 90 -and $c.B -lt 90) {
            $rowStr += "M" # mouth cavity
        } elseif ($c.R -gt 150 -and $c.G -gt 90 -and $c.B -lt 80) {
            $rowStr += "S" # samosa
        } else {
            $rowStr += "#"
        }
    }
    Write-Host ("Y={0:D3}: {1}" -f $y, $rowStr)
}

$bmp.Dispose()
