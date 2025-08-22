// Simple manual test for partner permissions without Playwright framework

const { chromium } = require('playwright');

async function testPartnerPermissions() {
  console.log('🧪 Starting Partner Permission Manual Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set longer timeout for loading
    page.setDefaultTimeout(60000);
    
    // Navigate to login
    console.log('📱 Navigating to login page...');
    await page.goto('http://localhost:3005/auth/login');
    
    // Wait for login form to be ready
    console.log('⏳ Waiting for login form to load...');
    await page.waitForSelector('input[name="email"]', { timeout: 30000 });
    await page.waitForSelector('input[name="password"]', { timeout: 30000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    
    // Check for loading state
    const hasLoadingText = await page.locator('text=로딩 중').count() > 0;
    if (hasLoadingText) {
      console.log('⏳ Page is in loading state, waiting...');
      await page.waitForTimeout(10000);
    }
    
    // Login as partner
    console.log('🔑 Logging in as partner@inopnc.com...');
    await page.fill('input[name="email"]', 'partner@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'partner-login-form.png', fullPage: true });
    console.log('📸 Login form screenshot saved');
    
    await page.click('button[type="submit"]');
    
    // Wait for either redirect or error
    console.log('⏳ Waiting for login response...');
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    } catch (error) {
      console.log('⚠️ Dashboard redirect timeout, checking current state...');
    }
    
    // Check current URL after longer wait
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Partner successfully logged in and redirected to dashboard');
      
      // Take screenshot
      await page.screenshot({ 
        path: 'partner-dashboard-test.png', 
        fullPage: true 
      });
      console.log('📸 Screenshot saved as partner-dashboard-test.png');
      
      // Check page content
      const pageText = await page.textContent('body');
      
      // Test navigation elements
      const hasHome = pageText.includes('홈') || pageText.includes('Home');
      const hasReports = pageText.includes('작업일지') || pageText.includes('Daily');
      const hasDocuments = pageText.includes('문서함') || pageText.includes('Documents');
      const hasAttendance = pageText.includes('출근현황') || pageText.includes('Attendance');
      
      console.log('🔍 Navigation Check:');
      console.log(`   홈/Home: ${hasHome ? '✅' : '❌'}`);
      console.log(`   작업일지/Reports: ${hasReports ? '✅' : '❌'}`);
      console.log(`   문서함/Documents: ${hasDocuments ? '✅' : '❌'}`);
      console.log(`   출근현황/Attendance: ${hasAttendance ? '✅' : '❌'}`);
      
      // Check for admin elements (should NOT be present)
      const hasAdmin = pageText.includes('관리자') || pageText.includes('Admin');
      const hasSystem = pageText.includes('시스템 관리') || pageText.includes('System');
      
      console.log('🛡️ Security Check:');
      console.log(`   Admin Elements: ${hasAdmin ? '⚠️ FOUND (unexpected)' : '✅ NOT FOUND (correct)'}`);
      console.log(`   System Elements: ${hasSystem ? '⚠️ FOUND (unexpected)' : '✅ NOT FOUND (correct)'}`);
      
      // Test document access
      console.log('📁 Testing document access...');
      try {
        const documentsLink = page.locator('text=문서함').first();
        if (await documentsLink.count() > 0) {
          await documentsLink.click();
          await page.waitForTimeout(3000);
          console.log('✅ Partner can access documents section');
          
          await page.screenshot({ 
            path: 'partner-documents-test.png', 
            fullPage: true 
          });
          console.log('📸 Documents screenshot saved as partner-documents-test.png');
        }
      } catch (error) {
        console.log('⚠️ Document access test failed:', error.message);
      }
      
      // Test daily reports access
      console.log('📝 Testing daily reports access...');
      try {
        await page.goto('http://localhost:3005/dashboard');
        await page.waitForTimeout(2000);
        
        const reportsLink = page.locator('text=작업일지').first();
        if (await reportsLink.count() > 0) {
          await reportsLink.click();
          await page.waitForTimeout(3000);
          console.log('✅ Partner can access daily reports section');
          
          await page.screenshot({ 
            path: 'partner-reports-test.png', 
            fullPage: true 
          });
          console.log('📸 Reports screenshot saved as partner-reports-test.png');
        }
      } catch (error) {
        console.log('⚠️ Daily reports access test failed:', error.message);
      }
      
      // Test mobile view
      console.log('📱 Testing mobile view...');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3005/dashboard');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'partner-mobile-test.png', 
        fullPage: true 
      });
      console.log('📸 Mobile screenshot saved as partner-mobile-test.png');
      
    } else {
      console.log('❌ Partner login failed or not redirected to dashboard');
      await page.screenshot({ 
        path: 'partner-login-failed.png', 
        fullPage: true 
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
  } finally {
    console.log('🧹 Closing browser...');
    await browser.close();
  }
  
  console.log('✅ Partner permission test completed!');
}

// Run the test
testPartnerPermissions().catch(console.error);