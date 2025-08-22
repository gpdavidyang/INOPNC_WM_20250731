#!/bin/bash

# Quick Deployment Navigation Fix
# Focused on immediate solution for navigation issues

echo "=========================================="
echo "Quick Navigation Fix for Deployment"
echo "=========================================="
echo ""

# Update service worker to force cache refresh
echo "1. Updating Service Worker cache version..."
TIMESTAMP=$(date +%s)
NEW_VERSION="v1.3.$TIMESTAMP"

sed -i.bak "s/const CACHE_NAME = 'inopnc-wm-v[^']*'/const CACHE_NAME = 'inopnc-wm-$NEW_VERSION'/" public/sw.js
sed -i.bak "s/const STATIC_CACHE = 'inopnc-static-v[^']*'/const STATIC_CACHE = 'inopnc-static-$NEW_VERSION'/" public/sw.js
sed -i.bak "s/const API_CACHE = 'inopnc-api-v[^']*'/const API_CACHE = 'inopnc-api-$NEW_VERSION'/" public/sw.js
sed -i.bak "s/const IMAGES_CACHE = 'inopnc-images-v[^']*'/const IMAGES_CACHE = 'inopnc-images-$NEW_VERSION'/" public/sw.js

rm -f public/sw.js.bak

echo "   ✅ Service Worker updated to version: $NEW_VERSION"

echo ""
echo "2. Committing changes..."
git add public/sw.js
git commit -m "Force service worker cache refresh - Fix navigation issues v$NEW_VERSION"

echo ""
echo "3. Pushing to main branch..."
git push origin main

echo ""
echo "=========================================="
echo "✅ Fix Applied Successfully!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Wait 2-3 minutes for Vercel to deploy"
echo "2. Clear your browser cache completely:"
echo "   - Open Chrome DevTools (F12)"
echo "   - Application tab → Storage → Clear site data"
echo "   - Service Workers → Unregister all"
echo ""
echo "3. Test in a new incognito window"
echo ""
echo "4. If still having issues, try:"
echo "   - Different browser"
echo "   - Mobile device"
echo "   - Clear DNS cache: chrome://net-internals/#dns"
echo ""
echo "=========================================="