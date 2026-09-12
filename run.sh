#!/usr/bin/env bash
# Song4Her 🦋 — 1-Click Runner for Android Termux / Linux / macOS
set -e
cd "$(dirname "$0")"

echo ""
echo "=============================================================="
echo "  🦋 SONG4HER — Private Personalized Song Delivery Platform"
echo "=============================================================="
echo ""
echo "Launching services..."
echo ""

npm run song4her
