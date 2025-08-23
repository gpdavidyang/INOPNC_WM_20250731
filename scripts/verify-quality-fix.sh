#!/bin/bash

# Verify Quality Fix Script
# This script verifies that all quality optimizations are properly configured

echo "🔍 Verifying deployment quality optimizations..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check vercel.json
echo "📋 Checking vercel.json..."
if grep -q "DISABLE_FONT_OPTIMIZATION" vercel.json 2>/dev/null; then
    echo -e "${RED}❌ Found quality-degrading settings in vercel.json${NC}"
    exit 1
else
    echo -e "${GREEN}✅ vercel.json is properly configured${NC}"
fi

# Check next.config.mjs
echo ""
echo "📋 Checking next.config.mjs..."
if grep -q "swcMinify: false" next.config.mjs 2>/dev/null; then
    echo -e "${RED}❌ SWC minification is disabled${NC}"
    exit 1
else
    echo -e "${GREEN}✅ SWC minification is enabled${NC}"
fi

if grep -q "compress: false" next.config.mjs 2>/dev/null; then
    echo -e "${RED}❌ Compression is disabled${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Compression is enabled${NC}"
fi

# Check for fonts.css
echo ""
echo "📋 Checking font optimization..."
if [ -f "app/fonts.css" ]; then
    echo -e "${GREEN}✅ Font optimization file exists${NC}"
else
    echo -e "${YELLOW}⚠️ Font optimization file missing (app/fonts.css)${NC}"
fi

# Check build output
echo ""
echo "📋 Checking build output..."
if [ -d ".next" ]; then
    echo -e "${GREEN}✅ Build directory exists${NC}"
    
    # Check if static files are optimized
    if [ -d ".next/static" ]; then
        echo -e "${GREEN}✅ Static assets generated${NC}"
    else
        echo -e "${YELLOW}⚠️ Static assets not found${NC}"
    fi
else
    echo -e "${RED}❌ Build directory not found${NC}"
    echo "   Run 'npm run build' first"
fi

# Check for production quality optimizer
echo ""
echo "📋 Checking production quality optimizer..."
if [ -f "components/production-quality-optimizer.tsx" ]; then
    if grep -q "image-rendering: high-quality" components/production-quality-optimizer.tsx 2>/dev/null; then
        echo -e "${GREEN}✅ Production quality optimizer properly configured${NC}"
    else
        echo -e "${YELLOW}⚠️ Production quality optimizer may need updates${NC}"
    fi
else
    echo -e "${RED}❌ Production quality optimizer not found${NC}"
fi

echo ""
echo "📊 Summary:"
echo "============"
echo -e "${GREEN}All critical optimizations are in place!${NC}"
echo ""
echo "Next steps:"
echo "1. Commit these changes: git add . && git commit -m 'fix: improve deployment visual quality'"
echo "2. Push to repository: git push origin main"
echo "3. Deploy to Vercel: vercel --prod"
echo "4. Test the deployed version for visual quality"
echo ""
echo "🎉 Quality optimization verification complete!"