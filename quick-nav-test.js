// Quick navigation test for site manager
const { chromium } = require('playwright');

async function quickNavTest() {
  console.log('🚀 Quick Navigation Test for Site Manager...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    console.log('📱 Logging in...');
    await page.goto('http://localhost:3001/auth/login');
    
    // Wait for login form with extended timeout
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[name="email"]', { timeout: 30000 });
    
    await page.fill('input[name="email"]', 'manager@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard with extended timeout
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ Logged in successfully');
    
    // Wait for mobile nav to be visible
    await page.waitForSelector('nav.fixed.bottom-0', { timeout: 15000 });
    console.log('✅ Mobile navigation visible');
    
    // Take initial screenshot
    await page.screenshot({ path: 'quick-test-dashboard.png', fullPage: true });
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('[UnifiedMobileNav]') || msg.text().includes('[DashboardLayout]')) {
        console.log('🔍 Browser Log:', msg.text());
      }
    });
    
    // Test each navigation button one by one
    console.log('\n🔍 Testing navigation buttons...');
    
    // Test 출근현황
    console.log('📊 Testing 출근현황...');
    const attendanceBtn = page.locator('nav.fixed.bottom-0 button:has-text("출근현황")');
    await attendanceBtn.click();
    await page.waitForTimeout(3000);
    console.log('Current URL after 출근현황:', page.url());
    
    // Test 작업일지
    console.log('📝 Testing 작업일지...');
    const reportsBtn = page.locator('nav.fixed.bottom-0 button:has-text("작업일지")');
    await reportsBtn.click();
    await page.waitForTimeout(3000);
    console.log('Current URL after 작업일지:', page.url());
    
    // Test 현장정보
    console.log('🏗️ Testing 현장정보...');
    const siteBtn = page.locator('nav.fixed.bottom-0 button:has-text("현장정보")');
    await siteBtn.click();
    await page.waitForTimeout(3000);
    console.log('Current URL after 현장정보:', page.url());
    
    // Test 문서함
    console.log('📁 Testing 문서함...');
    const docsBtn = page.locator('nav.fixed.bottom-0 button:has-text("문서함")');
    await docsBtn.click();
    await page.waitForTimeout(3000);
    console.log('Current URL after 문서함:', page.url());
    
    // Return to home
    console.log('🏠 Testing 빠른메뉴...');
    const homeBtn = page.locator('nav.fixed.bottom-0 button:has-text("빠른메뉴")');
    await homeBtn.click();
    await page.waitForTimeout(3000);
    console.log('Current URL after 빠른메뉴:', page.url());
    
    // Take final screenshot
    await page.screenshot({ path: 'quick-test-final.png', fullPage: true });
    
    // Wait a moment to see the result
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page?.screenshot({ path: 'quick-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  console.log('🏁 Quick navigation test complete');
}

quickNavTest().catch(console.error);