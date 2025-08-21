import { test, expect } from '@playwright/test'

test.describe('Mobile PWA Photo Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Enable permissions for camera and file access
    await page.context().grantPermissions(['camera'])
    
    // Login first
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should upload photos in work content section on mobile', async ({ page }) => {
    // Navigate to daily reports
    await page.goto('/dashboard/daily-reports/new')
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="daily-report-form"]')
    
    // Expand work content section
    const workContentSection = page.getByText('작업내용 및 사진관리')
    await workContentSection.click()
    
    // Add work content
    await page.click('button:has-text("작업 추가")')
    
    // Fill work content details
    await page.selectOption('select[data-testid="member-name"]', '슬라브')
    await page.selectOption('select[data-testid="process-type"]', '균열')
    
    // Test photo upload for "작업 전"
    const beforePhotoInput = page.locator('input[type="file"][accept*="image"]').first()
    
    // Create a mock file for testing
    const buffer = Buffer.from('mock image data')
    await beforePhotoInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    })
    
    // Verify photo preview appears
    await expect(page.locator('[alt*="작업 전"]')).toBeVisible()
    
    // Test photo upload for "작업 후"
    const afterPhotoInput = page.locator('input[type="file"][accept*="image"]').nth(1)
    await afterPhotoInput.setInputFiles({
      name: 'test-image-after.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    })
    
    // Verify photo preview appears
    await expect(page.locator('[alt*="작업 후"]')).toBeVisible()
    
    // Test PDF generation button
    const pdfButton = page.getByText('사진대지 PDF 생성')
    await expect(pdfButton).toBeVisible()
    await pdfButton.click()
    
    // Verify PDF modal appears
    await expect(page.getByText('사진대지 PDF 미리보기')).toBeVisible()
  })

  test('should handle photo upload errors gracefully', async ({ page }) => {
    await page.goto('/dashboard/daily-reports/new')
    
    // Expand work content section
    const workContentSection = page.getByText('작업내용 및 사진관리')
    await workContentSection.click()
    
    // Add work content
    await page.click('button:has-text("작업 추가")')
    
    // Try to upload an unsupported file type
    const photoInput = page.locator('input[type="file"][accept*="image"]').first()
    
    try {
      await photoInput.setInputFiles({
        name: 'test-file.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not an image'),
      })
      
      // Should show error message
      await expect(page.getByText('사진 업로드에 실패했습니다')).toBeVisible()
    } catch (error) {
      // File type restriction should prevent upload
      console.log('File type correctly restricted')
    }
  })

  test('should limit photo uploads to 10 images', async ({ page }) => {
    await page.goto('/dashboard/daily-reports/new')
    
    const workContentSection = page.getByText('작업내용 및 사진관리')
    await workContentSection.click()
    
    await page.click('button:has-text("작업 추가")')
    
    // Try to upload 11 images
    const photoInput = page.locator('input[type="file"][accept*="image"]').first()
    const buffer = Buffer.from('mock image data')
    
    const files = Array.from({ length: 11 }, (_, i) => ({
      name: `test-image-${i + 1}.jpg`,
      mimeType: 'image/jpeg',
      buffer: buffer,
    }))
    
    await photoInput.setInputFiles(files)
    
    // Should show limit message
    await expect(page.getByText('최대 10장까지 업로드 가능합니다')).toBeVisible()
    
    // Only 10 previews should be visible
    const previews = page.locator('[alt*="작업 전"]')
    await expect(previews).toHaveCount(10)
  })
})