// Site manager mobile navigation test
const { chromium } = require('playwright');

async function testSiteManagerNavigation() {
  console.log('🧪 Testing Site Manager Mobile Navigation...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    console.log('📱 Step 1: Login as Site Manager');
    await page.goto('http://localhost:3001/auth/login');
    await page.waitForSelector('input[name="email"]', { timeout: 15000 });
    
    await page.fill('input[name="email"]', 'manager@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ Site manager logged in successfully');
    
    // Take initial screenshot
    await page.screenshot({ path: 'site-manager-dashboard.png', fullPage: true });
    console.log('📸 Dashboard screenshot: site-manager-dashboard.png');
    
    console.log('\n📱 Step 2: Test Mobile Navigation Buttons');
    
    // Wait for mobile nav to be visible
    await page.waitForSelector('nav.fixed.bottom-0', { timeout: 10000 });
    console.log('✅ Mobile navigation found');
    
    // Test each navigation button
    const navTests = [
      { label: '빠른메뉴', href: '/dashboard' },
      { label: '출근현황', href: '/dashboard/attendance' },
      { label: '작업일지', href: '/dashboard/daily-reports' },
      { label: '현장정보', href: '/dashboard/site-info' },
      { label: '문서함', href: '/dashboard/documents' }
    ];
    
    for (const test of navTests) {
      try {
        console.log(`🔍 Testing: ${test.label}`);
        
        // Find and click the button
        const button = page.locator(`nav.fixed.bottom-0 button:has-text("${test.label}")`).first();
        await button.waitFor({ state: 'visible', timeout: 5000 });
        
        console.log(`  📍 Button found: ${test.label}`);
        
        // Click the button
        await button.click();
        
        // Wait for navigation
        await page.waitForTimeout(2000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`  📍 Current URL: ${currentUrl}`);
        
        if (currentUrl.includes(test.href) || currentUrl.endsWith(test.href)) {
          console.log(`  ✅ ${test.label}: Navigation SUCCESS`);
        } else {
          console.log(`  ❌ ${test.label}: Navigation FAILED - Expected ${test.href}, got ${currentUrl}`);
        }
        
        // Take screenshot
        await page.screenshot({ 
          path: `site-manager-${test.label.replace(/\s+/g, '-')}.png`, 
          fullPage: true 
        });
        
        // Wait between tests
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`  ❌ ${test.label}: ERROR - ${error.message}`);
      }
    }
    
    console.log('\n📱 Step 3: Test Navigation Performance');
    
    // Test rapid navigation clicks
    console.log('🔄 Testing rapid navigation...');
    
    const rapidTests = ['빠른메뉴', '작업일지', '출근현황', '문서함'];
    
    for (const label of rapidTests) {
      try {
        const startTime = Date.now();
        
        const button = page.locator(`nav.fixed.bottom-0 button:has-text("${label}")`).first();
        await button.click();
        await page.waitForTimeout(500);
        
        const duration = Date.now() - startTime;
        console.log(`  📊 ${label}: ${duration}ms`);
        
      } catch (error) {
        console.log(`  ❌ ${label}: Rapid test failed - ${error.message}`);
      }
    }
    
    console.log('\n📱 Step 4: Test Mobile Navigation Visibility');
    
    // Check if navigation is properly styled and visible
    const navElement = await page.locator('nav.fixed.bottom-0').first();
    const navBoundingBox = await navElement.boundingBox();
    
    if (navBoundingBox) {
      console.log('✅ Navigation bar is visible');
      console.log(`  📏 Position: x=${navBoundingBox.x}, y=${navBoundingBox.y}`);
      console.log(`  📏 Size: width=${navBoundingBox.width}, height=${navBoundingBox.height}`);
    } else {
      console.log('❌ Navigation bar not visible');
    }
    
    // Check button count
    const buttonCount = await page.locator('nav.fixed.bottom-0 button').count();
    console.log(`🔢 Navigation buttons count: ${buttonCount}`);
    
    // Check if buttons have proper touch targets
    const buttons = await page.locator('nav.fixed.bottom-0 button').all();
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const box = await button.boundingBox();
      if (box && box.height >= 44) { // 44px is minimum touch target
        console.log(`✅ Button ${i + 1}: Good touch target (${box.height}px height)`);
      } else {
        console.log(`⚠️ Button ${i + 1}: Small touch target (${box?.height || 0}px height)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'site-manager-nav-error.png', fullPage: true });
    
  } finally {
    console.log('\n🧹 Closing browser...');
    await browser.close();
  }
  
  console.log('\n🏁 Site Manager Navigation Test Complete!');
}

// Run the test
testSiteManagerNavigation().catch(console.error);