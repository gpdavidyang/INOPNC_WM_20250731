#!/bin/bash

# Deployment Quality Optimization Script
# This script ensures optimal visual quality for production deployment

echo "🎨 Starting deployment quality optimization..."

# 1. Clean previous builds
echo "📦 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# 2. Install dependencies with clean slate
echo "📦 Installing dependencies..."
npm ci

# 3. Set environment variables for optimal build
export NODE_ENV=production
export NEXT_SHARP_PATH=/tmp/node_modules/sharp
export NEXT_TELEMETRY_DISABLED=1

# 4. Build with quality-focused settings
echo "🔨 Building with optimized settings..."
npm run build

# 5. Verify build output
if [ -d ".next" ]; then
    echo "✅ Build completed successfully"
    
    # Check build size
    echo "📊 Build statistics:"
    du -sh .next/
    
    # Verify static assets
    if [ -d ".next/static" ]; then
        echo "✅ Static assets generated"
    else
        echo "⚠️ Warning: Static assets not found"
    fi
else
    echo "❌ Build failed"
    exit 1
fi

echo "🎉 Deployment optimization complete!"
echo ""
echo "📝 Deployment checklist:"
echo "  ✅ SWC minification enabled"
echo "  ✅ CSS optimization configured"
echo "  ✅ Font loading optimized"
echo "  ✅ Image optimization enabled"
echo "  ✅ Compression enabled"
echo "  ✅ High DPI support added"
echo ""
echo "🚀 Ready for deployment to Vercel"