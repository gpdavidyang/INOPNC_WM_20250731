const { chromium } = require('playwright');

async function testCommunicationFeatures() {
  console.log('🧪 커뮤니케이션 기능 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 로그인 페이지 접근
    console.log('📝 1. 로그인 페이지 접근 중...');
    await page.goto('http://localhost:3001/auth/login');
    await page.waitForLoadState('networkidle');
    
    // 관리자 로그인
    console.log('🔑 2. 관리자 로그인 중...');
    await page.fill('input[name="email"]', 'admin@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 로그인 성공 확인
    await page.waitForURL('**/dashboard/admin**', { timeout: 10000 });
    console.log('✅ 로그인 성공');
    
    // 3. 알림관리 페이지 테스트
    console.log('\n📢 3. 알림관리 페이지 테스트...');
    await page.goto('http://localhost:3001/dashboard/admin/notifications');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const notificationTitle = await page.textContent('h1');
    console.log(`페이지 제목: ${notificationTitle}`);
    
    // NotificationCenter 컴포넌트 로드 확인
    const notificationContent = await page.locator('.space-y-6').first().isVisible();
    console.log(`알림관리 컴포넌트 로드: ${notificationContent ? '✅' : '❌'}`);
    
    // 4. 커뮤니케이션 페이지 테스트
    console.log('\n💬 4. 커뮤니케이션 페이지 테스트...');
    await page.goto('http://localhost:3001/dashboard/admin/communication');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const commTitle = await page.textContent('h1');
    console.log(`페이지 제목: ${commTitle}`);
    
    // 탭 메뉴 확인
    const tabs = await page.locator('[role="button"]').filter({ hasText: '알림 및 공지사항' }).isVisible();
    console.log(`탭 메뉴 표시: ${tabs ? '✅' : '❌'}`);
    
    // 5. 각 탭 기능 테스트
    console.log('\n📋 5. 탭 기능 테스트...');
    
    // 공지사항 탭
    const announcementTab = await page.locator('text=알림 및 공지사항').isVisible();
    console.log(`공지사항 탭: ${announcementTab ? '✅' : '❌'}`);
    
    // 요청사항 탭
    const requestTab = await page.locator('text=본사 요청사항').isVisible();
    console.log(`요청사항 탭: ${requestTab ? '✅' : '❌'}`);
    
    // 이메일 알림 탭
    const emailTab = await page.locator('text=이메일 알림').isVisible();
    console.log(`이메일 알림 탭: ${emailTab ? '✅' : '❌'}`);
    
    // 6. 탭 클릭 테스트
    console.log('\n🔄 6. 탭 전환 테스트...');
    
    if (requestTab) {
      await page.click('text=본사 요청사항');
      await page.waitForTimeout(1000);
      const requestContent = await page.locator('text=요청사항').first().isVisible();
      console.log(`요청사항 탭 내용 로드: ${requestContent ? '✅' : '❌'}`);
    }
    
    if (emailTab) {
      await page.click('text=이메일 알림');
      await page.waitForTimeout(1000);
      const emailContent = await page.locator('text=이메일 알림 관리').first().isVisible();
      console.log(`이메일 알림 탭 내용 로드: ${emailContent ? '✅' : '❌'}`);
    }
    
    console.log('\n🎉 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testCommunicationFeatures().catch(console.error);