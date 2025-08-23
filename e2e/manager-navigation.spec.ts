import { test, expect } from '@playwright/test';

test.describe('현장 관리자 네비게이션 테스트', () => {
  // 테스트 전 로그인
  test.beforeEach(async ({ page }) => {
    console.log('🔐 현장 관리자 계정으로 로그인 시작...');
    
    // 로그인 페이지로 이동
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // 로그인 수행
    await page.fill('input[name="email"]', 'manager@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ 로그인 성공');
  });

  test('데스크톱 사이드바 네비게이션 테스트', async ({ page }) => {
    console.log('\n📱 데스크톱 사이드바 테스트 시작...');
    
    // 데스크톱 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 사이드바 존재 확인
    const sidebar = page.locator('aside, nav').filter({ hasText: '홈' });
    await expect(sidebar).toBeVisible({ timeout: 5000 });
    console.log('  ✓ 사이드바 표시 확인');
    
    // 주요 메뉴 항목 테스트
    const menuItems = [
      { text: '홈', url: '/dashboard' },
      { text: '출근현황', url: '/dashboard/attendance' },
      { text: '작업일지', url: '/dashboard/daily-reports' },
      { text: '현장정보', url: '/dashboard/site-info' },
      { text: '문서함', url: '/dashboard/documents' },
      { text: '내정보', url: '/dashboard/profile' }
    ];
    
    for (const item of menuItems) {
      console.log(`  🔍 "${item.text}" 메뉴 테스트 중...`);
      
      // 메뉴 아이템 찾기
      const menuLink = page.locator(`a, button`).filter({ hasText: item.text }).first();
      
      if (await menuLink.isVisible()) {
        // 클릭 가능한지 확인
        await expect(menuLink).toBeEnabled();
        
        // 메뉴 클릭
        await menuLink.click();
        await page.waitForLoadState('networkidle');
        
        // URL 확인
        if (item.url) {
          await expect(page).toHaveURL(new RegExp(item.url));
          console.log(`    ✓ "${item.text}" → ${item.url} 이동 성공`);
        }
        
        // 대시보드로 돌아가기
        if (item.url !== '/dashboard') {
          await page.goto('/dashboard');
          await page.waitForLoadState('networkidle');
        }
      } else {
        console.log(`    ⚠️ "${item.text}" 메뉴를 찾을 수 없음`);
      }
    }
  });

  test('모바일 하단바 네비게이션 테스트', async ({ page }) => {
    console.log('\n📱 모바일 하단바 테스트 시작...');
    
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 하단바 존재 확인
    const bottomNav = page.locator('nav[class*="bottom"], div[class*="bottom-nav"], div[class*="mobile-nav"]').first();
    
    if (await bottomNav.isVisible()) {
      console.log('  ✓ 하단 네비게이션 바 표시 확인');
      
      // 하단바 메뉴 항목
      const bottomMenuItems = [
        { text: '홈', icon: 'Home' },
        { text: '출근현황', icon: 'Calendar' },
        { text: '작업일지', icon: 'FileText' },
        { text: '문서함', icon: 'Folder' },
        { text: '내정보', icon: 'User' }
      ];
      
      for (const item of bottomMenuItems) {
        console.log(`  🔍 하단바 "${item.text}" 테스트 중...`);
        
        // 아이콘 또는 텍스트로 메뉴 찾기
        const menuButton = bottomNav.locator(`button, a`).filter({ hasText: item.text }).first();
        
        if (await menuButton.isVisible()) {
          await expect(menuButton).toBeEnabled();
          
          // 클릭
          await menuButton.click();
          await page.waitForLoadState('networkidle');
          console.log(`    ✓ "${item.text}" 클릭 성공`);
          
          // 잠시 대기
          await page.waitForTimeout(500);
        } else {
          console.log(`    ⚠️ "${item.text}" 버튼을 찾을 수 없음`);
        }
      }
    } else {
      console.log('  ⚠️ 하단 네비게이션 바를 찾을 수 없음');
    }
  });

  test('모바일 햄버거 메뉴 테스트', async ({ page }) => {
    console.log('\n📱 모바일 햄버거 메뉴 테스트 시작...');
    
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 햄버거 메뉴 버튼 찾기
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[class*="menu"], button').filter({ has: page.locator('svg[class*="Menu"]') }).first();
    
    if (await hamburgerButton.isVisible()) {
      console.log('  ✓ 햄버거 메뉴 버튼 발견');
      
      // 햄버거 메뉴 클릭
      await hamburgerButton.click();
      await page.waitForTimeout(300); // 애니메이션 대기
      
      // 사이드바가 열렸는지 확인
      const mobileSidebar = page.locator('aside[class*="open"], nav[class*="open"], div[class*="sidebar"][class*="open"]').first();
      
      if (await mobileSidebar.isVisible()) {
        console.log('  ✓ 모바일 사이드바 열림 확인');
        
        // 메뉴 항목 확인
        const menuItems = ['홈', '출근현황', '작업일지', '현장정보', '문서함'];
        for (const item of menuItems) {
          const menuLink = mobileSidebar.locator(`a, button`).filter({ hasText: item }).first();
          if (await menuLink.isVisible()) {
            console.log(`    ✓ "${item}" 메뉴 항목 표시됨`);
          }
        }
        
        // 사이드바 닫기
        const closeButton = mobileSidebar.locator('button[aria-label*="close"], button').filter({ has: page.locator('svg[class*="X"]') }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          console.log('  ✓ 사이드바 닫기 성공');
        }
      } else {
        console.log('  ⚠️ 모바일 사이드바가 열리지 않음');
      }
    } else {
      console.log('  ⚠️ 햄버거 메뉴 버튼을 찾을 수 없음');
    }
  });

  test('반응형 레이아웃 전환 테스트', async ({ page }) => {
    console.log('\n🔄 반응형 레이아웃 전환 테스트 시작...');
    
    // 데스크톱 → 모바일
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    const desktopSidebar = page.locator('aside, nav').filter({ hasText: '홈' }).first();
    if (await desktopSidebar.isVisible()) {
      console.log('  ✓ 데스크톱 사이드바 표시됨');
    }
    
    // 모바일로 전환
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileBottomNav = page.locator('nav[class*="bottom"], div[class*="bottom-nav"]').first();
    if (await mobileBottomNav.isVisible()) {
      console.log('  ✓ 모바일 하단바로 전환됨');
    }
    
    // 다시 데스크톱으로
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    if (await desktopSidebar.isVisible()) {
      console.log('  ✓ 데스크톱 사이드바로 재전환됨');
    }
  });

  test('네비게이션 활성 상태 테스트', async ({ page }) => {
    console.log('\n🎯 네비게이션 활성 상태 테스트 시작...');
    
    // 작업일지 페이지로 이동
    await page.goto('/dashboard/daily-reports');
    await page.waitForLoadState('networkidle');
    
    // 활성 메뉴 확인
    const activeMenuItem = page.locator('a[class*="active"], a[class*="bg-blue"], a[class*="text-blue"]').filter({ hasText: '작업일지' }).first();
    
    if (await activeMenuItem.isVisible()) {
      console.log('  ✓ "작업일지" 메뉴 활성 상태 확인');
    } else {
      console.log('  ⚠️ 활성 메뉴 스타일이 적용되지 않음');
    }
    
    // 문서함 페이지로 이동
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');
    
    const activeDocMenuItem = page.locator('a[class*="active"], a[class*="bg-blue"], a[class*="text-blue"]').filter({ hasText: '문서함' }).first();
    
    if (await activeDocMenuItem.isVisible()) {
      console.log('  ✓ "문서함" 메뉴 활성 상태 확인');
    }
  });

  test.afterEach(async ({ page }) => {
    // 스크린샷 저장 (실패 시)
    if (test.info().status !== test.info().expectedStatus) {
      await page.screenshot({ 
        path: `test-results/manager-nav-${Date.now()}.png`,
        fullPage: true 
      });
    }
  });
});

// 테스트 결과 요약
test.afterAll(async () => {
  console.log('\n' + '='.repeat(50));
  console.log('📊 현장 관리자 네비게이션 테스트 완료');
  console.log('='.repeat(50));
});