Write-Host "🔐 Setting up locally trusted SSL certificate with mkcert..." -ForegroundColor Cyan

$mkcertCmd = Get-Command mkcert -ErrorAction SilentlyContinue
if (-not $mkcertCmd) {
    Write-Host "❌ mkcert is not installed." -ForegroundColor Red
    $response = Read-Host "Would you like to download and install mkcert automatically? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        try {
            $releaseUrl = "https://api.github.com/repos/FiloSottile/mkcert/releases/latest"
            $release = Invoke-RestMethod -Uri $releaseUrl -UseBasicParsing
            $asset = $release.assets | Where-Object { $_.name -like "*windows-amd64.exe" } | Select-Object -First 1
            if (-not $asset) {
                Write-Host "❌ Could not find Windows binary. Please download manually:" -ForegroundColor Red
                Write-Host "   https://github.com/FiloSottile/mkcert/releases/latest" -ForegroundColor Cyan
                exit 1
            }
            $tempDir = Join-Path $env:TEMP "mkcert"
            if (-not (Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir | Out-Null }
            $mkcertPath = Join-Path $tempDir "mkcert.exe"
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $mkcertPath -UseBasicParsing
            $localBin = Join-Path $env:USERPROFILE "bin"
            if (-not (Test-Path $localBin)) { New-Item -ItemType Directory -Path $localBin | Out-Null }
            Copy-Item $mkcertPath (Join-Path $localBin "mkcert.exe") -Force
            $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
            if ($userPath -notlike "*$localBin*") {
                [Environment]::SetEnvironmentVariable("Path", "$userPath;$localBin", "User")
            }
            Write-Host "✅ mkcert installed at $localBin\mkcert.exe" -ForegroundColor Green
            Write-Host "Please restart your terminal session and run this script again." -ForegroundColor Yellow
            exit 0
        } catch {
            Write-Host "❌ Failed to install mkcert: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Please install mkcert manually: https://github.com/FiloSottile/mkcert/releases/latest" -ForegroundColor Yellow
        exit 1
    }
}

$sslDir = Join-Path $PSScriptRoot ".." "ssl"
if (-not (Test-Path $sslDir)) { New-Item -ItemType Directory -Path $sslDir | Out-Null }
Push-Location $sslDir

Write-Host "Step 1: Installing local CA (requires admin privileges)..." -ForegroundColor Yellow
mkcert -install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install local CA. Run PowerShell as Administrator." -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Step 2: Generating trusted certificate for localhost..." -ForegroundColor Yellow
mkcert localhost 127.0.0.1 ::1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully generated locally trusted SSL certificate!" -ForegroundColor Green
    Write-Host "Files created:" -ForegroundColor Cyan
    Write-Host "  - localhost+2.pem (certificate)" -ForegroundColor Gray
    Write-Host "  - localhost+2-key.pem (private key)" -ForegroundColor Gray
    Write-Host "🚀 Restart your dev server. Browser warnings should be gone!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate certificate." -ForegroundColor Red
}

Pop-Location