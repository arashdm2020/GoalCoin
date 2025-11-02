# PowerShell script to download and install mkcert on Windows
# This script downloads mkcert from GitHub releases and adds it to PATH

Write-Host "🔐 Installing mkcert for Windows..." -ForegroundColor Cyan
Write-Host ""

# Check if mkcert is already installed
if (Get-Command mkcert -ErrorAction SilentlyContinue) {
    Write-Host "✅ mkcert is already installed!" -ForegroundColor Green
    mkcert -version
    exit 0
}

# Get the latest release from GitHub
$repo = "FiloSottile/mkcert"
Write-Host "📥 Fetching latest mkcert release from GitHub..." -ForegroundColor Yellow

try {
    $releaseUrl = "https://api.github.com/repos/$repo/releases/latest"
    $release = Invoke-RestMethod -Uri $releaseUrl -UseBasicParsing
} catch {
    Write-Host "❌ Failed to fetch release information. Please check your internet connection." -ForegroundColor Red
    exit 1
}

# Find the Windows amd64 binary
$asset = $release.assets | Where-Object { $_.name -like "*windows-amd64.exe" } | Select-Object -First 1

if (-not $asset) {
    Write-Host "❌ Could not find Windows binary in latest release." -ForegroundColor Red
    exit 1
}

Write-Host "Found version: $($release.tag_name)" -ForegroundColor Green
Write-Host "Downloading: $($asset.name)..." -ForegroundColor Yellow

# Download location (current directory or temp)
$downloadDir = Join-Path $env:TEMP "mkcert-install"
if (-not (Test-Path $downloadDir)) {
    New-Item -ItemType Directory -Path $downloadDir | Out-Null
}

$downloadPath = Join-Path $downloadDir "mkcert.exe"
$downloadUrl = $asset.browser_download_url

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "✅ Download complete!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download mkcert." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Determine installation location
# Option 1: User's local bin directory (recommended, no admin needed)
$localBinPath = Join-Path $env:USERPROFILE "bin"
if (-not (Test-Path $localBinPath)) {
    New-Item -ItemType Directory -Path $localBinPath | Out-Null
}

# Option 2: System PATH (requires admin)
$installPath = Join-Path $localBinPath "mkcert.exe"

# Copy to installation location
Copy-Item $downloadPath $installPath -Force
Write-Host "📦 Installed to: $installPath" -ForegroundColor Green

# Add to PATH if not already there
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$localBinPath*") {
    Write-Host ""
    Write-Host "🔧 Adding to PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$localBinPath", "User")
    Write-Host "✅ Added to user PATH. Please restart your terminal for changes to take effect." -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 After restarting terminal, run:" -ForegroundColor Cyan
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host "   .\scripts\setup-trusted-ssl.ps1" -ForegroundColor Gray
} else {
    Write-Host "✅ Already in PATH!" -ForegroundColor Green
}

# Clean up download
Remove-Item $downloadPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ mkcert installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Please restart your terminal/PowerShell window to use mkcert." -ForegroundColor Yellow
Write-Host "   Then run: .\scripts\setup-trusted-ssl.ps1" -ForegroundColor Cyan

