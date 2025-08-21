const { chromium, devices } = require('playwright');

async function testDocumentsNavigation() {
  console.log('📂 Testing Documents Navigation Issues...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'ko-KR'
  });
  const page = await context.newPage();
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3002/auth/login');
    await page.waitForTimeout(2000);
    
    if (!page.url().includes('dashboard')) {
      await page.fill('#email', 'manager@inopnc.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');
    }
    console.log('✅ Logged in successfully\n');
    
    // Go to documents page
    console.log('📋 Step 1: Going to documents page...');
    await page.goto('http://localhost:3002/dashboard#documents-unified');
    await page.waitForTimeout(2000);
    
    // Check if we're on documents page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check document tabs
    console.log('\n📑 Step 2: Checking document tabs...');
    const tabButtons = await page.$$('button[role="tab"]');
    console.log(`Found ${tabButtons.length} document tabs`);
    
    for (let i = 0; i < tabButtons.length; i++) {
      const tabText = await tabButtons[i].textContent();
      const isSelected = await tabButtons[i].getAttribute('aria-selected');
      console.log(`  Tab ${i + 1}: "${tabText}" (selected: ${isSelected})`);
    }
    
    // Click on "내 문서함" tab
    console.log('\n📝 Step 3: Clicking "내 문서함" tab...');
    const myDocsTab = await page.$('button[role="tab"]:has-text("내 문서함")');
    
    if (myDocsTab) {
      await myDocsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked "내 문서함" tab');
      
      // Check tab panel content
      const tabPanel = await page.isVisible('[role="tabpanel"]');
      console.log(`Tab panel visible: ${tabPanel ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ "내 문서함" tab not found');
      return;
    }
    
    // Check bottom navigation visibility and functionality
    console.log('\n🔍 Step 4: Testing bottom navigation from "내 문서함"...');
    
    const bottomNav = await page.$('nav.fixed.bottom-0');
    if (bottomNav) {
      const isVisible = await bottomNav.isVisible();
      console.log(`Bottom navigation visible: ${isVisible ? '✅' : '❌'}`);
      
      if (isVisible) {
        // List all bottom nav buttons
        const bottomButtons = await page.$$('nav.fixed.bottom-0 button');
        console.log(`Found ${bottomButtons.length} bottom navigation buttons:`);
        
        for (let i = 0; i < bottomButtons.length; i++) {
          const buttonText = await bottomButtons[i].textContent();
          const buttonVisible = await bottomButtons[i].isVisible();
          const buttonEnabled = await bottomButtons[i].isEnabled();
          console.log(`  Button ${i + 1}: "${buttonText}" (visible: ${buttonVisible}, enabled: ${buttonEnabled})`);
        }
        
        // Test navigation to different pages
        const testButtons = [
          { name: '빠른메뉴', expected: 'dashboard' },
          { name: '출력정보', expected: 'attendance' },
          { name: '작업일지', expected: 'daily-reports' },
          { name: '현장정보', expected: 'site-info' }
        ];
        
        for (const test of testButtons) {
          console.log(`\n🔄 Testing navigation to "${test.name}"...`);
          
          // Go back to documents/my-documents first
          await page.goto('http://localhost:3002/dashboard#documents-unified');
          await page.waitForTimeout(1000);
          
          // Click the tab again
          const myDocsTabAgain = await page.$('button[role="tab"]:has-text("내 문서함")');
          if (myDocsTabAgain) {
            await myDocsTabAgain.click();
            await page.waitForTimeout(500);
          }
          
          // Now try to navigate
          const targetButton = await page.$(`nav.fixed.bottom-0 button:has-text("${test.name}")`);
          
          if (targetButton) {
            const beforeUrl = page.url();
            console.log(`  Before: ${beforeUrl.replace('http://localhost:3002/', '')}`);
            
            try {
              // Check if button is clickable
              const isClickable = await targetButton.isEnabled() && await targetButton.isVisible();
              console.log(`  Button clickable: ${isClickable ? '✅' : '❌'}`);
              
              if (isClickable) {
                await targetButton.click();
                await page.waitForTimeout(1500);
                
                const afterUrl = page.url();
                console.log(`  After: ${afterUrl.replace('http://localhost:3002/', '')}`);
                
                const success = afterUrl.includes(test.expected);
                console.log(`  Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
                
                if (!success) {
                  console.log(`    Expected: ${test.expected}`);
                  console.log(`    Got: ${afterUrl}`);
                }
              } else {
                console.log(`  ❌ Button not clickable`);
              }
            } catch (e) {
              console.log(`  ❌ Click error: ${e.message}`);
            }
          } else {
            console.log(`  ❌ Button "${test.name}" not found`);
          }
        }
      }
    } else {
      console.log('❌ Bottom navigation not found');
    }
    
    // Test other document tabs too
    console.log('\n📚 Step 5: Testing other document tabs...');
    const otherTabs = ['공유 문서함', '도면 마킹', '필수 제출 서류'];
    
    for (const tabName of otherTabs) {
      console.log(`\n📑 Testing "${tabName}" tab...`);
      
      await page.goto('http://localhost:3002/dashboard#documents-unified');
      await page.waitForTimeout(1000);
      
      const tab = await page.$(`button[role="tab"]:has-text("${tabName}")`);
      if (tab && await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(500);
        
        // Test one navigation (빠른메뉴)
        const quickButton = await page.$('nav.fixed.bottom-0 button:has-text("빠른메뉴")');
        if (quickButton && await quickButton.isVisible()) {
          const beforeUrl = page.url();
          await quickButton.click();
          await page.waitForTimeout(1000);
          const afterUrl = page.url();
          
          const success = afterUrl.includes('/dashboard') && !afterUrl.includes('#documents');
          console.log(`  ${tabName} → 빠른메뉴: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
          console.log(`    From: ${beforeUrl.replace('http://localhost:3002/', '')}`);
          console.log(`    To: ${afterUrl.replace('http://localhost:3002/', '')}`);
        } else {
          console.log(`  ❌ 빠른메뉴 button not found or not visible`);
        }
      } else {
        console.log(`  ❌ "${tabName}" tab not found`);
      }
    }
    
  } catch (e) {
    console.error('❌ Test error:', e.message);
  }
  
  console.log('\n🔍 Test complete. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testDocumentsNavigation();