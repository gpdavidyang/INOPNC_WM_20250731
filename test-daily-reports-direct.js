const { chromium } = require('playwright');

async function testDailyReportsDirectAccess() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 관리자 작업일지 관리 직접 접근 테스트...');
    
    // 1. 관리자 작업일지 페이지로 직접 이동 (세션이 있다면 바로 접근)
    await page.goto('http://localhost:3007/dashboard/admin/daily-reports');
    await page.waitForTimeout(3000);
    
    // 2. 로그인 페이지로 리다이렉트되었는지 확인
    const currentURL = page.url();
    console.log('📍 현재 URL:', currentURL);
    
    if (currentURL.includes('/auth/login')) {
      console.log('🔐 로그인이 필요합니다. 로그인 진행...');
      
      await page.fill('input[type="email"]', 'admin@inopnc.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // 로그인 후 리다이렉트 대기
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      console.log('✅ 로그인 완료, 대시보드로 이동됨');
      
      // 다시 작업일지 관리 페이지로 이동
      await page.goto('http://localhost:3007/dashboard/admin/daily-reports');
    }
    
    // 3. 페이지 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ 작업일지 관리 페이지 로드 완료');
    
    // 4. 페이지 콘텐츠 확인
    const pageTitle = await page.locator('h1').textContent();
    console.log('📋 페이지 제목:', pageTitle);
    
    // 5. 로딩 스피너가 사라질 때까지 대기
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {
      console.log('⏰ 로딩 스피너 대기 시간 초과 (정상일 수 있음)');
    });
    
    // 6. 테이블 또는 "데이터 없음" 메시지 확인
    await page.waitForTimeout(3000);
    
    const hasTable = await page.locator('table tbody tr').count();
    const hasNoDataMessage = await page.locator('text=조건에 맞는 작업일지가 없습니다').count();
    const hasLoadingMessage = await page.locator('text=작업일지를 불러오는 중').count();
    
    console.log('📊 테이블 행 개수:', hasTable);
    console.log('📊 "데이터 없음" 메시지:', hasNoDataMessage);
    console.log('📊 "로딩 중" 메시지:', hasLoadingMessage);
    
    if (hasTable > 0) {
      console.log('🎉 성공! 작업일지 데이터가 로드됨!');
      
      // 첫 번째 행 데이터 확인
      const firstRowData = [];
      for (let i = 1; i <= 7; i++) {
        const cellText = await page.locator(`table tbody tr:first-child td:nth-child(${i})`).textContent();
        firstRowData.push(cellText?.trim() || 'N/A');
      }
      
      console.log('📝 첫 번째 작업일지 데이터:');
      console.log('  날짜:', firstRowData[0]);
      console.log('  현장:', firstRowData[1]);
      console.log('  작업자/공정:', firstRowData[2]);
      console.log('  인원:', firstRowData[3]);
      console.log('  자재현황:', firstRowData[4]);
      console.log('  상태:', firstRowData[5]);
      console.log('  작성자:', firstRowData[6]);
      
      // 총 개수 표시 확인
      try {
        const totalCountElement = await page.locator('text=총').first().textContent();
        console.log('📊 총 개수:', totalCountElement);
      } catch (e) {
        console.log('⚠️ 총 개수 표시를 찾을 수 없음');
      }
      
      // 필터 버튼 테스트
      const filterButton = page.locator('button:has-text("필터")');
      if (await filterButton.count() > 0) {
        await filterButton.click();
        await page.waitForTimeout(500);
        console.log('✅ 필터 버튼 클릭 성공');
      }
      
    } else if (hasNoDataMessage > 0) {
      console.log('ℹ️ 데이터 없음 상태 - UI는 정상 작동');
    } else if (hasLoadingMessage > 0) {
      console.log('⏳ 아직 로딩 중...');
    } else {
      console.log('❓ 예상치 못한 상태');
    }
    
    // 7. 최종 스크린샷
    await page.screenshot({ path: 'daily-reports-admin-final.png', fullPage: true });
    console.log('📸 최종 스크린샷: daily-reports-admin-final.png');
    
    console.log('✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
    await page.screenshot({ path: 'daily-reports-admin-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testDailyReportsDirectAccess();