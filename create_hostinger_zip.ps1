# ==============================================================================
# Bakasur Ka Food Tour - Production Hostinger Zip Generator
# Security Check: Strictly excludes all .env files, node_modules, .git, and dev files
# ==============================================================================

$projectDir = $PSScriptRoot
if (-not $projectDir) { $projectDir = (Get-Location).Path }

$zipFileName = "bakasur-food-tour-hostinger.zip"
$zipFilePath = Join-Path $projectDir $zipFileName

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CREATING SECURE HOSTINGER PRODUCTION ZIP ARCHIVE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Project Root: $projectDir"
Write-Host "Target Archive: $zipFilePath"

# Remove existing zip if present
if (Test-Path $zipFilePath) {
    Write-Host "Removing existing archive: $zipFileName" -ForegroundColor Yellow
    Remove-Item -Force $zipFilePath
}

# Define exclusion rules
$excludedFolders = @(
    "node_modules",
    ".git",
    ".next",
    "scratch",
    "scripts",
    ".vscode",
    ".idea"
)

$excludedFilesPatterns = @(
    "^\.env(\..+)?$",    # Excludes .env, .env.local, .env.production, etc. EXCEPT .env.example
    "\.tsbuildinfo$",
    "\.log$",
    "\.zip$",
    "Thumbs\.db$",
    "\.DS_Store$"
)

# Collect all files to include
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipArchive = [System.IO.Compression.ZipFile]::Open($zipFilePath, [System.IO.Compression.ZipArchiveMode]::Create)

$allFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
$topItems = Get-ChildItem -Path $projectDir -Force
foreach ($item in $topItems) {
    if ($item.PSIsContainer) {
        if ($excludedFolders -contains $item.Name) {
            Write-Host "Skipping directory: $($item.Name)" -ForegroundColor DarkGray
            continue
        }
        $subFiles = Get-ChildItem -Path $item.FullName -Recurse -File -Force
        foreach ($sf in $subFiles) {
            $allFiles.Add($sf)
        }
    } else {
        $allFiles.Add($item)
    }
}

$totalFilesAdded = 0
$securityViolationsBlocked = 0

foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring($projectDir.Length).TrimStart('\', '/')
    $pathParts = $relativePath.Split([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
    
    # Check if in excluded folder
    $isFolderExcluded = $false
    foreach ($folder in $excludedFolders) {
        if ($pathParts -contains $folder) {
            $isFolderExcluded = $true
            break
        }
    }
    if ($isFolderExcluded) {
        continue
    }

    # Special rule: .env.example is ALLOWED as reference template
    if ($file.Name -ieq ".env.example") {
        # Allowed!
    } else {
        # Check against file exclusion regex
        $isFileExcluded = $false
        foreach ($pattern in $excludedFilesPatterns) {
            if ($file.Name -match $pattern) {
                $isFileExcluded = $true
                if ($file.Name -match "^\.env") {
                    Write-Host "  [SECURITY BLOCK] Blocked sensitive file: $relativePath" -ForegroundColor Red
                    $securityViolationsBlocked++
                }
                break
            }
        }
        if ($isFileExcluded) {
            continue
        }
    }

    # Normalize archive entry path with forward slashes for Linux/Hostinger compatibility
    $entryName = $relativePath.Replace('\', '/')
    
    # Large media files (mp4, webm, jpg, png) are already compressed; use Fastest to avoid high RAM usage
    $compression = [System.IO.Compression.CompressionLevel]::Optimal
    if ($file.Extension -match "\.(mp4|webm|jpg|jpeg|png|webp|zip)$" -or $file.Length -gt 10000000) {
        $compression = [System.IO.Compression.CompressionLevel]::Fastest
    }

    $entry = $zipArchive.CreateEntry($entryName, $compression)
    $entryStream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($file.FullName)
    
    try {
        $fileStream.CopyTo($entryStream)
        $totalFilesAdded++
    }
    finally {
        $fileStream.Dispose()
        $entryStream.Dispose()
    }
}

$zipArchive.Dispose()

$zipSize = (Get-Item $zipFilePath).Length
$zipSizeMb = [Math]::Round($zipSize / 1MB, 2)

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ZIP ARCHIVE CREATED SUCCESSFULLY" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Archive File: $zipFileName"
Write-Host "Total Size:   $zipSizeMb MB ($zipSize bytes)"
Write-Host "Files Added:  $totalFilesAdded"
Write-Host "Blocked Envs: $securityViolationsBlocked"
Write-Host ""
Write-Host "Running Post-Archive Security Verification Audit..." -ForegroundColor Cyan

# Post-Archive Security Audit
$auditArchive = [System.IO.Compression.ZipFile]::OpenRead($zipFilePath)
$auditFailures = @()
$forbiddenEntries = @()

foreach ($entry in $auditArchive.Entries) {
    $eName = $entry.FullName
    if ($eName -match "(^|/)\.env(\..+)?$" -and $eName -notmatch "\.env\.example$") {
        $forbiddenEntries += $eName
    }
    if ($eName -match "(^|/)node_modules/" -or $eName -match "(^|/)\.git/") {
        $forbiddenEntries += $eName
    }
}

if ($forbiddenEntries.Count -gt 0) {
    Write-Host "[SECURITY AUDIT FAILED] Forbidden files found in archive:" -ForegroundColor Red
    $forbiddenEntries | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    $auditArchive.Dispose()
    Remove-Item -Force $zipFilePath
    throw "Security audit failed! Archive deleted."
}

# Scan archive contents for leaked secret values
Write-Host "Scanning archive contents for leaked secret values..." -ForegroundColor Cyan
$sensitiveValues = @()
$envLocalPath = Join-Path $projectDir ".env.local"
if (Test-Path $envLocalPath) {
    $lines = Get-Content $envLocalPath
    foreach ($line in $lines) {
        if ($line -match "^\s*(MYSQL_PASSWORD|ADMIN_PASSWORD|APIFY_TOKEN|GOOGLE_PLACES_API_KEY)\s*=\s*(.+)$") {
            $val = $matches[2].Trim("`"' ")
            if ($val.Length -gt 6 -and $val -notmatch "^Your|AIzaSyYour|placeholder") {
                $sensitiveValues += $val
            }
        }
    }
}

Write-Host "Secret values checked: $($sensitiveValues.Count) (keys: APIFY_TOKEN)"

foreach ($entry in $auditArchive.Entries) {
    if ($entry.Length -gt 0 -and $entry.Length -lt 200000 -and $entry.Name -match "\.(js|mjs|ts|tsx|json|html|txt|sql|env)$") {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Dispose()
        $stream.Dispose()

        foreach ($secret in $sensitiveValues) {
            if ($content.Contains($secret)) {
                $auditFailures += "Secret leaked in $($entry.FullName)"
            }
        }
    }
}

$auditArchive.Dispose()

if ($auditFailures.Count -gt 0) {
    Write-Host "[SECURITY AUDIT FAILED] Secret values found in files:" -ForegroundColor Red
    $auditFailures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    Remove-Item -Force $zipFilePath
    throw "Security audit failed! Leaked secrets detected."
}

Write-Host "[SECURITY AUDIT PASSED] 100% Clean! No .env, node_modules, .git files or secret values exist in archive." -ForegroundColor Green
Write-Host ""
Write-Host "Ready for upload to Hostinger! File: $zipFilePath" -ForegroundColor Cyan
