const { chromium, devices } = require('playwright');

async function testMobileAllNavigation() {
  console.log('📱 Starting comprehensive MOBILE navigation test...\n');
  console.log('=' .repeat(60));
  console.log('Account: manager@inopnc.com');
  console.log('Viewport: iPhone 13 (390x844)');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  
  // Mobile viewport only
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'ko-KR'
  });
  
  const page = await context.newPage();
  const results = [];
  
  // Login
  console.log('\n🔐 Logging in...');
  await page.goto('http://localhost:3002/auth/login');
  await page.waitForTimeout(2000);
  
  if (!page.url().includes('dashboard')) {
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.fill('#email', 'manager@inopnc.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✅ Logged in successfully');
  }
  
  // Verify mobile UI
  console.log('\n🔍 Verifying mobile UI...');
  const bottomNavVisible = await page.isVisible('nav.fixed.bottom-0');
  console.log(`Bottom navigation visible: ${bottomNavVisible ? '✅' : '❌'}`);
  
  // Define all navigation test cases
  const navigationTests = [
    // From 홈 (Dashboard)
    { from: 'dashboard', to: 'attendance', name: '홈 → 출력정보', method: 'bottom' },
    { from: 'dashboard', to: 'daily-reports', name: '홈 → 작업일지', method: 'bottom' },
    { from: 'dashboard', to: 'documents', name: '홈 → 문서함', method: 'bottom' },
    { from: 'dashboard', to: 'site-info', name: '홈 → 현장정보', method: 'bottom' },
    { from: 'dashboard', to: 'attendance', name: '홈 → 출력현황(빠른메뉴)', method: 'quick' },
    { from: 'dashboard', to: 'daily-reports', name: '홈 → 작업일지(빠른메뉴)', method: 'quick' },
    { from: 'dashboard', to: 'documents', name: '홈 → 문서함(빠른메뉴)', method: 'quick' },
    { from: 'dashboard', to: 'site-info', name: '홈 → 현장정보(빠른메뉴)', method: 'quick' },
    
    // From 출력현황
    { from: 'attendance', to: 'dashboard', name: '출력현황 → 빠른메뉴', method: 'bottom' },
    { from: 'attendance', to: 'daily-reports', name: '출력현황 → 작업일지', method: 'bottom' },
    { from: 'attendance', to: 'documents', name: '출력현황 → 문서함', method: 'bottom' },
    { from: 'attendance', to: 'site-info', name: '출력현황 → 현장정보', method: 'bottom' },
    
    // From 작업일지
    { from: 'daily-reports', to: 'dashboard', name: '작업일지 → 빠른메뉴', method: 'bottom' },
    { from: 'daily-reports', to: 'attendance', name: '작업일지 → 출력정보', method: 'bottom' },
    { from: 'daily-reports', to: 'documents', name: '작업일지 → 문서함', method: 'bottom' },
    { from: 'daily-reports', to: 'site-info', name: '작업일지 → 현장정보', method: 'bottom' },
    
    // From 문서함
    { from: 'documents', to: 'dashboard', name: '문서함 → 빠른메뉴', method: 'bottom' },
    { from: 'documents', to: 'attendance', name: '문서함 → 출력정보', method: 'bottom' },
    { from: 'documents', to: 'daily-reports', name: '문서함 → 작업일지', method: 'bottom' },
    { from: 'documents', to: 'site-info', name: '문서함 → 현장정보', method: 'bottom' },
    
    // From 현장정보
    { from: 'site-info', to: 'dashboard', name: '현장정보 → 빠른메뉴', method: 'bottom' },
    { from: 'site-info', to: 'attendance', name: '현장정보 → 출력정보', method: 'bottom' },
    { from: 'site-info', to: 'daily-reports', name: '현장정보 → 작업일지', method: 'bottom' },
    { from: 'site-info', to: 'documents', name: '현장정보 → 문서함', method: 'bottom' },
  ];
  
  console.log('\n📋 Testing navigation paths...\n');
  
  for (const test of navigationTests) {
    console.log(`📍 Testing: ${test.name} [${test.method}]`);
    
    // Navigate to starting point
    const fromPath = test.from === 'documents' ? 'dashboard#documents-unified' : 
                     test.from === 'dashboard' ? 'dashboard' : `dashboard/${test.from}`;
    await page.goto(`http://localhost:3002/${fromPath}`);
    await page.waitForTimeout(1500);
    
    const beforeUrl = page.url();
    console.log(`  From: ${beforeUrl.replace('http://localhost:3002/', '')}`);
    
    try {
      let clicked = false;
      const targetName = getButtonName(test.to);
      
      if (test.method === 'bottom') {
        // Bottom navigation
        const bottomButton = await page.$(`nav.fixed.bottom-0 button:has-text("${targetName}")`);
        if (bottomButton && await bottomButton.isVisible()) {
          await bottomButton.click();
          clicked = true;
        } else {
          throw new Error(`Bottom button "${targetName}" not found or not visible`);
        }
      } else if (test.method === 'quick') {
        // Quick menu (only from dashboard)
        if (test.from === 'dashboard') {
          // Scroll to quick menu if needed
          const quickMenuSection = await page.$('.grid.grid-cols-2');
          if (quickMenuSection) {
            await quickMenuSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
          }
          
          const quickButton = await page.$(`.grid button:has-text("${targetName}")`);
          if (quickButton && await quickButton.isVisible()) {
            await quickButton.click();
            clicked = true;
          } else {
            throw new Error(`Quick menu button "${targetName}" not found`);
          }
        }
      } else if (test.method === 'hamburger') {
        // Hamburger menu
        const hamburger = await page.$('button[aria-label="메뉴 열기"]');
        if (hamburger && await hamburger.isVisible()) {
          await hamburger.click();
          await page.waitForTimeout(500);
          
          const menuItem = await page.$(`div[role="dialog"] a:has-text("${targetName}")`);
          if (menuItem) {
            await menuItem.click();
            clicked = true;
          }
        }
      }
      
      if (!clicked) {
        throw new Error('Navigation element not clicked');
      }
      
      await page.waitForTimeout(1500);
      
      // Check result
      const afterUrl = page.url();
      const expectedPath = test.to === 'documents' ? '#documents' : 
                          test.to === 'dashboard' ? '/dashboard' : 
                          `/dashboard/${test.to}`;
      
      const success = afterUrl.includes(expectedPath) || 
                     (test.to === 'dashboard' && afterUrl.endsWith('/dashboard'));
      
      results.push({
        test: test.name,
        method: test.method,
        success: success,
        from: test.from,
        to: test.to,
        beforeUrl: beforeUrl.replace('http://localhost:3002/', ''),
        afterUrl: afterUrl.replace('http://localhost:3002/', '')
      });
      
      console.log(`  To: ${afterUrl.replace('http://localhost:3002/', '')}`);
      console.log(`  Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      
    } catch (error) {
      results.push({
        test: test.name,
        method: test.method,
        success: false,
        from: test.from,
        to: test.to,
        error: error.message
      });
      console.log(`  Result: ❌ ERROR - ${error.message}`);
    }
  }
  
  // Test document tabs
  console.log('\n\n📂 Testing Document Tab Switching...');
  console.log('-' .repeat(40));
  
  await page.goto('http://localhost:3002/dashboard#documents-unified');
  await page.waitForTimeout(1500);
  
  const documentTabs = [
    { name: '내 문서함', id: 'my-documents' },
    { name: '공유 문서함', id: 'shared-documents' },
    { name: '도면 마킹', id: 'markup-documents' },
    { name: '필수 제출 서류', id: 'required-documents' }
  ];
  
  for (const tab of documentTabs) {
    try {
      console.log(`  Testing tab: ${tab.name}`);
      const tabButton = await page.$(`button[role="tab"]:has-text("${tab.name}")`);
      
      if (tabButton && await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(800);
        
        // Check if tab content is visible
        const tabPanelVisible = await page.isVisible(`[role="tabpanel"]`);
        
        results.push({
          test: `문서함 탭: ${tab.name}`,
          success: true,
          type: 'tab'
        });
        console.log(`    ✅ Tab switched successfully`);
      } else {
        results.push({
          test: `문서함 탭: ${tab.name}`,
          success: false,
          type: 'tab'
        });
        console.log(`    ❌ Tab button not found`);
      }
    } catch (e) {
      results.push({
        test: `문서함 탭: ${tab.name}`,
        success: false,
        type: 'tab',
        error: e.message
      });
      console.log(`    ❌ Error: ${e.message}`);
    }
  }
  
  // Test navigation FROM different document tabs
  console.log('\n📑 Testing navigation FROM document tabs...');
  
  for (const tab of documentTabs) {
    console.log(`\n  From "${tab.name}" tab:`);
    
    // Click the tab first
    await page.goto('http://localhost:3002/dashboard#documents-unified');
    await page.waitForTimeout(1000);
    
    const tabButton = await page.$(`button[role="tab"]:has-text("${tab.name}")`);
    if (tabButton && await tabButton.isVisible()) {
      await tabButton.click();
      await page.waitForTimeout(800);
      
      // Try navigating to different pages
      const destinations = [
        { to: 'attendance', name: '출력현황' },
        { to: 'daily-reports', name: '작업일지' }
      ];
      
      for (const dest of destinations) {
        try {
          const navButton = await page.$(`nav.fixed.bottom-0 button:has-text("${dest.name}")`);
          if (navButton && await navButton.isVisible()) {
            await navButton.click();
            await page.waitForTimeout(1000);
            
            const currentUrl = page.url();
            const success = currentUrl.includes(dest.to);
            
            results.push({
              test: `${tab.name} → ${dest.name}`,
              success: success,
              type: 'tab-nav'
            });
            
            console.log(`    ${success ? '✅' : '❌'} ${tab.name} → ${dest.name}`);
            
            // Go back to documents for next test
            await page.goto('http://localhost:3002/dashboard#documents-unified');
            await page.waitForTimeout(800);
            await tabButton.click();
            await page.waitForTimeout(500);
          }
        } catch (e) {
          results.push({
            test: `${tab.name} → ${dest.name}`,
            success: false,
            type: 'tab-nav',
            error: e.message
          });
          console.log(`    ❌ ${tab.name} → ${dest.name}: ${e.message}`);
        }
      }
    }
  }
  
  // Final Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 MOBILE NAVIGATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  const navResults = results.filter(r => !r.type || r.type === 'nav');
  const tabResults = results.filter(r => r.type === 'tab');
  const tabNavResults = results.filter(r => r.type === 'tab-nav');
  
  // Navigation summary
  const navSuccess = navResults.filter(r => r.success).length;
  const navTotal = navResults.length;
  console.log(`\n📍 Page Navigation: ${navSuccess}/${navTotal} (${Math.round(navSuccess/navTotal*100)}%)`);
  
  // Tab switching summary
  const tabSuccess = tabResults.filter(r => r.success).length;
  const tabTotal = tabResults.length;
  console.log(`📑 Tab Switching: ${tabSuccess}/${tabTotal} (${Math.round(tabSuccess/tabTotal*100)}%)`);
  
  // Tab navigation summary
  const tabNavSuccess = tabNavResults.filter(r => r.success).length;
  const tabNavTotal = tabNavResults.length;
  console.log(`🔄 Tab Navigation: ${tabNavSuccess}/${tabNavTotal} (${Math.round(tabNavSuccess/tabNavTotal*100)}%)`);
  
  // Overall summary
  const totalSuccess = results.filter(r => r.success).length;
  const totalTests = results.length;
  const overallRate = Math.round((totalSuccess / totalTests) * 100);
  
  console.log('\n' + '-'.repeat(40));
  console.log(`🎯 Overall: ${totalSuccess}/${totalTests} tests passed (${overallRate}%)`);
  
  // Show failed tests
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(r => {
      console.log(`  - ${r.test}`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });
  }
  
  // Grade the results
  console.log('\n' + '='.repeat(60));
  if (overallRate === 100) {
    console.log('🎉 PERFECT! All navigation tests passed!');
  } else if (overallRate >= 90) {
    console.log('✅ EXCELLENT! Navigation working very well.');
  } else if (overallRate >= 80) {
    console.log('👍 GOOD! Most navigation paths working.');
  } else if (overallRate >= 70) {
    console.log('📈 ACCEPTABLE. Some improvements needed.');
  } else if (overallRate >= 60) {
    console.log('⚠️ NEEDS WORK. Several navigation issues.');
  } else {
    console.log('❌ CRITICAL. Major navigation problems.');
  }
  
  console.log('\n🔍 Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  process.exit(failedTests.length > 0 ? 1 : 0);
}

// Helper function to get button name
function getButtonName(path) {
  const nameMap = {
    'dashboard': '빠른메뉴',
    'attendance': '출력정보',
    'daily-reports': '작업일지',
    'documents': '문서함',
    'site-info': '현장정보'
  };
  return nameMap[path] || path;
}

testMobileAllNavigation().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});