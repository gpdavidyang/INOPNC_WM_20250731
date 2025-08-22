#!/bin/bash

# INOPNC Deployment Navigation Fix Script
# Purpose: Debug and fix navigation issues on Vercel deployment

echo "=========================================="
echo "INOPNC Navigation Deployment Fix"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking current deployment status...${NC}"
echo "----------------------------------------"

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}Warning: Not on main branch. Deployment typically happens from main.${NC}"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    git status --short
fi

echo ""
echo -e "${BLUE}Step 2: Service Worker Cache Issues${NC}"
echo "----------------------------------------"

# Update service worker version to force cache refresh
SW_FILE="public/sw.js"
if [ -f "$SW_FILE" ]; then
    echo "Current service worker cache versions:"
    grep "CACHE_NAME\|STATIC_CACHE\|API_CACHE" "$SW_FILE" | head -4
    
    echo ""
    echo -e "${GREEN}Updating service worker cache version...${NC}"
    
    # Generate new version based on timestamp
    NEW_VERSION="v1.2.$(date +%s)"
    
    # Update cache versions in service worker
    sed -i.bak "s/const CACHE_NAME = 'inopnc-wm-v[^']*'/const CACHE_NAME = 'inopnc-wm-$NEW_VERSION'/" "$SW_FILE"
    sed -i.bak "s/const STATIC_CACHE = 'inopnc-static-v[^']*'/const STATIC_CACHE = 'inopnc-static-$NEW_VERSION'/" "$SW_FILE"
    sed -i.bak "s/const API_CACHE = 'inopnc-api-v[^']*'/const API_CACHE = 'inopnc-api-$NEW_VERSION'/" "$SW_FILE"
    
    # Clean up backup files
    rm -f "$SW_FILE.bak"
    
    echo "Updated to version: $NEW_VERSION"
    grep "CACHE_NAME\|STATIC_CACHE\|API_CACHE" "$SW_FILE" | head -4
fi

echo ""
echo -e "${BLUE}Step 3: Clear Next.js build cache${NC}"
echo "----------------------------------------"

echo "Cleaning build artifacts..."
rm -rf .next
rm -rf .vercel
rm -rf node_modules/.cache
echo -e "${GREEN}Build cache cleared${NC}"

echo ""
echo -e "${BLUE}Step 4: Check environment variables${NC}"
echo "----------------------------------------"

if [ -f ".env.local" ]; then
    echo -e "${GREEN}.env.local exists${NC}"
    echo "Supabase URL configured: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2 | cut -c1-30)..."
else
    echo -e "${RED}Warning: .env.local not found${NC}"
fi

echo ""
echo -e "${BLUE}Step 5: Build test${NC}"
echo "----------------------------------------"

echo "Running production build..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Build successful!${NC}"
else
    echo -e "${RED}Build failed! Please fix build errors before deploying.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 6: Deployment instructions${NC}"
echo "----------------------------------------"

echo -e "${YELLOW}Manual steps to complete:${NC}"
echo ""
echo "1. Clear browser cache and cookies for the deployed site:"
echo "   - Open Chrome DevTools (F12)"
echo "   - Go to Application tab"
echo "   - Clear Storage -> Clear site data"
echo ""
echo "2. Unregister old service worker:"
echo "   - In DevTools -> Application -> Service Workers"
echo "   - Click 'Unregister' for all workers"
echo ""
echo "3. Commit and push the service worker update:"
echo "   git add public/sw.js"
echo "   git commit -m 'Update service worker cache version to force refresh'"
echo "   git push origin main"
echo ""
echo "4. Trigger new Vercel deployment:"
echo "   vercel --prod"
echo "   OR"
echo "   Push to main branch (auto-deploy)"
echo ""
echo "5. After deployment, test with:"
echo "   - Incognito/Private window"
echo "   - Different browser"
echo "   - Clear all site data first"
echo ""
echo -e "${GREEN}Fix script completed!${NC}"
echo ""
echo -e "${BLUE}Additional debugging commands:${NC}"
echo "----------------------------------------"
echo "# Check Vercel deployment logs:"
echo "vercel logs [deployment-url]"
echo ""
echo "# List recent deployments:"
echo "vercel list"
echo ""
echo "# Redeploy with clean cache:"
echo "vercel --force"
echo ""
echo "# Check production environment variables:"
echo "vercel env ls production"
echo ""
echo "=========================================="