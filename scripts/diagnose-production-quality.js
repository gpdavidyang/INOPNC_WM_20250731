#!/usr/bin/env node

/**
 * Production Quality Diagnostic Script
 * 
 * This script diagnoses visual quality issues in production deployment
 * and provides specific recommendations for fixes.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Production Quality Diagnostic Tool\n');
console.log('=' .repeat(60));

// Check configuration files
function checkConfig(filePath, checks) {
  console.log(`\n📄 Checking ${path.basename(filePath)}:`);
  
  if (!fs.existsSync(filePath)) {
    console.log('  ❌ File not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let hasIssues = false;
  
  checks.forEach(check => {
    if (check.shouldNotContain && content.includes(check.shouldNotContain)) {
      console.log(`  ⚠️  ${check.issue}`);
      console.log(`     Fix: ${check.fix}`);
      hasIssues = true;
    }
    if (check.shouldContain && !content.includes(check.shouldContain)) {
      console.log(`  ⚠️  ${check.issue}`);
      console.log(`     Fix: ${check.fix}`);
      hasIssues = true;
    }
  });
  
  if (!hasIssues) {
    console.log('  ✅ Configuration optimized for quality');
  }
  
  return !hasIssues;
}

// Check next.config.mjs
const nextConfigChecks = [
  {
    shouldNotContain: 'swcMinify: true',
    issue: 'SWC minification enabled (can degrade quality)',
    fix: 'Set swcMinify: false'
  },
  {
    shouldNotContain: 'compress: true',
    issue: 'Compression enabled (can cause artifacts)',
    fix: 'Set compress: false'
  },
  {
    shouldNotContain: "formats: ['image/avif', 'image/webp']",
    issue: 'AVIF/WebP conversion enabled (causes color shifts)',
    fix: "Use formats: ['image/png', 'image/jpeg']"
  },
  {
    shouldContain: 'unoptimized: true',
    issue: 'Image optimization enabled',
    fix: 'Set unoptimized: true in images config'
  },
  {
    shouldNotContain: 'optimizeCss: true',
    issue: 'CSS optimization enabled (can remove styles)',
    fix: 'Set optimizeCss: false'
  },
  {
    shouldNotContain: 'optimizeFonts: true',
    issue: 'Font optimization enabled (can cause rendering issues)',
    fix: 'Set optimizeFonts: false'
  },
  {
    shouldContain: 'no-transform',
    issue: 'Missing CDN transformation prevention',
    fix: 'Add Cache-Control: no-transform header'
  }
];

// Check vercel.json
const vercelConfigChecks = [
  {
    shouldNotContain: '"formats": ["image/avif", "image/webp"]',
    issue: 'AVIF/WebP in Vercel config',
    fix: 'Use ["image/png", "image/jpeg"]'
  },
  {
    shouldContain: '"unoptimized": true',
    issue: 'Image optimization in Vercel',
    fix: 'Add "unoptimized": true to images config'
  }
];

// Check PostCSS config
const postcssChecks = [
  {
    shouldNotContain: 'cssnano',
    issue: 'CSS nano minification detected',
    fix: 'Remove cssnano from PostCSS plugins'
  }
];

// Run checks
console.log('\n🔍 DIAGNOSTIC RESULTS:');
console.log('=' .repeat(60));

const nextConfigOk = checkConfig(
  path.join(process.cwd(), 'next.config.mjs'),
  nextConfigChecks
);

const vercelConfigOk = checkConfig(
  path.join(process.cwd(), 'vercel.json'),
  vercelConfigChecks
);

const postcssConfigOk = checkConfig(
  path.join(process.cwd(), 'postcss.config.mjs'),
  postcssChecks
);

// Check for production optimizer component
console.log('\n📄 Checking ProductionQualityOptimizer:');
const optimizerPath = path.join(process.cwd(), 'components/production-quality-optimizer.tsx');
if (fs.existsSync(optimizerPath)) {
  const content = fs.readFileSync(optimizerPath, 'utf8');
  if (content.includes('CRITICAL PRODUCTION QUALITY FIX')) {
    console.log('  ✅ Production optimizer updated with fixes');
  } else {
    console.log('  ⚠️  Production optimizer needs updates');
  }
} else {
  console.log('  ❌ Production optimizer not found');
}

// Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 SUMMARY:\n');

const allOk = nextConfigOk && vercelConfigOk && postcssConfigOk;

if (allOk) {
  console.log('✅ All configurations optimized for production quality!');
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Deploy to Vercel');
  console.log('3. Clear browser cache and test');
} else {
  console.log('⚠️  Quality issues detected in configuration');
  console.log('\n🔧 To fix all issues automatically:');
  console.log('1. Review the fixes above');
  console.log('2. Apply the recommended changes');
  console.log('3. Run this diagnostic again');
  console.log('\n💡 Quick fix command:');
  console.log('   npm run fix:production-quality');
}

console.log('\n📝 Additional recommendations:');
console.log('- Clear Vercel build cache before deploying');
console.log('- Test with different browsers and devices');
console.log('- Check browser DevTools for any compression indicators');
console.log('- Verify no proxy/CDN is modifying content');

console.log('\n' + '=' .repeat(60));