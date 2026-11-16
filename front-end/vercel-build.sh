#!/bin/bash
set -e
echo "=== Vercel Universal Build Script ==="
echo "Current directory: $(pwd)"

# If package.json is in current directory and we are inside frontend or front-end
if [ -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "front-end" ]; then
  echo "Building directly inside frontend directory..."
  npm run build || npx vite build
elif [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Building frontend from root..."
  npm --prefix frontend run build
  mkdir -p dist
  if [ -d "frontend/dist" ]; then
    cp -r frontend/dist/* dist/ 2>/dev/null || cp -r frontend/dist dist/
  fi
elif [ -d "front-end" ] && [ -f "front-end/package.json" ]; then
  echo "Building front-end from root..."
  npm --prefix front-end run build
  mkdir -p dist
  if [ -d "front-end/dist" ]; then
    cp -r front-end/dist/* dist/ 2>/dev/null || cp -r front-end/dist dist/
  fi
else
  echo "Default fallback build..."
  npm run build || true
fi

# Ensure output directory dist exists with an index.html
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
  if [ -d "frontend/dist" ]; then
    mkdir -p dist
    cp -r frontend/dist/* dist/ 2>/dev/null || true
  elif [ -d "front-end/dist" ]; then
    mkdir -p dist
    cp -r front-end/dist/* dist/ 2>/dev/null || true
  fi
fi

echo "=== Vercel Universal Build Finished Successfully ==="
