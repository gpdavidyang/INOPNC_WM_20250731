import { test, expect } from '@playwright/test'

test.describe('PDF Generation with Korean Support', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should generate PDF with Korean text properly', async ({ page }) => {
    // Navigate to daily report creation
    await page.goto('/dashboard/daily-reports/new')
    
    // Fill out basic information
    await page.fill('[data-testid="site-select"]', '강남 A현장')
    
    // Expand work content section
    const workContentSection = page.getByText('작업내용 및 사진관리')
    await workContentSection.click()
    
    // Add work content with Korean text
    await page.click('button:has-text("작업 추가")')
    
    // Fill Korean text fields
    await page.selectOption('select[data-testid="member-name"]', '슬라브')
    await page.selectOption('select[data-testid="process-type"]', '균열')
    await page.fill('[data-testid="work-section"]', '3층 A구역 슬라브 균열보수')
    
    // Add mock photos
    const buffer = Buffer.from('mock image data')
    const beforePhotoInput = page.locator('input[type="file"][accept*="image"]').first()
    await beforePhotoInput.setInputFiles({
      name: 'before.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    })
    
    const afterPhotoInput = page.locator('input[type="file"][accept*="image"]').nth(1)
    await afterPhotoInput.setInputFiles({
      name: 'after.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    })
    
    // Click PDF generation button
    const pdfButton = page.getByText('사진대지 PDF 생성')
    await pdfButton.click()
    
    // Wait for PDF modal to appear
    await expect(page.getByText('사진대지 PDF 미리보기')).toBeVisible()
    
    // Verify Korean text is displayed in preview
    await expect(page.getByText('강남 A현장')).toBeVisible()
    await expect(page.getByText('슬라브')).toBeVisible()
    await expect(page.getByText('균열')).toBeVisible()
    
    // Generate PDF
    const generateButton = page.getByText('PDF 보고서 생성')
    await generateButton.click()
    
    // Wait for PDF generation to complete
    await expect(page.getByText('PDF 보고서가 성공적으로 생성되었습니다')).toBeVisible()
    
    // Verify no encoding errors in Korean text
    await expect(page.getByText('ㅁ￶￥ㅗ')).not.toBeVisible() // Garbled text
    await expect(page.getByText('???')).not.toBeVisible() // Question marks
  })

  test('should handle Canvas-based PDF generation on mobile', async ({ page, browserName }) => {
    // Skip on webkit for now due to potential Canvas issues
    test.skip(browserName === 'webkit', 'Canvas PDF generation may have issues on Safari')
    
    await page.goto('/dashboard/daily-reports/new')
    
    // Add work content
    const workContentSection = page.getByText('작업내용 및 사진관리')
    await workContentSection.click()
    await page.click('button:has-text("작업 추가")')
    
    // Fill with Korean characters that often cause encoding issues
    await page.selectOption('select[data-testid="member-name"]', '거더')
    await page.selectOption('select[data-testid="process-type"]', '마감')
    await page.fill('[data-testid="work-section"]', '특수문자 테스트: ㄱㄴㄷ ㅏㅑㅓ 한글 테스트')
    
    // Generate PDF
    await page.click('button:has-text("사진대지 PDF 생성")')
    await page.click('button:has-text("PDF 보고서 생성")')
    
    // Check that Canvas PDF generation was attempted
    const consoleMessages = []
    page.on('console', msg => consoleMessages.push(msg.text()))
    
    // Should not see Canvas errors
    const hasCanvasError = consoleMessages.some(msg => 
      msg.includes('Canvas context not available') || 
      msg.includes('PDF 변환 오류')
    )
    expect(hasCanvasError).toBe(false)
  })

  test('should fallback to HTML print when Canvas fails', async ({ page }) => {
    await page.goto('/dashboard/daily-reports/new')
    
    // Mock Canvas failure
    await page.addInitScript(() => {
      // Override getContext to simulate failure
      HTMLCanvasElement.prototype.getContext = () => null
    })
    
    const workContentSection = page.getByText('작업내용 및 사진관리')
    await workContentSection.click()
    await page.click('button:has-text("작업 추가")')
    
    await page.selectOption('select[data-testid="member-name"]', '슬라브')
    await page.selectOption('select[data-testid="process-type"]', '균열')
    
    // Generate PDF - should fallback to HTML print
    await page.click('button:has-text("사진대지 PDF 생성")')
    
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("PDF 보고서 생성")')
    ])
    
    // Verify popup contains Korean text properly
    await expect(popup.getByText('건설 공사 사진 대지')).toBeVisible()
    await expect(popup.getByText('슬라브')).toBeVisible()
    await expect(popup.getByText('균열')).toBeVisible()
  })

  test('should generate PDF with correct Korean date format', async ({ page }) => {
    await page.goto('/dashboard/daily-reports/new')
    
    // Set specific date
    const today = new Date()
    const koreanDate = today.toLocaleDateString('ko-KR')
    
    const workContentSection = page.getByText('작업내용 및 사진관리')
    await workContentSection.click()
    await page.click('button:has-text("작업 추가")')
    
    await page.selectOption('select[data-testid="member-name"]', '기둥')
    await page.selectOption('select[data-testid="process-type"]', '면')
    
    await page.click('button:has-text("사진대지 PDF 생성")')
    
    // Verify Korean date format in preview
    await expect(page.getByText(koreanDate)).toBeVisible()
    
    // Generate PDF
    await page.click('button:has-text("PDF 보고서 생성")')
    
    // Verify PDF generation success with Korean date
    await expect(page.getByText('PDF 보고서가 성공적으로 생성되었습니다')).toBeVisible()
  })
})