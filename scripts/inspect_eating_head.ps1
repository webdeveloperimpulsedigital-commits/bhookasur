Add-Type -AssemblyName System.Drawing

$filePath = "G:\bakasur-food-tour-v3\public\images\eating\bakasur_head_only_transparent.png"
$bmp = New-Object System.Drawing.Bitmap($filePath)
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"
$bmp.Dispose()
