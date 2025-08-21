const { chromium, devices } = require('playwright');

async function testDocumentsNavigationFinal() {
  console.log('🔍 Final Documents Navigation Test - Targeted Issue Check\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better visibility
  });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'ko-KR'
  });
  const page = await context.newPage();
  
  try {
    // Step 1: Login (try both servers)
    console.log('🔐 Step 1: Login process...');
    let loginSuccess = false;
    
    for (const port of [3000, 3002]) {
      try {
        console.log(`Trying server on port ${port}...`);
        await page.goto(`http://localhost:${port}/auth/login`, { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        if (page.url().includes('dashboard')) {
          console.log(`✅ Already logged in on port ${port}`);
          loginSuccess = true;
          break;
        }
        
        // Try to find and fill login form
        const emailField = await page.$('#email');
        if (emailField) {
          await page.fill('#email', 'manager@inopnc.com');
          await page.fill('#password', 'password123');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(3000);
          
          if (page.url().includes('dashboard')) {
            console.log(`✅ Login successful on port ${port}`);
            loginSuccess = true;
            break;
          }
        }
      } catch (e) {
        console.log(`❌ Port ${port} failed: ${e.message}`);
      }
    }
    
    if (!loginSuccess) {
      console.log('❌ Could not login on any port');
      return;
    }
    
    // Step 2: Navigate to documents-unified
    console.log('\n📑 Step 2: Navigate to documents...');
    const currentPort = new URL(page.url()).port || (page.url().includes(':3002') ? '3002' : '3000');
    await page.goto(`http://localhost:${currentPort}/dashboard#documents-unified`);
    await page.waitForTimeout(3000);
    
    console.log(`Current URL: ${page.url()}`);
    
    // Step 3: Look for document tab buttons (NOT role="tab" but regular buttons)
    console.log('\n📊 Step 3: Checking document tab buttons...');
    
    // Look for the specific button text patterns from DocumentsTabUnified
    const tabButtons = [
      '내문서함',
      '공유문서함', 
      '도면마킹',
      '필수 제출 서류'
    ];
    
    let foundTabs = [];
    for (const tabText of tabButtons) {
      const button = await page.$(`button:has-text("${tabText}")`);
      if (button && await button.isVisible()) {
        foundTabs.push(tabText);
      }
    }
    
    console.log(`Found document tabs: ${foundTabs.join(', ')}`);
    
    if (foundTabs.length === 0) {
      console.log('❌ No document tabs found - DocumentsTabUnified component not loading');
      return;
    }
    
    // Step 4: Click on "내문서함" tab
    console.log('\\n📝 Step 4: Click "내문서함" tab...');
    const myDocsButton = await page.$('button:has-text("내문서함")');
    
    if (myDocsButton && await myDocsButton.isVisible()) {
      await myDocsButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked "내문서함" tab');
      
      // Check if tab is now active (should have blue background)
      const isActive = await page.$eval('button:has-text("내문서함")', el => 
        el.classList.contains('bg-blue-600')
      );
      console.log(`Tab active state: ${isActive ? '✅ Active' : '❌ Not active'}`);
      
      // Step 5: Test bottom navigation
      console.log('\\n🔍 Step 5: Test bottom navigation from "내문서함"...');
      
      const bottomNav = await page.$('nav.fixed.bottom-0');
      if (bottomNav && await bottomNav.isVisible()) {
        console.log('✅ Bottom navigation visible');
        
        // List all bottom nav buttons
        const bottomButtons = await page.$$('nav.fixed.bottom-0 button');
        console.log(`Found ${bottomButtons.length} bottom navigation buttons:`);
        
        for (let i = 0; i < bottomButtons.length; i++) {
          const text = await bottomButtons[i].textContent();
          console.log(`  ${i + 1}. "${text}"`);
        }
        
        // Test clicking "빠른메뉴" to navigate away from documents
        console.log('\\n🚀 Step 6: Test "빠른메뉴" navigation...');
        const quickMenuBtn = await page.$('nav.fixed.bottom-0 button:has-text("빠른메뉴")');
        
        if (quickMenuBtn && await quickMenuBtn.isVisible()) {
          const beforeUrl = page.url();
          console.log(`Before click: ${beforeUrl}`);
          
          await quickMenuBtn.click();
          await page.waitForTimeout(3000); // Wait longer for navigation
          
          const afterUrl = page.url();
          console.log(`After click: ${afterUrl}`);
          
          // Check if we navigated away from documents
          const navigationWorked = afterUrl.includes('/dashboard') && !afterUrl.includes('#documents');
          console.log(`\\n🎯 RESULT: ${navigationWorked ? '✅ SUCCESS' : '❌ FAILED'}`);
          
          if (navigationWorked) {
            console.log('✅ Bottom navigation from documents tab is working correctly!');
          } else {
            console.log('❌ CONFIRMED ISSUE: Bottom navigation from documents tab is not working');
            console.log('   - User clicks bottom navigation but remains on documents page');
            console.log('   - This is the exact issue the user reported');
          }
          
          // Test going back to documents to verify navigation works both ways
          console.log('\\n🔄 Step 7: Test return navigation to documents...');
          const docsBtn = await page.$('nav.fixed.bottom-0 button:has-text("문서함")');
          
          if (docsBtn && await docsBtn.isVisible()) {
            await docsBtn.click();
            await page.waitForTimeout(2000);
            
            const returnUrl = page.url();
            const returnWorked = returnUrl.includes('#documents');
            console.log(`Return to documents: ${returnWorked ? '✅ SUCCESS' : '❌ FAILED'} (${returnUrl})`);
          }
          
        } else {
          console.log('❌ "빠른메뉴" button not found in bottom navigation');
        }
        
      } else {
        console.log('❌ Bottom navigation not found or not visible');
      }
      
    } else {
      console.log('❌ "내문서함" button not found or not visible');
    }
    
  } catch (e) {
    console.error('❌ Test error:', e.message);
  }
  
  console.log('\\n🏁 Test complete. Browser will close in 15 seconds...');
  console.log('   Please observe if the navigation issue has been identified.');
  await page.waitForTimeout(15000);
  await browser.close();
}

testDocumentsNavigationFinal();