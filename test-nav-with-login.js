const { chromium } = require('playwright');

async function testNavigationWithLogin() {
  console.log('🚀 Starting complete navigation test with login...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  // Step 1: Login
  console.log('🔐 Step 1: Logging in...');
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForTimeout(2000);
  
  // Check if already redirected to dashboard (already logged in)
  if (page.url().includes('dashboard')) {
    console.log('✅ Already logged in, proceeding to tests...\n');
  } else {
    // Need to login
    console.log('  Filling login form...');
    
    // Wait for form elements
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.waitForSelector('#password', { timeout: 5000 });
    
    // Fill and submit
    await page.fill('#email', 'manager@inopnc.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    console.log('  Waiting for dashboard...');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✅ Successfully logged in!\n');
  }
  
  await page.waitForTimeout(2000);
  
  // Step 2: Test navigation scenarios
  console.log('📋 Step 2: Testing navigation scenarios...');
  
  const tests = [
    { from: 'dashboard', via: 'sidebar', name: '홈 > 사이드바 문서함' },
    { from: 'dashboard', via: 'bottom', name: '홈 > 하단바 문서함' },
    { from: 'dashboard', via: 'quick', name: '홈 > 빠른메뉴 문서함' },
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
    console.log(`  Starting from: ${beforeUrl.replace('http://localhost:3000', '')}`);
    
    // Take screenshot before
    await page.screenshot({ path: `test-before-${test.from.replace('/', '-')}-${test.via}.png` });
    
    // Click documents button based on location
    try {
      let clicked = false;
      
      if (test.via === 'sidebar') {
        // Try desktop sidebar first
        const desktopVisible = await page.isVisible('nav.hidden.lg\\:block');
        if (desktopVisible) {
          console.log('  [Desktop] Clicking sidebar...');
          await page.click('nav.hidden.lg\\:block a:has-text("문서함"), nav.hidden.lg\\:block button:has-text("문서함")');
          clicked = true;
        } else {
          // Mobile - open hamburger menu
          console.log('  [Mobile] Opening menu...');
          await page.click('button[aria-label="메뉴 열기"], button.lg\\:hidden:has(svg)');
          await page.waitForTimeout(500);
          console.log('  [Mobile] Clicking sidebar menu item...');
          await page.click('div[role="dialog"] a:has-text("문서함"), div[role="dialog"] button:has-text("문서함")');
          clicked = true;
        }
      } else if (test.via === 'bottom') {
        console.log('  Clicking bottom navigation...');
        await page.click('nav.fixed.bottom-0 button:has-text("문서함")');
        clicked = true;
      } else if (test.via === 'quick') {
        console.log('  Clicking quick menu button...');
        // Quick menu in home tab
        const quickButton = await page.$('.grid button:has-text("문서함")');
        if (quickButton) {
          await quickButton.click();
          clicked = true;
        } else {
          throw new Error('Quick menu button not found');
        }
      }
      
      if (!clicked) {
        throw new Error('Could not find navigation element');
      }
      
      await page.waitForTimeout(2000);
      
      // Take screenshot after
      await page.screenshot({ path: `test-after-${test.from.replace('/', '-')}-${test.via}.png` });
      
      // Check results
      const afterUrl = page.url();
      const urlChanged = beforeUrl !== afterUrl;
      const hasDocumentsInUrl = afterUrl.includes('documents') || afterUrl.includes('#documents');
      
      // Check for documents UI elements with more specific selectors
      let documentsVisible = false;
      const documentSelectors = [
        'button[role="tab"]:has-text("내 문서함")',
        'button[role="tab"]:has-text("공유 문서함")',
        'button[role="tab"]:has-text("도면 마킹")',
        'button[role="tab"]:has-text("필수 제출 서류")',
        'h2:has-text("내 문서함")',
        'h2:has-text("공유 문서함")',
        'div[role="tablist"]'
      ];
      
      for (const selector of documentSelectors) {
        try {
          if (await page.isVisible(selector, { timeout: 500 })) {
            documentsVisible = true;
            console.log(`  Found: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      const success = hasDocumentsInUrl || documentsVisible;
      
      results.push({
        test: test.name,
        success: success,
        beforeUrl: beforeUrl.replace('http://localhost:3000', ''),
        afterUrl: afterUrl.replace('http://localhost:3000', ''),
        urlChanged: urlChanged,
        hasDocumentsInUrl: hasDocumentsInUrl,
        documentsVisible: documentsVisible
      });
      
      console.log(`  Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`  After URL: ${afterUrl.replace('http://localhost:3000', '')}`);
      console.log(`  URL changed: ${urlChanged}`);
      console.log(`  Documents in URL: ${hasDocumentsInUrl}`);
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
  
  // Step 3: Test navigation FROM documents tabs
  console.log('\n\n📂 Step 3: Testing navigation FROM document tabs...');
  
  const documentTabs = [
    { tab: '내 문서함', name: 'my-documents' },
    { tab: '공유 문서함', name: 'shared-documents' },
    { tab: '도면 마킹', name: 'markup-documents' },
    { tab: '필수 제출 서류', name: 'required-documents' }
  ];
  
  for (const docTab of documentTabs) {
    console.log(`\n📑 Testing from "${docTab.tab}" tab...`);
    
    // Go to documents page
    await page.goto('http://localhost:3000/dashboard#documents-unified');
    await page.waitForTimeout(2000);
    
    // Click on the specific tab
    try {
      const tabButton = await page.$(`button[role="tab"]:has-text("${docTab.tab}")`);
      if (tabButton) {
        await tabButton.click();
        await page.waitForTimeout(1000);
        console.log(`  ✅ Switched to ${docTab.tab} tab`);
        
        // Try navigating away
        console.log(`  Testing navigation to 출력현황...`);
        const beforeUrl = page.url();
        
        // Try bottom nav first (more reliable on mobile)
        const bottomNav = await page.$('nav.fixed.bottom-0 button:has-text("출력현황")');
        if (bottomNav) {
          await bottomNav.click();
          await page.waitForTimeout(1500);
          const afterUrl = page.url();
          const navigated = afterUrl.includes('attendance');
          console.log(`    ${navigated ? '✅' : '❌'} Navigation ${navigated ? 'successful' : 'failed'}`);
          console.log(`    URL: ${afterUrl.replace('http://localhost:3000', '')}`);
        } else {
          console.log(`    ⚠️ Could not find navigation button`);
        }
      } else {
        console.log(`  ⚠️ Could not find tab: ${docTab.tab}`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Passed: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);
  console.log(`📈 Success Rate: ${Math.round((successCount / results.length) * 100)}%`);
  
  console.log('\n📋 Detailed Results:');
  console.log('-'.repeat(60));
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    console.log(`${i + 1}. ${status} ${r.test}`);
    if (!r.success) {
      if (r.error) {
        console.log(`     └─ Error: ${r.error}`);
      } else {
        console.log(`     └─ Navigation failed`);
        console.log(`        - URL changed: ${r.urlChanged}`);
        console.log(`        - Documents in URL: ${r.hasDocumentsInUrl}`);
        console.log(`        - Documents UI visible: ${r.documentsVisible}`);
      }
    }
  });
  
  // Screenshots info
  console.log('\n📸 Screenshots saved for debugging');
  console.log('   Check test-before-*.png and test-after-*.png files');
  
  // Keep browser open
  console.log('\n🔍 Browser will close in 15 seconds...');
  await page.waitForTimeout(15000);
  
  await browser.close();
  
  // Exit with appropriate code
  const exitCode = failCount > 0 ? 1 : 0;
  console.log(`\n🏁 Test completed with exit code: ${exitCode}`);
  process.exit(exitCode);
}

testNavigationWithLogin().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});