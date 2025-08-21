const { chromium } = require('playwright');

async function testSimple() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing server connection...');
  
  // Try different ports
  const ports = [3000, 3001, 3002, 3003, 3004];
  
  for (const port of ports) {
    try {
      console.log(`Trying port ${port}...`);
      await page.goto(`http://localhost:${port}`, { timeout: 5000 });
      console.log(`✅ Success on port ${port}!`);
      console.log(`Page URL: ${page.url()}`);
      console.log(`Page title: ${await page.title()}`);
      
      // Take screenshot
      await page.screenshot({ path: `test-port-${port}.png` });
      
      // Check if it's login page or dashboard
      const url = page.url();
      if (url.includes('auth/login')) {
        console.log('Found login page!');
        
        // Try to find login form
        const emailInput = await page.$('input[type="email"], input[name="email"], input[id="email"]');
        const passwordInput = await page.$('input[type="password"], input[name="password"], input[id="password"]');
        const submitButton = await page.$('button[type="submit"], button:has-text("로그인")');
        
        console.log(`Email input found: ${!!emailInput}`);
        console.log(`Password input found: ${!!passwordInput}`);
        console.log(`Submit button found: ${!!submitButton}`);
        
        if (emailInput && passwordInput && submitButton) {
          console.log('Login form elements found! Attempting login...');
          await emailInput.fill('worker@inopnc.com');
          await passwordInput.fill('password123');
          await submitButton.click();
          
          // Wait for navigation
          await page.waitForTimeout(5000);
          console.log(`After login URL: ${page.url()}`);
        }
      } else if (url.includes('dashboard')) {
        console.log('Already on dashboard!');
      }
      
      break; // Exit loop if successful
    } catch (e) {
      console.log(`❌ Failed on port ${port}: ${e.message}`);
    }
  }
  
  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

testSimple().catch(console.error);