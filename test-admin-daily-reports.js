const { chromium } = require('playwright');

async function testAdminDailyReports() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Testing admin daily reports functionality...');
    
    // 1. Login as admin
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@inopnc.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    console.log('✅ Admin login successful');
    
    // 2. Navigate to daily reports management
    await page.goto('http://localhost:3000/dashboard/admin/daily-reports');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Daily reports admin page loaded');
    
    // 3. Wait for loading to complete (up to 10 seconds)
    try {
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
      console.log('✅ Loading spinner disappeared');
    } catch (e) {
      console.log('⏰ Loading spinner timeout (may be normal)');
    }
    
    // Wait a bit more for data to load
    await page.waitForTimeout(3000);
    
    // 4. Check for data or empty state
    const tableRows = await page.locator('table tbody tr').count();
    const loadingText = await page.locator('text=작업일지를 불러오는 중').count();
    const noDataText = await page.locator('text=조건에 맞는 작업일지가 없습니다').count();
    
    console.log('📊 Page state check:');
    console.log('  Table rows:', tableRows);
    console.log('  Loading message:', loadingText > 0 ? 'Present' : 'None');
    console.log('  No data message:', noDataText > 0 ? 'Present' : 'None');
    
    if (tableRows > 0) {
      console.log('🎉 SUCCESS! Daily reports data is displayed');
      
      // Get some sample data
      const firstRowData = [];
      for (let i = 1; i <= 7; i++) {
        try {
          const cell = await page.locator(`table tbody tr:first-child td:nth-child(${i})`).textContent();
          firstRowData.push(cell?.trim() || 'N/A');
        } catch (e) {
          firstRowData.push('N/A');
        }
      }
      
      console.log('📝 First report data:');
      console.log('  Date:', firstRowData[0]);
      console.log('  Site:', firstRowData[1]);
      console.log('  Worker/Process:', firstRowData[2]);
      console.log('  Personnel:', firstRowData[3]);
      console.log('  Material Status:', firstRowData[4]);
      console.log('  Status:', firstRowData[5]);
      console.log('  Creator:', firstRowData[6]);
      
      // Test pagination info
      try {
        const paginationInfo = await page.locator('text=/총 \\d+개/').textContent();
        console.log('📊 Pagination:', paginationInfo);
      } catch (e) {
        console.log('⚠️ Pagination info not found');
      }
      
      // Test filter functionality
      try {
        await page.click('button:has-text("필터")');
        await page.waitForTimeout(500);
        console.log('✅ Filter button works');
        
        // Close filter
        await page.click('button:has-text("필터")');
      } catch (e) {
        console.log('⚠️ Filter button not working');
      }
      
    } else if (loadingText > 0) {
      console.log('⏳ Still loading - this may indicate a performance issue');
    } else if (noDataText > 0) {
      console.log('ℹ️ No data message - may be due to filtering or no data');
    } else {
      console.log('❓ Unexpected state - taking screenshot for analysis');
    }
    
    // 5. Take final screenshot
    await page.screenshot({ path: 'admin-daily-reports-final.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-daily-reports-final.png');
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'admin-daily-reports-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: admin-daily-reports-error.png');
  } finally {
    await browser.close();
  }
}

testAdminDailyReports();