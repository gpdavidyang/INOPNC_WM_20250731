const { chromium, devices } = require('playwright');

async function testNavigationFix() {
  console.log('🔧 Testing Navigation Fix - Quick Verification\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'ko-KR'
  });
  const page = await context.newPage();
  
  try {
    // Navigate directly to a working dashboard page first
    console.log('🌐 Step 1: Navigate to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(3000);
    
    console.log(`Current URL: ${page.url()}`);
    
    // Step 2: Navigate to documents using URL
    console.log('\n📑 Step 2: Navigate to documents via URL...');
    await page.goto('http://localhost:3000/dashboard#documents-unified');
    await page.waitForTimeout(2000);
    
    console.log(`Documents URL: ${page.url()}`);
    
    // Step 3: Check if we can see bottom navigation
    console.log('\n🔍 Step 3: Check bottom navigation...');
    const bottomNav = await page.$('nav.fixed.bottom-0');
    const bottomNavVisible = bottomNav ? await bottomNav.isVisible() : false;
    
    console.log(`Bottom navigation visible: ${bottomNavVisible ? '✅' : '❌'}`);
    
    if (bottomNavVisible) {
      // Step 4: Try to click "빠른메뉴" to see if navigation works
      console.log('\n🚀 Step 4: Test navigation fix...');
      
      const quickMenuBtn = await page.$('nav.fixed.bottom-0 button:has-text("빠른메뉴")');
      
      if (quickMenuBtn && await quickMenuBtn.isVisible()) {
        console.log('Found "빠른메뉴" button, testing click...');
        
        const beforeUrl = page.url();
        console.log(`Before: ${beforeUrl}`);
        
        // Listen for console logs to see navigation logic
        page.on('console', msg => {
          if (msg.text().includes('[BottomNav]')) {
            console.log(`  🔧 ${msg.text()}`);
          }
        });
        
        await quickMenuBtn.click();
        await page.waitForTimeout(3000);
        
        const afterUrl = page.url();
        console.log(`After: ${afterUrl}`);
        
        // Check if navigation worked (should go from #documents-unified to dashboard)
        const navigationWorked = beforeUrl.includes('#documents') && !afterUrl.includes('#documents') && afterUrl.includes('/dashboard');
        
        console.log(`\n🎯 NAVIGATION FIX RESULT: ${navigationWorked ? '✅ SUCCESS' : '❌ NEEDS MORE WORK'}`);
        
        if (navigationWorked) {
          console.log('✅ Fix successful! Bottom navigation from documents now works.');
        } else {
          console.log('❌ Fix needs adjustment. Navigation still not working correctly.');
        }
        
      } else {
        console.log('❌ Could not find "빠른메뉴" button');
      }
    }
    
  } catch (e) {
    console.error('❌ Test error:', e.message);
  }
  
  console.log('\n🏁 Test complete. Browser will remain open for 10 seconds for manual verification...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testNavigationFix();