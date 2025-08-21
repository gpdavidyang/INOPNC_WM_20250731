const { chromium, devices } = require('playwright');

async function testNavigationMobile() {
  console.log('📱 Starting mobile navigation test...\n');
  
  const browser = await chromium.launch({ headless: false });
  
  // Use iPhone 13 viewport for mobile testing
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'ko-KR'
  });
  
  const page = await context.newPage();
  
  const results = [];
  
  // Step 1: Login
  console.log('🔐 Step 1: Logging in with mobile viewport...');
  console.log('  Viewport: 390x844 (iPhone 13)');
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForTimeout(2000);
  
  // Check if already redirected to dashboard
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
  
  // Verify bottom navigation is visible
  console.log('🔍 Checking mobile UI elements...');
  const bottomNavVisible = await page.isVisible('nav.fixed.bottom-0');
  const sidebarHidden = await page.isHidden('nav.hidden.lg\\:block');
  console.log(`  Bottom navigation visible: ${bottomNavVisible ? '✅' : '❌'}`);
  console.log(`  Desktop sidebar hidden: ${sidebarHidden ? '✅' : '❌'}`);
  console.log('');
  
  // Step 2: Test navigation scenarios
  console.log('📋 Step 2: Testing mobile navigation scenarios...');
  
  const tests = [
    { from: 'dashboard', via: 'bottom', name: '홈 > 하단바 문서함' },
    { from: 'dashboard', via: 'hamburger', name: '홈 > 햄버거메뉴 문서함' },
    { from: 'dashboard', via: 'quick', name: '홈 > 빠른메뉴 문서함' },
    { from: 'dashboard/attendance', via: 'bottom', name: '출력현황 > 하단바 문서함' },
    { from: 'dashboard/attendance', via: 'hamburger', name: '출력현황 > 햄버거메뉴 문서함' },
    { from: 'dashboard/daily-reports', via: 'bottom', name: '작업일지 > 하단바 문서함' },
    { from: 'dashboard/daily-reports', via: 'hamburger', name: '작업일지 > 햄버거메뉴 문서함' },
    { from: 'dashboard/site-info', via: 'bottom', name: '현장정보 > 하단바 문서함' },
    { from: 'dashboard/site-info', via: 'hamburger', name: '현장정보 > 햄버거메뉴 문서함' },
  ];
  
  for (const test of tests) {
    console.log(`\n📝 Testing: ${test.name}`);
    
    // Navigate to starting page
    const startUrl = `http://localhost:3000/${test.from}`;
    await page.goto(startUrl);
    await page.waitForTimeout(2000);
    
    const beforeUrl = page.url();
    console.log(`  Starting from: ${beforeUrl.replace('http://localhost:3000', '')}`);
    
    try {
      let clicked = false;
      
      if (test.via === 'bottom') {
        // Bottom navigation - wait for it to be visible
        console.log('  Waiting for bottom navigation...');
        await page.waitForSelector('nav.fixed.bottom-0', { state: 'visible', timeout: 5000 });
        
        // Find and click documents button
        const bottomButton = await page.$('nav.fixed.bottom-0 button:has-text("문서함")');
        if (bottomButton) {
          const isVisible = await bottomButton.isVisible();
          console.log(`  Bottom button visible: ${isVisible}`);
          if (isVisible) {
            console.log('  Clicking bottom navigation button...');
            await bottomButton.click();
            clicked = true;
          } else {
            // Try with force click
            console.log('  Trying force click...');
            await bottomButton.click({ force: true });
            clicked = true;
          }
        } else {
          throw new Error('Bottom navigation button not found');
        }
        
      } else if (test.via === 'hamburger') {
        // Hamburger menu
        console.log('  Opening hamburger menu...');
        const hamburger = await page.$('button[aria-label="메뉴 열기"], button:has(svg.h-6.w-6)');
        if (hamburger) {
          await hamburger.click();
          await page.waitForTimeout(500);
          
          // Wait for menu to open
          await page.waitForSelector('div[role="dialog"]', { state: 'visible', timeout: 5000 });
          
          console.log('  Clicking menu item...');
          await page.click('div[role="dialog"] a:has-text("문서함"), div[role="dialog"] button:has-text("문서함")');
          clicked = true;
        } else {
          throw new Error('Hamburger menu button not found');
        }
        
      } else if (test.via === 'quick') {
        // Quick menu in home tab
        console.log('  Clicking quick menu button...');
        const quickButton = await page.$('.grid button:has-text("문서함")');
        if (quickButton && await quickButton.isVisible()) {
          await quickButton.click();
          clicked = true;
        } else {
          throw new Error('Quick menu button not found or not visible');
        }
      }
      
      if (!clicked) {
        throw new Error('Could not click navigation element');
      }
      
      await page.waitForTimeout(2000);
      
      // Check results
      const afterUrl = page.url();
      const urlChanged = beforeUrl !== afterUrl;
      const hasDocumentsInUrl = afterUrl.includes('documents') || afterUrl.includes('#documents');
      
      // Check for documents UI elements
      let documentsVisible = false;
      const documentSelectors = [
        'button[role="tab"]:has-text("내 문서함")',
        'button[role="tab"]:has-text("공유 문서함")',
        'button[role="tab"]:has-text("도면 마킹")',
        'button[role="tab"]:has-text("필수 제출 서류")'
      ];
      
      for (const selector of documentSelectors) {
        try {
          if (await page.isVisible(selector, { timeout: 500 })) {
            documentsVisible = true;
            break;
          }
        } catch (e) {
          // Continue
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
      console.log(`  Documents in URL: ${hasDocumentsInUrl}`);
      console.log(`  Documents tabs visible: ${documentsVisible}`);
      
    } catch (error) {
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
      console.log(`  Result: ❌ ERROR - ${error.message}`);
    }
  }
  
  // Step 3: Test navigation FROM document tabs
  console.log('\n\n📂 Step 3: Testing navigation FROM document tabs (mobile)...');
  
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
      if (tabButton && await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(1000);
        console.log(`  ✅ Switched to ${docTab.tab} tab`);
        
        // Test navigation away using bottom nav
        console.log(`  Testing navigation to 출력현황...`);
        const beforeUrl = page.url();
        
        const bottomNav = await page.$('nav.fixed.bottom-0 button:has-text("출력현황")');
        if (bottomNav && await bottomNav.isVisible()) {
          await bottomNav.click();
          await page.waitForTimeout(1500);
          
          const afterUrl = page.url();
          const navigated = afterUrl.includes('attendance');
          console.log(`    ${navigated ? '✅' : '❌'} Navigation ${navigated ? 'successful' : 'failed'}`);
          console.log(`    From: ${beforeUrl.replace('http://localhost:3000', '')}`);
          console.log(`    To: ${afterUrl.replace('http://localhost:3000', '')}`);
        } else {
          console.log(`    ⚠️ Bottom navigation not visible`);
        }
        
        // Test navigation back to documents
        console.log(`  Testing navigation back to 문서함...`);
        const docNav = await page.$('nav.fixed.bottom-0 button:has-text("문서함")');
        if (docNav && await docNav.isVisible()) {
          await docNav.click();
          await page.waitForTimeout(1500);
          
          const finalUrl = page.url();
          const backToDocuments = finalUrl.includes('documents') || finalUrl.includes('#documents');
          console.log(`    ${backToDocuments ? '✅' : '❌'} Return navigation ${backToDocuments ? 'successful' : 'failed'}`);
        }
      } else {
        console.log(`  ⚠️ Tab not found or not visible: ${docTab.tab}`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 MOBILE NAVIGATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Passed: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);
  console.log(`📈 Success Rate: ${Math.round((successCount / results.length) * 100)}%`);
  
  if (successCount === results.length) {
    console.log('\n🎉 Perfect! All tests passed!');
  } else if (successCount >= results.length * 0.8) {
    console.log('\n👍 Good! Most tests passed.');
  } else if (successCount >= results.length * 0.5) {
    console.log('\n⚠️ Some issues found. Please review failed tests.');
  } else {
    console.log('\n❌ Many tests failed. Navigation needs fixing.');
  }
  
  console.log('\n📋 Detailed Results:');
  console.log('-'.repeat(60));
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    console.log(`${i + 1}. ${status} ${r.test}`);
    if (!r.success) {
      if (r.error) {
        console.log(`     └─ Error: ${r.error}`);
      } else {
        console.log(`     └─ Navigation did not reach documents page`);
      }
    }
  });
  
  // Keep browser open
  console.log('\n🔍 Browser will close in 10 seconds...');
  console.log('   (Mobile viewport: 390x844)');
  await page.waitForTimeout(10000);
  
  await browser.close();
  
  // Exit with appropriate code
  const exitCode = failCount > 0 ? 1 : 0;
  console.log(`\n🏁 Test completed with exit code: ${exitCode}`);
  process.exit(exitCode);
}

testNavigationMobile().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});