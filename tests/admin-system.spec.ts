import { test, expect } from '@playwright/test'

// Test configuration
const ADMIN_EMAIL = 'admin@inopnc.com'
const ADMIN_PASSWORD = 'password123'
const BASE_URL = 'http://localhost:3000'

test.describe('시스템관리자 대시보드 테스트', () => {
  // 각 테스트 전에 로그인
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto(`${BASE_URL}/auth/login`)
    
    // 로그인 수행
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    // 대시보드 로드 대기
    await page.waitForURL('**/dashboard/**')
    
    // 관리자 대시보드로 이동
    await page.goto(`${BASE_URL}/dashboard/admin`)
    await page.waitForLoadState('networkidle')
  })

  test('관리자 대시보드 메인 페이지 확인', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page.locator('h1')).toContainText('시스템 관리자 대시보드')
    
    // 주요 통계 카드 확인
    await expect(page.locator('text=전체 사용자')).toBeVisible()
    await expect(page.locator('text=활성 현장')).toBeVisible()
    await expect(page.locator('text=오늘 작업자')).toBeVisible()
    await expect(page.locator('text=대기중 승인')).toBeVisible()
    
    // 퀵 액션 버튼 확인
    await expect(page.locator('text=사용자 관리')).toBeVisible()
    await expect(page.locator('text=현장 관리')).toBeVisible()
    await expect(page.locator('text=승인 대기')).toBeVisible()
    await expect(page.locator('text=보고서')).toBeVisible()
  })

  test('사이드바 네비게이션 메뉴 확인', async ({ page }) => {
    // 사이드바 메뉴 항목들 확인
    const menuItems = [
      '홈',
      '분석 대시보드',
      '통합 알림 센터',
      '현장 관리',
      '소속(거래처) 관리',
      '파트너사 관리',
      '사용자 관리',
      '가입 요청 관리',
      '문서함 관리',
      '급여 관리',
      'NPC-1000 자재 관리',
      '커뮤니케이션 관리',
      '감사 로그'
    ]
    
    for (const item of menuItems) {
      await expect(page.locator(`text=${item}`)).toBeVisible()
    }
  })

  test.describe('Phase 1: 조직 관리 기능', () => {
    test('소속(거래처) 관리 페이지', async ({ page }) => {
      // 소속 관리 페이지로 이동
      await page.click('text=소속(거래처) 관리')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('소속(거래처) 관리')
      await expect(page.locator('button:has-text("새 거래처 추가")')).toBeVisible()
      
      // 테이블 헤더 확인
      await expect(page.locator('text=거래처명')).toBeVisible()
      await expect(page.locator('text=대표자')).toBeVisible()
      await expect(page.locator('text=연락처')).toBeVisible()
      await expect(page.locator('text=상태')).toBeVisible()
    })

    test('파트너사 관리 페이지', async ({ page }) => {
      // 파트너사 관리 페이지로 이동
      await page.click('text=파트너사 관리')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('파트너사 관리')
      await expect(page.locator('button:has-text("새 파트너사 추가")')).toBeVisible()
      
      // 검색 및 필터 확인
      await expect(page.locator('input[placeholder*="검색"]')).toBeVisible()
      await expect(page.locator('select')).toBeVisible()
    })

    test('급여 관리 페이지', async ({ page }) => {
      // 급여 관리 페이지로 이동
      await page.click('text=급여 관리')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('급여 관리')
      
      // 탭 확인
      await expect(page.locator('text=급여 명세서')).toBeVisible()
      await expect(page.locator('text=급여 계산')).toBeVisible()
      await expect(page.locator('text=지급 내역')).toBeVisible()
      await expect(page.locator('text=공제 관리')).toBeVisible()
    })
  })

  test.describe('Phase 2: 고급 관리 기능', () => {
    test('문서함 관리 페이지', async ({ page }) => {
      // 문서함 관리 페이지로 이동
      await page.click('text=문서함 관리')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('문서함 관리')
      
      // 문서 카테고리 탭 확인
      await expect(page.locator('text=개인문서')).toBeVisible()
      await expect(page.locator('text=공유문서')).toBeVisible()
      await expect(page.locator('text=도면')).toBeVisible()
      await expect(page.locator('text=필수문서')).toBeVisible()
      await expect(page.locator('text=기성청구')).toBeVisible()
    })

    test('NPC 자재 관리 페이지', async ({ page }) => {
      // 자재 관리 페이지로 이동
      await page.click('text=NPC-1000 자재 관리')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('NPC-1000 자재 관리')
      
      // 탭 확인
      await expect(page.locator('text=재고 및 사용 현황')).toBeVisible()
      await expect(page.locator('text=생산 관리')).toBeVisible()
      await expect(page.locator('text=출고 관리')).toBeVisible()
      await expect(page.locator('text=출고 요청')).toBeVisible()
    })

    test('커뮤니케이션 관리 페이지', async ({ page }) => {
      // 커뮤니케이션 관리 페이지로 이동
      await page.click('text=커뮤니케이션 관리')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('커뮤니케이션 관리')
      
      // 탭 확인
      await expect(page.locator('text=알림 및 공지사항')).toBeVisible()
      await expect(page.locator('text=본사 요청사항')).toBeVisible()
    })
  })

  test.describe('Phase 3: 분석 및 모니터링', () => {
    test('통합 알림 센터', async ({ page }) => {
      // 알림 센터로 이동
      await page.click('text=통합 알림 센터')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('통합 알림 센터')
      
      // 통계 카드 확인
      await expect(page.locator('text=전체')).toBeVisible()
      await expect(page.locator('text=읽지 않음')).toBeVisible()
      await expect(page.locator('text=긴급')).toBeVisible()
      
      // 필터 옵션 확인
      await expect(page.locator('select:has-text("모든 타입")')).toBeVisible()
      await expect(page.locator('select:has-text("모든 우선순위")')).toBeVisible()
    })

    test('분석 대시보드', async ({ page }) => {
      // 분석 대시보드로 이동
      await page.click('text=분석 대시보드')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('분석 대시보드')
      
      // 핵심 지표 카드 확인
      await expect(page.locator('text=전체 작업자')).toBeVisible()
      await expect(page.locator('text=활성 현장')).toBeVisible()
      await expect(page.locator('text=총 문서')).toBeVisible()
      await expect(page.locator('text=월 지출 비용')).toBeVisible()
      
      // 차트 영역 확인
      await expect(page.locator('text=출근 현황 추이')).toBeVisible()
      await expect(page.locator('text=현장별 진행률')).toBeVisible()
    })

    test('감사 로그 시스템', async ({ page }) => {
      // 감사 로그로 이동
      await page.click('text=감사 로그')
      await page.waitForLoadState('networkidle')
      
      // 페이지 요소 확인
      await expect(page.locator('h1')).toContainText('감사 로그 시스템')
      
      // 통계 카드 확인
      await expect(page.locator('text=전체 로그')).toBeVisible()
      await expect(page.locator('text=오늘')).toBeVisible()
      await expect(page.locator('text=실패')).toBeVisible()
      await expect(page.locator('text=경고')).toBeVisible()
      
      // 필터 및 검색 확인
      await expect(page.locator('input[placeholder*="로그 검색"]')).toBeVisible()
      await expect(page.locator('button:has-text("고급 필터")')).toBeVisible()
    })
  })

  test.describe('CRUD 작업 테스트', () => {
    test('새 공지사항 생성', async ({ page }) => {
      // 커뮤니케이션 관리로 이동
      await page.click('text=커뮤니케이션 관리')
      await page.waitForLoadState('networkidle')
      
      // 공지사항 탭 클릭
      await page.click('text=알림 및 공지사항')
      
      // 새 공지사항 버튼 클릭
      await page.click('button:has-text("새 공지사항")')
      
      // 폼 입력 확인
      await expect(page.locator('text=새 공지사항 작성')).toBeVisible()
      await expect(page.locator('input[placeholder*="제목"]')).toBeVisible()
      await expect(page.locator('textarea[placeholder*="내용"]')).toBeVisible()
    })

    test('자재 출고 요청 확인', async ({ page }) => {
      // 자재 관리로 이동
      await page.click('text=NPC-1000 자재 관리')
      await page.waitForLoadState('networkidle')
      
      // 출고 요청 탭 클릭
      await page.click('text=출고 요청')
      
      // 요청 목록 확인
      await expect(page.locator('text=요청일')).toBeVisible()
      await expect(page.locator('text=현장')).toBeVisible()
      await expect(page.locator('text=요청수량')).toBeVisible()
      await expect(page.locator('text=상태')).toBeVisible()
    })
  })

  test.describe('반응형 디자인 테스트', () => {
    test('모바일 뷰에서 사이드바 토글', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 })
      
      // 햄버거 메뉴 버튼 확인
      const menuButton = page.locator('button:has(svg)')
      await expect(menuButton).toBeVisible()
      
      // 메뉴 토글
      await menuButton.first().click()
      
      // 사이드바 메뉴 확인
      await expect(page.locator('text=사용자 관리')).toBeVisible()
    })

    test('태블릿 뷰에서 레이아웃 확인', async ({ page }) => {
      // 태블릿 뷰포트 설정
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // 레이아웃 확인
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('text=전체 사용자')).toBeVisible()
    })
  })

  test.describe('다크모드 테스트', () => {
    test('다크모드 토글 확인', async ({ page }) => {
      // 다크모드 토글 버튼 찾기 (보통 헤더에 있음)
      const darkModeToggle = page.locator('button:has(svg[class*="moon"], svg[class*="sun"])')
      
      if (await darkModeToggle.isVisible()) {
        // 다크모드 토글
        await darkModeToggle.click()
        
        // body 클래스 확인
        const bodyClass = await page.locator('body').getAttribute('class')
        expect(bodyClass).toMatch(/dark|light/)
      }
    })
  })
})

test.describe('성능 및 접근성 테스트', () => {
  test('페이지 로딩 성능', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    // 대시보드 로딩 시간 측정
    const startTime = Date.now()
    await page.goto(`${BASE_URL}/dashboard/admin`)
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // 3초 이내 로딩 확인
    expect(loadTime).toBeLessThan(3000)
  })

  test('키보드 네비게이션', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    
    // Tab 키로 네비게이션
    await page.keyboard.press('Tab')
    await page.keyboard.type(ADMIN_EMAIL)
    await page.keyboard.press('Tab')
    await page.keyboard.type(ADMIN_PASSWORD)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // 로그인 확인
    await page.waitForURL('**/dashboard/**')
  })

  test('접근성 레이블 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.goto(`${BASE_URL}/dashboard/admin`)
    
    // ARIA 레이블 확인
    const buttons = await page.locator('button').all()
    for (const button of buttons.slice(0, 5)) { // 처음 5개만 확인
      const ariaLabel = await button.getAttribute('aria-label')
      const text = await button.textContent()
      expect(ariaLabel || text).toBeTruthy()
    }
  })
})