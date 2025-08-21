const { chromium, devices } = require('playwright');

async function quickTest() {
  console.log('🚀 Quick mobile navigation test');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'ko-KR'
  });
  const page = await context.newPage();
  
  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3002/auth/login');
    await page.waitForTimeout(3000);
    
    if (!page.url().includes('dashboard')) {
      await page.fill('#email', 'manager@inopnc.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');
    }
    console.log('✅ Logged in');
    
    // Check bottom nav
    const bottomNavVisible = await page.isVisible('nav.fixed.bottom-0');
    console.log(`Bottom nav visible: ${bottomNavVisible ? '✅' : '❌'}`);
    
    if (bottomNavVisible) {
      // List all buttons
      const buttons = await page.$$('nav.fixed.bottom-0 button');
      console.log(`Found ${buttons.length} bottom nav buttons`);
      
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        console.log(`  Button ${i + 1}: "${text}"`);
      }
      
      // Test a few navigation paths
      console.log('\nTesting navigation...');
      
      // Test 1: 빠른메뉴 → 출력정보
      const outputButton = await page.$('nav.fixed.bottom-0 button:has-text("출력정보")');
      if (outputButton && await outputButton.isVisible()) {
        await outputButton.click();
        await page.waitForTimeout(1500);
        const url = page.url();
        console.log(`✅ 출력정보 clicked: ${url.includes('attendance') ? 'SUCCESS' : 'FAILED'} (${url})`);
      }
      
      // Test 2: 출력정보 → 문서함
      const docButton = await page.$('nav.fixed.bottom-0 button:has-text("문서함")');
      if (docButton && await docButton.isVisible()) {
        await docButton.click();
        await page.waitForTimeout(1500);
        const url = page.url();
        console.log(`✅ 문서함 clicked: ${url.includes('documents') ? 'SUCCESS' : 'FAILED'} (${url})`);
      }
      
      // Test 3: Check document tabs
      const tabButtons = await page.$$('button[role="tab"]');
      console.log(`Found ${tabButtons.length} document tabs`);
      
    } else {
      console.log('❌ Bottom navigation not visible');
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  console.log('\nClosing in 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
}

quickTest();