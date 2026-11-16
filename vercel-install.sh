#!/usr/bin/env bash
set -e

echo "=== VERCEL INSTALL ==="
echo "Working directory: $(pwd)"

if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Targeting new frontend directory..."
  cd frontend
  npm install --no-audit --no-fund
elif [ -d "front-end" ] && [ -f "front-end/package.json" ]; then
  echo "Targeting legacy front-end directory..."
  cd front-end
  npm install --legacy-peer-deps --no-audit --no-fund
elif [ -f "package.json" ]; then
  echo "Targeting current directory..."
  npm install --legacy-peer-deps --no-audit --no-fund
else
  echo "No package.json found, skipping install."
fi
