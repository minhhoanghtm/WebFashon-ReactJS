#!/bin/bash
set -e
echo "=== Vercel Universal Install Script ==="
echo "Current directory: $(pwd)"

# If package.json is in current directory and we are inside frontend or front-end
if [ -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "front-end" ]; then
  echo "Executing install inside frontend directory..."
  npm install --legacy-peer-deps --no-audit --no-fund || npm install --no-audit --no-fund
elif [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Found frontend directory from root. Running npm --prefix frontend install..."
  npm --prefix frontend install --legacy-peer-deps --no-audit --no-fund || npm --prefix frontend install --no-audit --no-fund
elif [ -d "front-end" ] && [ -f "front-end/package.json" ]; then
  echo "Found front-end directory from root. Running npm --prefix front-end install..."
  npm --prefix front-end install --legacy-peer-deps --no-audit --no-fund || npm --prefix front-end install --no-audit --no-fund
elif [ -f "package.json" ]; then
  echo "Found root package.json. Running npm install..."
  npm install --legacy-peer-deps --no-audit --no-fund || npm install --no-audit --no-fund
else
  echo "No package.json found, completing install step safely."
fi

echo "=== Vercel Universal Install Finished Successfully ==="
