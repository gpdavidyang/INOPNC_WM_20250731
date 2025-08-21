const { chromium, devices } = require('playwright');

async function testDocumentsNavigationSimple() {
  console.log('🔍 Testing Documents Navigation Issue - Simple Test\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'ko-KR'
  });
  const page = await context.newPage();
  
  try {
    // Step 1: Go to login and check if already logged in
    console.log('📋 Step 1: Checking login status...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForTimeout(3000);
    
    // If we're already on dashboard, skip login
    if (page.url().includes('dashboard')) {
      console.log('✅ Already logged in');
    } else {
      // Login
      console.log('🔐 Logging in...');
      await page.fill('#email', 'manager@inopnc.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for successful login (either dashboard page or direct redirect)
      try {
        await page.waitForURL('**/dashboard**', { timeout: 15000 });
        console.log('✅ Login successful');
      } catch (e) {
        console.log('⚠️ Login may have succeeded but URL check failed:', page.url());
      }
    }
    
    // Step 2: Navigate directly to documents
    console.log('\n📑 Step 2: Navigating to documents...');
    await page.goto('http://localhost:3000/dashboard#documents-unified');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Step 3: Check if document tabs are visible
    console.log('\n📊 Step 3: Checking document tabs...');
    const docTabs = await page.$$('button[role="tab"]');
    console.log(`Found ${docTabs.length} document tabs`);
    
    if (docTabs.length > 0) {
      for (let i = 0; i < docTabs.length; i++) {
        const tabText = await docTabs[i].textContent();
        const isSelected = await docTabs[i].getAttribute('aria-selected');
        const isVisible = await docTabs[i].isVisible();
        console.log(`  Tab ${i + 1}: "${tabText}" (selected: ${isSelected}, visible: ${isVisible})`);
      }
      
      // Try to click on "내 문서함" tab
      console.log('\n📝 Step 4: Clicking "내 문서함" tab...');
      const myDocsTab = await page.$('button[role="tab"]:has-text("내 문서함")');
      
      if (myDocsTab && await myDocsTab.isVisible()) {
        await myDocsTab.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked "내 문서함" tab');
        
        // Check tab panel content
        const tabPanel = await page.isVisible('[role="tabpanel"]');
        console.log(`Tab panel visible: ${tabPanel ? '✅' : '❌'}`);
        
        // Step 5: Test bottom navigation from documents tab
        console.log('\n🔍 Step 5: Testing bottom navigation...');
        const bottomNav = await page.$('nav.fixed.bottom-0');
        
        if (bottomNav && await bottomNav.isVisible()) {
          console.log('✅ Bottom navigation found and visible');
          
          // Test clicking "빠른메뉴" button
          const quickMenuButton = await page.$('nav.fixed.bottom-0 button:has-text("빠른메뉴")');
          if (quickMenuButton && await quickMenuButton.isVisible()) {
            console.log('\n🚀 Testing "빠른메뉴" navigation...');
            const beforeUrl = page.url();
            console.log(`Before: ${beforeUrl}`);
            
            await quickMenuButton.click();
            await page.waitForTimeout(2000);
            
            const afterUrl = page.url();
            console.log(`After: ${afterUrl}`);
            
            const success = afterUrl.includes('/dashboard') && !afterUrl.includes('#documents');
            console.log(`Result: ${success ? '✅ SUCCESS - Navigation worked!' : '❌ FAILED - Still on documents page'}`);
            
            if (!success) {
              console.log('❌ ISSUE CONFIRMED: Bottom navigation from documents tab is not working properly');
            }
          } else {
            console.log('❌ "빠른메뉴" button not found or not visible');
          }
        } else {
          console.log('❌ Bottom navigation not found or not visible');
        }
        
      } else {
        console.log('❌ "내 문서함" tab not found or not visible');
      }
    } else {
      console.log('❌ No document tabs found - this indicates LazyDocumentsTabUnified component is not loading');
    }
    
  } catch (e) {
    console.error('❌ Test error:', e.message);
  }
  
  console.log('\n🔄 Test complete. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testDocumentsNavigationSimple();