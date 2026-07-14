#!/usr/bin/env bash
# =============================================================================
# KuppiHub – Developer Bootstrap Script
# =============================================================================
# Run this once after cloning to get everything ready for local development.
#
#   bash setup.sh
#
# Requirements:
#   - Node.js >= 20  (https://nodejs.org)
#   - npm >= 10
# =============================================================================

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

info()    { echo -e "${BOLD}[setup]${RESET} $*"; }
success() { echo -e "${GREEN}[✓]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[!]${RESET} $*"; }
error()   { echo -e "${RED}[✗]${RESET} $*"; }

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  KuppiHub  –  Local Developer Setup${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# ─── 1. Node.js version check ─────────────────────────────────────────────────
info "Checking Node.js..."
if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Please install Node.js >= 20 from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 20 ]; then
  error "Node.js >= 20 is required. Found: $(node -v). Please upgrade."
  exit 1
fi
success "Node.js $(node -v) detected"

# ─── 2. npm check ─────────────────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
  error "npm is not installed."
  exit 1
fi
success "npm $(npm -v) detected"

# ─── 3. .env setup ────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  info "Creating .env from env.example..."
  cp env.example .env
  success ".env created"
  echo ""
  warn "Open .env and fill in your credentials before running the app."
  warn "See README.md for where to get each key."
  echo ""
else
  success ".env already exists – skipping copy"
fi

# ─── 4. Install dependencies ──────────────────────────────────────────────────
info "Installing npm dependencies..."
npm install
success "Dependencies installed"

# ─── 5. Done ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  Setup complete!${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

if [ ! -s ".env" ] || grep -q "your-project-id" ".env" 2>/dev/null; then
  warn "Don't forget to fill in your .env credentials!"
  echo ""
fi

echo -e "  ${BOLD}Start the development server:${RESET}"
echo ""
echo -e "    ${BOLD}npm run dev${RESET}"
echo ""
echo -e "  Then open: ${BOLD}http://localhost:3000${RESET}"
echo ""
