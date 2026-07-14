# =============================================================================
# KuppiHub – Windows Developer Bootstrap Script (PowerShell)
# =============================================================================
# Run this once after cloning to get everything ready for local development.
#
#   powershell -ExecutionPolicy Bypass -File setup.ps1
#
# Requirements:
#   - Node.js >= 20  (https://nodejs.org)
#   - npm >= 10
# =============================================================================

$ErrorActionPreference = "Stop"

function Info    { param($msg) Write-Host "[setup] $msg" -ForegroundColor Cyan }
function Success { param($msg) Write-Host "[OK]    $msg" -ForegroundColor Green }
function Warn    { param($msg) Write-Host "[!]     $msg" -ForegroundColor Yellow }
function Fail    { param($msg) Write-Host "[X]     $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host "  KuppiHub  -  Local Developer Setup" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host ""

# ─── 1. Node.js version check ─────────────────────────────────────────────────
Info "Checking Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail "Node.js is not installed. Please install Node.js >= 20 from https://nodejs.org"
}

$nodeVersion = node -e "process.stdout.write(process.versions.node)"
$nodeMajor   = [int]($nodeVersion -split "\.")[0]

if ($nodeMajor -lt 20) {
    Fail "Node.js >= 20 is required. Found: v$nodeVersion. Please upgrade from https://nodejs.org"
}
Success "Node.js v$nodeVersion detected"

# ─── 2. npm check ─────────────────────────────────────────────────────────────
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Fail "npm is not installed."
}
$npmVersion = npm --version
Success "npm $npmVersion detected"

# ─── 3. .env setup ────────────────────────────────────────────────────────────
if (-not (Test-Path ".env")) {
    Info "Creating .env from env.example..."
    Copy-Item "env.example" ".env"
    Success ".env created"
    Write-Host ""
    Warn "Open .env and fill in your credentials before running the app."
    Warn "See README.md for where to get each key."
    Write-Host ""
} else {
    Success ".env already exists - skipping copy"
}

# ─── 4. Install dependencies ──────────────────────────────────────────────────
Info "Installing npm dependencies..."
npm install
Success "Dependencies installed"

# ─── 5. Done ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host ""
Write-Host "  Start the development server:" -ForegroundColor White
Write-Host ""
Write-Host "    npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Then open: http://localhost:3000" -ForegroundColor White
Write-Host ""
