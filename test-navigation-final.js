const { chromium } = require('playwright');

async function testNavigation() {
  const browser = await chromium.launch({ headless: false }); // Set to true for CI
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  // Login first
  console.log('🔐 Logging in...');
  await page.goto('http://localhost:3002/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for login form to be ready
  await page.waitForSelector('#email', { timeout: 10000 });
  await page.waitForSelector('#password', { timeout: 10000 });
  
  // Fill login form using correct selectors
  await page.fill('#email', 'worker@inopnc.com');
  await page.fill('#password', 'password123');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  console.log('✅ Successfully logged in to dashboard');
  await page.waitForTimeout(2000); // Wait for page to fully load
  
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
    console.log(`\n📝 Testing: ${test.name}`);
    
    // Navigate to starting page
    if (test.from === 'dashboard') {
      await page.goto('http://localhost:3002/dashboard');
    } else {
      await page.goto(`http://localhost:3002/dashboard/${test.from}`);
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const beforeUrl = page.url();
    console.log(`  Starting URL: ${beforeUrl}`);
    
    // Click documents button based on location
    try {
      if (test.via === 'sidebar') {
        // Try desktop sidebar first
        const desktopSidebar = await page.$('nav.hidden.lg\\:block a:has-text("문서함"), nav.hidden.lg\\:block button:has-text("문서함")');
        if (desktopSidebar) {
          await desktopSidebar.click();
        } else {
          // Try mobile sidebar (hamburger menu)
          const hamburger = await page.$('button[aria-label="메뉴 열기"], button:has(svg.h-6.w-6)');
          if (hamburger) {
            await hamburger.click();
            await page.waitForTimeout(500);
          }
          // Click documents in mobile menu
          await page.click('nav a:has-text("문서함"), nav button:has-text("문서함")');
        }
      } else if (test.via === 'bottom') {
        // Bottom navigation
        await page.click('nav.fixed.bottom-0 button:has-text("문서함")');
      } else if (test.via === 'quick') {
        // Quick menu button
        const quickMenuButton = await page.$('button:has-text("문서함"):visible');
        if (quickMenuButton) {
          await quickMenuButton.click();
        } else {
          // Try alternative selector
          await page.click('.grid button:has-text("문서함")');
        }
      }
      
      await page.waitForTimeout(2000);
      
      // Check if we're on documents page
      const afterUrl = page.url();
      const urlChanged = beforeUrl !== afterUrl;
      const isDocumentsUrl = afterUrl.includes('documents') || afterUrl.includes('#documents');
      
      // Check for documents UI elements
      let documentsVisible = false;
      try {
        documentsVisible = await page.isVisible('text="내 문서함"', { timeout: 1000 }) || 
                          await page.isVisible('text="공유 문서함"', { timeout: 1000 }) ||
                          await page.isVisible('text="도면 마킹"', { timeout: 1000 }) ||
                          await page.isVisible('text="필수 제출 서류"', { timeout: 1000 }) ||
                          await page.isVisible('[role="tablist"]:has-text("내 문서함")', { timeout: 1000 });
      } catch (e) {
        // Elements not found
      }
      
      const success = isDocumentsUrl || documentsVisible;
      
      results.push({
        test: test.name,
        success: success,
        beforeUrl: beforeUrl,
        afterUrl: afterUrl,
        urlChanged: urlChanged,
        documentsVisible: documentsVisible
      });
      
      console.log(`  Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`  After URL: ${afterUrl}`);
      console.log(`  URL changed: ${urlChanged}`);
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
  
  // Additional tests for documents tab navigation
  console.log('\n\n📂 Testing navigation from different document tabs...');
  
  const documentTabs = [
    { tab: '내 문서함', tabId: 'my-documents' },
    { tab: '공유 문서함', tabId: 'shared-documents' },
    { tab: '도면 마킹', tabId: 'markup-documents' },
    { tab: '필수 제출 서류', tabId: 'required-documents' }
  ];
  
  for (const docTab of documentTabs) {
    console.log(`\n📑 Testing from ${docTab.tab} tab...`);
    
    // Go to documents page
    await page.goto('http://localhost:3002/dashboard#documents-unified');
    await page.waitForTimeout(2000);
    
    // Click on the tab
    try {
      await page.click(`button:has-text("${docTab.tab}")`);
      await page.waitForTimeout(1000);
      
      // Try navigating to other pages from this tab
      const testTargets = [
        { target: '출력현황', selector: 'nav button:has-text("출력현황"), nav a:has-text("출력현황")' },
        { target: '작업일지', selector: 'nav button:has-text("작업일지"), nav a:has-text("작업일지")' }
      ];
      
      for (const target of testTargets) {
        const beforeUrl = page.url();
        console.log(`  ${docTab.tab} → ${target.target}`);
        
        try {
          await page.click(target.selector);
          await page.waitForTimeout(1500);
          
          const afterUrl = page.url();
          const navigated = !afterUrl.includes('documents');
          
          console.log(`    ${navigated ? '✅' : '❌'} Navigation ${navigated ? 'successful' : 'failed'}`);
          
          // Go back to documents for next test
          if (navigated) {
            await page.goto('http://localhost:3002/dashboard#documents-unified');
            await page.waitForTimeout(1000);
            await page.click(`button:has-text("${docTab.tab}")`);
            await page.waitForTimeout(1000);
          }
        } catch (e) {
          console.log(`    ❌ Error: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`  ❌ Could not click tab: ${e.message}`);
    }
  }
  
  console.log('\n\n=== 📊 SUMMARY ===');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${Math.round((successCount / results.length) * 100)}%`);
  
  console.log('\n=== DETAILED RESULTS ===');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.test}`);
    if (!r.success && r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });
  
  // Keep browser open for manual inspection
  console.log('\n\n🔍 Browser will stay open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  
  // Return exit code based on results
  process.exit(failCount > 0 ? 1 : 0);
}

testNavigation().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});