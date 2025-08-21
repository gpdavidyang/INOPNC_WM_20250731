const { chromium } = require('playwright');

async function testNavigation() {
  const browser = await chromium.launch({ headless: false }); // Show browser for debugging
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  // Login first
  console.log('Logging in...');
  await page.goto('http://localhost:3002/auth/login');
  console.log('Waiting for login page to load...');
  await page.waitForTimeout(3000); // Wait for page to load
  
  // Try different selectors
  try {
    // Try email input
    await page.fill('input[type="email"]', 'worker@inopnc.com');
  } catch (e) {
    console.log('Could not find email input by type, trying by placeholder...');
    await page.fill('input[placeholder*="이메일"]', 'worker@inopnc.com');
  }
  
  // Try password input
  try {
    await page.fill('input[type="password"]', 'password123');
  } catch (e) {
    console.log('Could not find password input by type, trying by placeholder...');
    await page.fill('input[placeholder*="비밀번호"]', 'password123');
  }
  
  // Click login button
  await page.click('button[type="submit"]');
  console.log('Waiting for dashboard...');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  
  // Test scenarios
  const tests = [
    { from: 'dashboard', via: 'sidebar', name: '홈 > 사이드바 문서함' },
    { from: 'dashboard', via: 'bottom', name: '홈 > 하단바 문서함' },
    { from: 'dashboard', via: 'quick', name: '홈 > 빠른메뉴 문서함' },
    { from: 'attendance', via: 'sidebar', name: '출력현황 > 사이드바 문서함' },
    { from: 'attendance', via: 'bottom', name: '출력현황 > 하단바 문서함' },
    { from: 'daily-reports', via: 'sidebar', name: '작업일지 > 사이드바 문서함' },
    { from: 'daily-reports', via: 'bottom', name: '작업일지 > 하단바 문서함' },
    { from: 'site-info', via: 'sidebar', name: '현장정보 > 사이드바 문서함' },
    { from: 'site-info', via: 'bottom', name: '현장정보 > 하단바 문서함' },
  ];
  
  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    
    // Navigate to starting page
    if (test.from === 'dashboard') {
      await page.goto('http://localhost:3002/dashboard');
    } else {
      await page.goto(`http://localhost:3002/dashboard/${test.from}`);
    }
    await page.waitForTimeout(1000);
    
    // Click documents button based on location
    try {
      if (test.via === 'sidebar') {
        // Desktop sidebar
        const sidebarButton = await page.$('nav a[href*="documents"], nav button:has-text("문서함")');
        if (sidebarButton) {
          await sidebarButton.click();
        } else {
          // Mobile sidebar (hamburger menu)
          await page.click('button[aria-label="메뉴 열기"]');
          await page.waitForTimeout(500);
          await page.click('a:has-text("문서함"), button:has-text("문서함")');
        }
      } else if (test.via === 'bottom') {
        await page.click('nav.fixed.bottom-0 button:has-text("문서함")');
      } else if (test.via === 'quick') {
        await page.click('button:has-text("문서함"):visible');
      }
      
      await page.waitForTimeout(1500);
      
      // Check if we're on documents page
      const url = page.url();
      const isDocumentsVisible = await page.isVisible('text="내 문서함"') || 
                                  await page.isVisible('text="공유 문서함"') ||
                                  await page.isVisible('text="도면 마킹"') ||
                                  await page.isVisible('text="필수 제출 서류"');
      
      const success = url.includes('documents') || url.includes('#documents') || isDocumentsVisible;
      
      results.push({
        test: test.name,
        success: success,
        url: url,
        documentsVisible: isDocumentsVisible
      });
      
      console.log(`  Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`  URL: ${url}`);
      console.log(`  Documents UI visible: ${isDocumentsVisible}`);
      
    } catch (error) {
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
      console.log(`  Result: ❌ ERROR - ${error.message}`);
    }
  }
  
  console.log('\n=== SUMMARY ===');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.test}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\nTotal: ${successCount}/${results.length} tests passed`);
  
  await browser.close();
}

testNavigation().catch(console.error);