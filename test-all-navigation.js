const { chromium, devices } = require('playwright');

async function testAllNavigation() {
  console.log('🧪 Starting comprehensive navigation test...\n');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  
  // Test both desktop and mobile viewports
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080, isMobile: false },
    { name: 'Mobile', device: devices['iPhone 13'], isMobile: true }
  ];
  
  const allResults = {};
  
  for (const viewport of viewports) {
    console.log(`\n📱 Testing ${viewport.name} Navigation`);
    console.log('=' .repeat(60));
    
    const context = await browser.newContext(
      viewport.device || { viewport: { width: viewport.width, height: viewport.height } }
    );
    const page = await context.newPage();
    
    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForTimeout(2000);
    
    if (!page.url().includes('dashboard')) {
      await page.waitForSelector('#email', { timeout: 5000 });
      await page.fill('#email', 'manager@inopnc.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      console.log('✅ Logged in successfully\n');
    }
    
    const results = [];
    
    // Define all navigation paths
    const navigationPaths = [
      { from: 'dashboard', to: 'dashboard', name: '홈 → 홈 (빠른메뉴)', nav: 'quick-home' },
      { from: 'dashboard', to: 'dashboard/attendance', name: '홈 → 출력현황', nav: 'all' },
      { from: 'dashboard', to: 'dashboard/daily-reports', name: '홈 → 작업일지', nav: 'all' },
      { from: 'dashboard', to: 'dashboard#documents-unified', name: '홈 → 문서함', nav: 'all' },
      { from: 'dashboard', to: 'dashboard/site-info', name: '홈 → 현장정보', nav: 'quick' },
      { from: 'dashboard', to: 'dashboard/profile', name: '홈 → 내정보', nav: 'bottom' },
      
      { from: 'dashboard/attendance', to: 'dashboard', name: '출력현황 → 홈', nav: 'all' },
      { from: 'dashboard/attendance', to: 'dashboard/daily-reports', name: '출력현황 → 작업일지', nav: 'all' },
      { from: 'dashboard/attendance', to: 'dashboard#documents-unified', name: '출력현황 → 문서함', nav: 'all' },
      { from: 'dashboard/attendance', to: 'dashboard/profile', name: '출력현황 → 내정보', nav: 'bottom' },
      
      { from: 'dashboard/daily-reports', to: 'dashboard', name: '작업일지 → 홈', nav: 'all' },
      { from: 'dashboard/daily-reports', to: 'dashboard/attendance', name: '작업일지 → 출력현황', nav: 'all' },
      { from: 'dashboard/daily-reports', to: 'dashboard#documents-unified', name: '작업일지 → 문서함', nav: 'all' },
      { from: 'dashboard/daily-reports', to: 'dashboard/profile', name: '작업일지 → 내정보', nav: 'bottom' },
      
      { from: 'dashboard#documents-unified', to: 'dashboard', name: '문서함 → 홈', nav: 'all' },
      { from: 'dashboard#documents-unified', to: 'dashboard/attendance', name: '문서함 → 출력현황', nav: 'all' },
      { from: 'dashboard#documents-unified', to: 'dashboard/daily-reports', name: '문서함 → 작업일지', nav: 'all' },
      { from: 'dashboard#documents-unified', to: 'dashboard/profile', name: '문서함 → 내정보', nav: 'bottom' },
      
      { from: 'dashboard/site-info', to: 'dashboard', name: '현장정보 → 홈', nav: 'all' },
      { from: 'dashboard/site-info', to: 'dashboard/attendance', name: '현장정보 → 출력현황', nav: 'all' },
      { from: 'dashboard/site-info', to: 'dashboard/daily-reports', name: '현장정보 → 작업일지', nav: 'all' },
      { from: 'dashboard/site-info', to: 'dashboard#documents-unified', name: '현장정보 → 문서함', nav: 'all' },
      { from: 'dashboard/site-info', to: 'dashboard/profile', name: '현장정보 → 내정보', nav: 'bottom' },
      
      { from: 'dashboard/profile', to: 'dashboard', name: '내정보 → 홈', nav: 'all' },
      { from: 'dashboard/profile', to: 'dashboard/attendance', name: '내정보 → 출력현황', nav: 'all' },
      { from: 'dashboard/profile', to: 'dashboard/daily-reports', name: '내정보 → 작업일지', nav: 'all' },
      { from: 'dashboard/profile', to: 'dashboard#documents-unified', name: '내정보 → 문서함', nav: 'all' },
    ];
    
    // Test each navigation path
    for (const navPath of navigationPaths) {
      // Skip certain tests based on viewport
      if (navPath.nav === 'bottom' && !viewport.isMobile) continue;
      if (navPath.nav === 'quick' && navPath.from !== 'dashboard') continue;
      
      console.log(`\n📍 Testing: ${navPath.name}`);
      
      // Navigate to starting point
      const startUrl = `http://localhost:3000/${navPath.from}`;
      await page.goto(startUrl);
      await page.waitForTimeout(1500);
      
      const beforeUrl = page.url();
      console.log(`  From: ${beforeUrl.replace('http://localhost:3000/', '')}`);
      
      try {
        let clicked = false;
        const targetName = getMenuName(navPath.to);
        
        // Try different navigation methods based on viewport and availability
        if (viewport.isMobile) {
          // Mobile: Try bottom navigation first
          if (navPath.nav === 'all' || navPath.nav === 'bottom') {
            const bottomButton = await page.$(`nav.fixed.bottom-0 button:has-text("${targetName}")`);
            if (bottomButton && await bottomButton.isVisible()) {
              console.log(`  [Bottom Nav] Clicking "${targetName}"...`);
              await bottomButton.click();
              clicked = true;
            }
          }
          
          // Mobile: Try hamburger menu if bottom nav didn't work
          if (!clicked && navPath.nav === 'all') {
            try {
              const hamburger = await page.$('button[aria-label="메뉴 열기"], button:has(svg.h-6.w-6)');
              if (hamburger && await hamburger.isVisible()) {
                console.log(`  [Hamburger] Opening menu...`);
                await hamburger.click();
                await page.waitForTimeout(300);
                
                const menuItem = await page.$(`div[role="dialog"] a:has-text("${targetName}"), div[role="dialog"] button:has-text("${targetName}")`);
                if (menuItem) {
                  console.log(`  [Hamburger] Clicking "${targetName}"...`);
                  await menuItem.click();
                  clicked = true;
                }
              }
            } catch (e) {
              // Hamburger menu not available
            }
          }
          
          // Mobile: Quick menu (only from dashboard)
          if (!clicked && navPath.nav === 'quick' && navPath.from === 'dashboard') {
            const quickButton = await page.$(`.grid button:has-text("${targetName}")`);
            if (quickButton && await quickButton.isVisible()) {
              console.log(`  [Quick Menu] Clicking "${targetName}"...`);
              await quickButton.click();
              clicked = true;
            }
          }
        } else {
          // Desktop: Try sidebar
          if (navPath.nav === 'all') {
            const sidebarLink = await page.$(`nav.hidden.lg\\:block a:has-text("${targetName}"), nav.hidden.lg\\:block button:has-text("${targetName}")`);
            if (sidebarLink && await sidebarLink.isVisible()) {
              console.log(`  [Sidebar] Clicking "${targetName}"...`);
              await sidebarLink.click();
              clicked = true;
            }
          }
          
          // Desktop: Quick menu (only from dashboard)
          if (!clicked && navPath.nav === 'quick' && navPath.from === 'dashboard') {
            const quickButton = await page.$(`.grid button:has-text("${targetName}")`);
            if (quickButton && await quickButton.isVisible()) {
              console.log(`  [Quick Menu] Clicking "${targetName}"...`);
              await quickButton.click();
              clicked = true;
            }
          }
        }
        
        if (!clicked) {
          throw new Error(`Could not find navigation element for "${targetName}"`);
        }
        
        await page.waitForTimeout(1500);
        
        // Check result
        const afterUrl = page.url();
        const expectedUrl = `http://localhost:3000/${navPath.to}`;
        const success = afterUrl === expectedUrl || 
                       (navPath.to.includes('#') && afterUrl.includes(navPath.to.split('#')[1])) ||
                       (navPath.to === 'dashboard' && afterUrl.endsWith('/dashboard'));
        
        results.push({
          test: navPath.name,
          success: success,
          from: navPath.from,
          to: navPath.to,
          actualUrl: afterUrl.replace('http://localhost:3000/', ''),
          expectedUrl: navPath.to
        });
        
        console.log(`  To: ${afterUrl.replace('http://localhost:3000/', '')}`);
        console.log(`  Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
        
      } catch (error) {
        results.push({
          test: navPath.name,
          success: false,
          from: navPath.from,
          to: navPath.to,
          error: error.message
        });
        console.log(`  Result: ❌ ERROR - ${error.message}`);
      }
    }
    
    // Test document tab switching
    console.log('\n\n📂 Testing Document Tab Switching...');
    console.log('-' .repeat(40));
    
    await page.goto('http://localhost:3000/dashboard#documents-unified');
    await page.waitForTimeout(1500);
    
    const documentTabs = ['내 문서함', '공유 문서함', '도면 마킹', '필수 제출 서류'];
    
    for (const tab of documentTabs) {
      try {
        const tabButton = await page.$(`button[role="tab"]:has-text("${tab}")`);
        if (tabButton && await tabButton.isVisible()) {
          await tabButton.click();
          await page.waitForTimeout(500);
          console.log(`  ✅ Tab switch: "${tab}"`);
          results.push({
            test: `문서함 탭 전환: ${tab}`,
            success: true
          });
        } else {
          console.log(`  ❌ Tab not found: "${tab}"`);
          results.push({
            test: `문서함 탭 전환: ${tab}`,
            success: false
          });
        }
      } catch (e) {
        console.log(`  ❌ Tab error: "${tab}" - ${e.message}`);
        results.push({
          test: `문서함 탭 전환: ${tab}`,
          success: false,
          error: e.message
        });
      }
    }
    
    allResults[viewport.name] = results;
    await context.close();
  }
  
  // Final summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE NAVIGATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  for (const [viewportName, results] of Object.entries(allResults)) {
    console.log(`\n📱 ${viewportName} Results:`);
    console.log('-'.repeat(40));
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const successRate = Math.round((successCount / results.length) * 100);
    
    console.log(`✅ Passed: ${successCount}/${results.length}`);
    console.log(`❌ Failed: ${failCount}/${results.length}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (failCount > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.test}`);
        if (r.error) console.log(`    Error: ${r.error}`);
        if (r.actualUrl && r.expectedUrl && r.actualUrl !== r.expectedUrl) {
          console.log(`    Expected: ${r.expectedUrl}`);
          console.log(`    Actual: ${r.actualUrl}`);
        }
      });
    }
  }
  
  // Overall summary
  const allTestResults = Object.values(allResults).flat();
  const totalSuccess = allTestResults.filter(r => r.success).length;
  const totalTests = allTestResults.length;
  const overallRate = Math.round((totalSuccess / totalTests) * 100);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 OVERALL RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalSuccess}`);
  console.log(`Failed: ${totalTests - totalSuccess}`);
  console.log(`Overall Success Rate: ${overallRate}%`);
  
  if (overallRate === 100) {
    console.log('\n🎉 PERFECT! All navigation tests passed!');
  } else if (overallRate >= 90) {
    console.log('\n✅ EXCELLENT! Navigation is working very well.');
  } else if (overallRate >= 75) {
    console.log('\n👍 GOOD! Most navigation paths are working.');
  } else if (overallRate >= 50) {
    console.log('\n⚠️ NEEDS IMPROVEMENT. Several navigation issues found.');
  } else {
    console.log('\n❌ CRITICAL. Many navigation paths are broken.');
  }
  
  console.log('\n🔍 Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  process.exit(totalTests - totalSuccess > 0 ? 1 : 0);
}

// Helper function to get menu name from path
function getMenuName(path) {
  if (path.includes('attendance')) return '출력현황';
  if (path.includes('daily-reports')) return '작업일지';
  if (path.includes('documents')) return '문서함';
  if (path.includes('site-info')) return '현장정보';
  if (path.includes('profile')) return '내정보';
  if (path === 'dashboard') return '홈';
  return '홈';
}

testAllNavigation().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});