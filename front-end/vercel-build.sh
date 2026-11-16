#!/usr/bin/env bash
set -e

echo "=== VERCEL BUILD ==="
echo "Working directory: $(pwd)"

if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Building new frontend directory..."
  cd frontend
  npm run build
  cd ..
  rm -rf dist
  cp -r frontend/dist dist
  echo "Build complete. Mirrored frontend/dist to root dist."
elif [ -d "front-end" ] && [ -f "front-end/package.json" ]; then
  echo "Building legacy front-end directory..."
  cd front-end
  npm run build
  cd ..
  rm -rf dist
  cp -r front-end/dist dist
  echo "Build complete. Mirrored front-end/dist to root dist."
elif [ -f "package.json" ]; then
  echo "Building current directory..."
  npm run build
  if [ -d "dist" ]; then
    mkdir -p frontend front-end
    cp -r dist frontend/dist 2>/dev/null || true
    cp -r dist front-end/dist 2>/dev/null || true
  fi
  echo "Build complete."
else
  echo "Error: No buildable frontend found!"
  exit 1
fi
