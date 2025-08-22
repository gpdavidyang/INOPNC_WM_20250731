#!/usr/bin/env node

/**
 * Mobile Navigation Performance Test
 * Tests navigation speed and reliability for site managers and other roles
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_RESULTS_DIR = path.join(__dirname, '..', 'test-results');
const NAVIGATION_LOG = path.join(TEST_RESULTS_DIR, 'navigation-performance.json');

// Ensure test results directory exists
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Test scenarios for different user roles
const TEST_SCENARIOS = [
  {
    role: 'site_manager',
    email: 'manager@inopnc.com',
    name: 'Site Manager Navigation Test',
    routes: [
      '/dashboard',
      '/dashboard/attendance',
      '/dashboard/daily-reports',
      '/dashboard/site-info',
      '/dashboard/documents'
    ]
  },
  {
    role: 'worker',
    email: 'worker@inopnc.com', 
    name: 'Worker Navigation Test',
    routes: [
      '/dashboard',
      '/dashboard/attendance',
      '/dashboard/daily-reports',
      '/dashboard/documents'
    ]
  },
  {
    role: 'admin',
    email: 'admin@inopnc.com',
    name: 'Admin Navigation Test',
    routes: [
      '/dashboard/admin',
      '/dashboard/admin/sites',
      '/dashboard/admin/users',
      '/dashboard/admin/documents'
    ]
  }
];

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function logResult(testName, result) {
  const logEntry = {
    timestamp: getCurrentTimestamp(),
    testName,
    ...result
  };

  let existingLogs = [];
  if (fs.existsSync(NAVIGATION_LOG)) {
    try {
      const data = fs.readFileSync(NAVIGATION_LOG, 'utf8');
      existingLogs = JSON.parse(data);
    } catch (error) {
      console.warn('Could not read existing log file:', error.message);
    }
  }

  existingLogs.push(logEntry);
  
  // Keep only last 100 entries to prevent file from getting too large
  if (existingLogs.length > 100) {
    existingLogs = existingLogs.slice(-100);
  }

  fs.writeFileSync(NAVIGATION_LOG, JSON.stringify(existingLogs, null, 2));
  console.log(`✅ ${testName}: ${result.status} (${result.duration}ms)`);
}

async function runPlaywrightTest(scenario) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const testScript = `
      import { test, expect } from '@playwright/test';

      test('${scenario.name}', async ({ page }) => {
        // Set mobile viewport for mobile navigation testing
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Login
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', '${scenario.email}');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        
        // Wait for dashboard to load
        await page.waitForLoadState('networkidle');
        
        const navigationTimes = [];
        
        // Test each route navigation
        for (const route of ${JSON.stringify(scenario.routes)}) {
          const navStart = Date.now();
          
          // Navigate to route
          await page.goto(route);
          await page.waitForLoadState('networkidle');
          
          // Check if mobile navigation is visible and functional
          const mobileNav = page.locator('nav[aria-label*="모바일"]');
          await expect(mobileNav).toBeVisible();
          
          const navEnd = Date.now();
          navigationTimes.push({
            route: route,
            duration: navEnd - navStart
          });
        }
        
        // Test mobile navigation clicks
        const navButtons = page.locator('nav[aria-label*="모바일"] button');
        const buttonCount = await navButtons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const clickStart = Date.now();
          await navButtons.nth(i).click();
          await page.waitForTimeout(500); // Wait for navigation
          const clickEnd = Date.now();
          
          navigationTimes.push({
            route: 'mobile_nav_click_' + i,
            duration: clickEnd - clickStart
          });
        }
        
        console.log('Navigation times:', JSON.stringify(navigationTimes));
      });
    `;

    // Write temporary test file
    const tempTestFile = path.join(__dirname, `temp-nav-test-${scenario.role}.spec.js`);
    fs.writeFileSync(tempTestFile, testScript);

    // Run the test
    const testProcess = spawn('npx', ['playwright', 'test', tempTestFile, '--project=chromium'], {
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      // Clean up temp file
      if (fs.existsSync(tempTestFile)) {
        fs.unlinkSync(tempTestFile);
      }

      const result = {
        status: code === 0 ? 'PASS' : 'FAIL',
        duration,
        role: scenario.role,
        output: output.substring(0, 1000), // Limit output size
        error: errorOutput.substring(0, 500)
      };

      logResult(scenario.name, result);
      resolve(result);
    });

    // Set timeout for long-running tests
    setTimeout(() => {
      testProcess.kill();
      const result = {
        status: 'TIMEOUT',
        duration: Date.now() - startTime,
        role: scenario.role,
        error: 'Test timed out after 30 seconds'
      };
      logResult(scenario.name, result);
      resolve(result);
    }, 30000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting Mobile Navigation Performance Tests...\n');
  
  const results = [];
  
  for (const scenario of TEST_SCENARIOS) {
    console.log(`📱 Testing ${scenario.name}...`);
    const result = await runPlaywrightTest(scenario);
    results.push(result);
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate summary
  console.log('\n📊 Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const timeouts = results.filter(r => r.status === 'TIMEOUT').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);  
  console.log(`⏰ Timeouts: ${timeouts}`);
  
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`📈 Average Duration: ${Math.round(avgDuration)}ms`);
  
  // Performance analysis
  if (avgDuration < 3000) {
    console.log('🏆 Excellent performance! Navigation is fast and responsive.');
  } else if (avgDuration < 5000) {
    console.log('⚠️  Good performance, but there might be room for improvement.');
  } else {
    console.log('🐌 Performance needs improvement. Navigation is too slow.');
  }
  
  console.log(`\n📝 Detailed results saved to: ${NAVIGATION_LOG}`);
}

function analyzeExistingResults() {
  if (!fs.existsSync(NAVIGATION_LOG)) {
    console.log('No previous test results found.');
    return;
  }

  try {
    const data = fs.readFileSync(NAVIGATION_LOG, 'utf8');
    const results = JSON.parse(data);
    
    if (results.length === 0) {
      console.log('No test results to analyze.');
      return;
    }

    console.log('\n📈 Performance Trend Analysis:');
    console.log('='.repeat(40));

    // Group by role
    const byRole = results.reduce((acc, result) => {
      if (!acc[result.role]) acc[result.role] = [];
      acc[result.role].push(result);
      return acc;
    }, {});

    Object.keys(byRole).forEach(role => {
      const roleResults = byRole[role];
      const avgDuration = roleResults.reduce((sum, r) => sum + r.duration, 0) / roleResults.length;
      const successRate = (roleResults.filter(r => r.status === 'PASS').length / roleResults.length) * 100;
      
      console.log(`${role.toUpperCase()}:`);
      console.log(`  Average Duration: ${Math.round(avgDuration)}ms`);
      console.log(`  Success Rate: ${Math.round(successRate)}%`);
      console.log(`  Tests Run: ${roleResults.length}`);
      console.log('');
    });

    // Recent performance
    const recent = results.slice(-10);
    const recentAvg = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
    console.log(`Recent Average (last 10 tests): ${Math.round(recentAvg)}ms`);

  } catch (error) {
    console.error('Error analyzing results:', error.message);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--analyze') || args.includes('-a')) {
    analyzeExistingResults();
  } else {
    runAllTests().catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
  }
}

module.exports = {
  runAllTests,
  analyzeExistingResults
};