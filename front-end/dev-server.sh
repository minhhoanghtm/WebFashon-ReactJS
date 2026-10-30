#!/bin/bash

echo "🚀 Starting WebFashion Frontend Dev Server..."
echo "=========================================="

# Set environment
export NODE_ENV=development
export VITE_API_URL=http://localhost:5000

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --legacy-peer-deps
fi

echo -e "${BLUE}Starting Vite dev server...${NC}"
npm run dev

echo -e "${GREEN}✓ Dev server ready!${NC}"
echo -e "📱 Preview: http://localhost:3000"
echo -e "Press Ctrl+C to stop the server"
