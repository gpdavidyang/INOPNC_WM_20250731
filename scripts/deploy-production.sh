#!/bin/bash

# Production deployment script with environment validation
# This script ensures all environment variables are properly configured before deployment

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# 1. Validate local environment
echo "📋 Step 1: Validating local environment..."
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "📝 Create .env.local with your environment variables"
    exit 1
fi

# 2. Check if environment variables are set
echo "📋 Step 2: Checking required environment variables..."
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Error: Missing environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo ""
    echo "📝 Add these variables to your Vercel project:"
    echo "   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
    echo "   2. Add the missing variables for Production environment"
    exit 1
fi

# 3. Build locally to catch any build-time errors
echo "📋 Step 3: Testing local build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Local build failed"
    echo "🔧 Fix build errors before deploying"
    exit 1
fi

echo "✅ Local build successful"

# 4. Deploy to Vercel
echo "📋 Step 4: Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the production site"
    echo "   2. Check browser console for any environment variable errors"
    echo "   3. Verify Supabase authentication works"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   If you see 'Invalid API key' errors:"
    echo "   - Check Vercel Dashboard → Environment Variables"
    echo "   - Ensure NEXT_PUBLIC_* variables are set for Production"
    echo "   - Redeploy after adding missing variables"
else
    echo "❌ Deployment failed"
    exit 1
fi