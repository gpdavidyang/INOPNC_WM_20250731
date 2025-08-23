const { chromium } = require('playwright');

async function testDailyReportsAdmin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 관리자 작업일지 관리 페이지 테스트 시작...');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3007/auth/login');
    await page.waitForLoadState('networkidle');
    
    // 2. 관리자 계정으로 로그인
    await page.fill('input[type="email"]', 'admin@inopnc.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    console.log('✅ 로그인 시도 완료');
    
    // 3. 대시보드 로드 대기
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    console.log('✅ 관리자 대시보드 로드됨');
    
    // 4. 작업일지 관리 페이지로 이동
    await page.goto('http://localhost:3007/dashboard/admin/daily-reports');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 작업일지 관리 페이지 접근 완료');
    
    // 5. 페이지 제목 확인
    const pageTitle = await page.locator('h1').textContent();
    console.log('📋 페이지 제목:', pageTitle);
    
    // 6. 로딩 상태 대기
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
    
    // 7. 작업일지 데이터 로드 확인
    const hasData = await page.locator('table tbody tr').count();
    console.log('📊 로드된 작업일지 개수:', hasData);
    
    if (hasData > 0) {
      console.log('✅ 작업일지 데이터가 성공적으로 로드됨!');
      
      // 8. 첫 번째 작업일지 정보 확인
      const firstReportDate = await page.locator('table tbody tr:first-child td:first-child').textContent();
      const firstReportSite = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent();
      const firstReportWorker = await page.locator('table tbody tr:first-child td:nth-child(3)').textContent();
      
      console.log('📝 첫 번째 작업일지:');
      console.log('  - 날짜:', firstReportDate?.trim());
      console.log('  - 현장:', firstReportSite?.trim());
      console.log('  - 작업자:', firstReportWorker?.trim());
      
      // 9. 총 개수 표시 확인
      const totalCount = await page.locator('text=총').textContent();
      console.log('📊 총 개수 표시:', totalCount?.trim());
      
      // 10. 필터 기능 테스트
      await page.click('button:has-text("필터")');
      await page.waitForSelector('select:has([value=""])');
      console.log('✅ 필터 패널 열림');
      
      // 11. 검색 기능 테스트
      await page.fill('input[placeholder*="검색"]', '거더');
      await page.waitForTimeout(1000);
      console.log('✅ 검색 기능 테스트 완료');
      
      // 12. 상세보기 버튼 테스트
      const viewButton = page.locator('table tbody tr:first-child button[title="상세보기"]');
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
        console.log('✅ 상세보기 모달 열림');
        
        // 모달 닫기
        await page.keyboard.press('Escape');
        await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
        console.log('✅ 상세보기 모달 닫힘');
      }
      
    } else {
      console.log('❌ 작업일지 데이터가 로드되지 않음');
      
      // 에러 메시지 확인
      const noDataMessage = await page.locator('text=조건에 맞는 작업일지가 없습니다').count();
      if (noDataMessage > 0) {
        console.log('ℹ️ "데이터 없음" 메시지가 표시됨');
      }
    }
    
    // 13. 스크린샷 저장
    await page.screenshot({ path: 'admin-daily-reports-test.png', fullPage: true });
    console.log('📸 스크린샷 저장: admin-daily-reports-test.png');
    
    console.log('🎉 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await page.screenshot({ path: 'admin-daily-reports-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: admin-daily-reports-error.png');
  } finally {
    await browser.close();
  }
}

testDailyReportsAdmin();