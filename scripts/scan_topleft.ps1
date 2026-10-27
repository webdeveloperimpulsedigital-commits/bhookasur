Add-Type -AssemblyName System.Drawing

$filePath = "G:\bakasur-food-tour-v3\public\images\eating\bakasur_head_only_transparent.png"
$bmp = New-Object System.Drawing.Bitmap($filePath)

for ($y = 0; $y -lt 160; $y += 8) {
    $rowStr = ""
    for ($x = 0; $x -lt 160; $x += 4) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -lt 30) {
            $rowStr += "."
        } else {
            $rowStr += "X"
        }
    }
    Write-Host ("Y={0:D3}: {1}" -f $y, $rowStr)
}

$bmp.Dispose()
