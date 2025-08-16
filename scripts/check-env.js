#!/usr/bin/env node

/**
 * Environment variable checker for production deployments
 * Run this script to verify all required environment variables are available
 */

console.log('🔍 Checking environment variables...\n')

// Required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY'
]

// Optional environment variables (server-side only)
const optionalVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT'
]

let allGood = true
const missing = []
const present = []

// Check required variables
console.log('📋 Required Variables (Client-side):')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`)
    present.push(varName)
  } else {
    console.log(`  ❌ ${varName}: MISSING`)
    missing.push(varName)
    allGood = false
  }
})

console.log('\n📋 Optional Variables (Server-side):')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`  ⚠️  ${varName}: Not set (optional)`)
  }
})

console.log('\n' + '='.repeat(50))

if (allGood) {
  console.log('🎉 All required environment variables are present!')
  console.log('\n📝 Deployment checklist:')
  console.log('  1. ✅ Environment variables configured')
  console.log('  2. 🔄 Run: npm run build (to test build)')
  console.log('  3. 🚀 Deploy with: vercel --prod')
} else {
  console.log('❌ Missing required environment variables!')
  console.log('\n📝 To fix this issue:')
  console.log('  1. Go to Vercel Dashboard')
  console.log('  2. Navigate to: Your Project → Settings → Environment Variables')
  console.log('  3. Add these missing variables for Production environment:')
  missing.forEach(varName => {
    console.log(`     - ${varName}`)
  })
  console.log('  4. Redeploy your application')
  
  process.exit(1)
}

// Additional validation for Supabase URL format
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    console.log('\n⚠️  Warning: NEXT_PUBLIC_SUPABASE_URL format looks incorrect')
    console.log(`   Expected: https://[project-id].supabase.co`)
    console.log(`   Got: ${url}`)
  }
}

console.log('\n🔍 Environment check completed.')