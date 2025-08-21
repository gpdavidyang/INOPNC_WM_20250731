const { chromium } = require('playwright');

async function testNavigationLoggedIn() {
  console.log('🚀 Starting navigation test (assuming already logged in)...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  // Go directly to dashboard (assuming already logged in)
  console.log('📍 Going to dashboard...');
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(3000);
  
  // Check if we're on dashboard or redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes('login')) {
    console.log('❌ Not logged in, please login manually first');
    console.log('   1. Open http://localhost:3000/auth/login in your browser');
    console.log('   2. Login with worker@inopnc.com / password123');
    console.log('   3. Then run this test again');
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ On dashboard, starting tests...\n');
  
  // Test scenarios
  const tests = [
    { from: 'dashboard', via: 'sidebar', name: '홈 > 사이드바 문서함' },
    { from: 'dashboard', via: 'bottom', name: '홈 > 하단바 문서함' },
    { from: 'dashboard/attendance', via: 'sidebar', name: '출력현황 > 사이드바 문서함' },
    { from: 'dashboard/attendance', via: 'bottom', name: '출력현황 > 하단바 문서함' },
    { from: 'dashboard/daily-reports', via: 'sidebar', name: '작업일지 > 사이드바 문서함' },
    { from: 'dashboard/daily-reports', via: 'bottom', name: '작업일지 > 하단바 문서함' },
    { from: 'dashboard/site-info', via: 'sidebar', name: '현장정보 > 사이드바 문서함' },
    { from: 'dashboard/site-info', via: 'bottom', name: '현장정보 > 하단바 문서함' },
  ];
  
  for (const test of tests) {
    console.log(`\n📝 Testing: ${test.name}`);
    
    // Navigate to starting page
    const startUrl = `http://localhost:3000/${test.from}`;
    await page.goto(startUrl);
    await page.waitForTimeout(2000);
    
    const beforeUrl = page.url();
    console.log(`  Starting URL: ${beforeUrl}`);
    
    // Click documents button based on location
    try {
      let clicked = false;
      
      if (test.via === 'sidebar') {
        // Desktop sidebar (hidden on mobile)
        const desktopSidebar = await page.$('nav.hidden.lg\\:block a:has-text("문서함"), nav.hidden.lg\\:block button:has-text("문서함")');
        if (desktopSidebar) {
          console.log('  Clicking desktop sidebar...');
          await desktopSidebar.click();
          clicked = true;
        } else {
          // Mobile sidebar - open hamburger menu first
          console.log('  Opening mobile menu...');
          const hamburger = await page.$('button[aria-label="메뉴 열기"], button.lg\\:hidden:has(svg)');
          if (hamburger) {
            await hamburger.click();
            await page.waitForTimeout(500);
            
            // Click documents in mobile menu
            const mobileMenuItem = await page.$('nav:not(.fixed.bottom-0) a:has-text("문서함"), nav:not(.fixed.bottom-0) button:has-text("문서함")');
            if (mobileMenuItem) {
              console.log('  Clicking mobile sidebar menu item...');
              await mobileMenuItem.click();
              clicked = true;
            }
          }
        }
      } else if (test.via === 'bottom') {
        // Bottom navigation (mobile only)
        const bottomNav = await page.$('nav.fixed.bottom-0 button:has-text("문서함")');
        if (bottomNav) {
          console.log('  Clicking bottom navigation...');
          await bottomNav.click();
          clicked = true;
        }
      }
      
      if (!clicked) {
        throw new Error('Could not find navigation element');
      }
      
      await page.waitForTimeout(2000);
      
      // Check results
      const afterUrl = page.url();
      const urlChanged = beforeUrl !== afterUrl;
      const isDocumentsUrl = afterUrl.includes('documents') || afterUrl.includes('#documents');
      
      // Check for documents UI elements
      let documentsVisible = false;
      const documentIndicators = [
        'text="내 문서함"',
        'text="공유 문서함"',
        'text="도면 마킹"',
        'text="필수 제출 서류"',
        'button:has-text("내 문서함")',
        'button:has-text("공유 문서함")'
      ];
      
      for (const selector of documentIndicators) {
        try {
          if (await page.isVisible(selector, { timeout: 500 })) {
            documentsVisible = true;
            break;
          }
        } catch (e) {
          // Continue checking other selectors
        }
      }
      
      const success = isDocumentsUrl || documentsVisible;
      
      results.push({
        test: test.name,
        success: success,
        beforeUrl: beforeUrl.replace('http://localhost:3000', ''),
        afterUrl: afterUrl.replace('http://localhost:3000', ''),
        urlChanged: urlChanged,
        documentsVisible: documentsVisible
      });
      
      console.log(`  Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`  After URL: ${afterUrl.replace('http://localhost:3000', '')}`);
      console.log(`  Documents UI visible: ${documentsVisible}`);
      
    } catch (error) {
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
      console.log(`  Result: ❌ ERROR - ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Passed: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);
  console.log(`📈 Success Rate: ${Math.round((successCount / results.length) * 100)}%`);
  
  console.log('\nDetailed Results:');
  console.log('-'.repeat(50));
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.test}`);
    if (!r.success && r.error) {
      console.log(`   └─ Error: ${r.error}`);
    } else if (!r.success) {
      console.log(`   └─ Navigation failed`);
    }
  });
  
  // Keep browser open for inspection
  console.log('\n\n🔍 Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  
  // Exit with appropriate code
  process.exit(failCount > 0 ? 1 : 0);
}

testNavigationLoggedIn().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});