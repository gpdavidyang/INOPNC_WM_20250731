import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Visual Regression Testing Suite', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    
    // Set consistent viewport for visual testing
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test.describe('Authentication Pages Visual Tests', () => {
    test('should match login page design', async ({ page }) => {
      await authPage.navigateToLogin()
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // Allow for animations to complete
      
      // Hide dynamic elements that change between runs
      await page.addStyleTag({
        content: `
          [data-testid="csrf-token"],
          .timestamp,
          .dynamic-content {
            visibility: hidden !important;
          }
        `
      })
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        threshold: 0.2, // Allow 20% difference for minor changes
        animations: 'disabled'
      })
    })

    test('should match signup page design', async ({ page }) => {
      await page.goto('/auth/signup')
      await page.waitForLoadState('networkidle')
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="csrf-token"],
          .timestamp {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('signup-page.png', {
        fullPage: true,
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should match password reset page design', async ({ page }) => {
      await page.goto('/auth/reset-password')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('reset-password-page.png', {
        fullPage: true,
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show consistent error states', async ({ page }) => {
      await authPage.navigateToLogin()
      
      // Trigger validation errors
      await page.getByRole('button', { name: /sign in|로그인/i }).click()
      await page.waitForTimeout(500) // Wait for error messages
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="csrf-token"] {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('login-validation-errors.png', {
        threshold: 0.3,
        animations: 'disabled'
      })
    })
  })

  test.describe('Dashboard Layout Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should match main dashboard layout', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      await page.waitForLoadState('networkidle')
      
      // Hide dynamic content that changes frequently
      await page.addStyleTag({
        content: `
          .timestamp,
          .current-time,
          .last-updated,
          [data-testid="real-time-indicator"],
          .live-data {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('dashboard-main.png', {
        fullPage: true,
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should match sidebar navigation consistently', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      
      // Focus on sidebar
      const sidebar = page.getByTestId('sidebar')
      await expect(sidebar).toHaveScreenshot('sidebar-navigation.png', {
        threshold: 0.1,
        animations: 'disabled'
      })
    })

    test('should match mobile sidebar behavior', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.navigateToDashboard()
      await page.waitForLoadState('networkidle')
      
      // Open mobile sidebar
      const menuButton = page.getByRole('button', { name: /menu|메뉴/i })
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(500) // Wait for animation
        
        await expect(page).toHaveScreenshot('mobile-sidebar-open.png', {
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should match top navigation bar', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      
      const topNavBar = page.getByTestId('top-navigation')
      if (await topNavBar.isVisible()) {
        // Hide dynamic user info
        await page.addStyleTag({
          content: `
            .user-avatar,
            .current-time,
            .notification-badge {
              visibility: hidden !important;
            }
          `
        })
        
        await expect(topNavBar).toHaveScreenshot('top-navigation-bar.png', {
          threshold: 0.1,
          animations: 'disabled'
        })
      }
    })
  })

  test.describe('Attendance Page Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should match attendance calendar layout', async ({ page }) => {
      await page.getByRole('link', { name: /attendance|출근/i }).click()
      await page.waitForLoadState('networkidle')
      
      // Hide dynamic timestamps and current status
      await page.addStyleTag({
        content: `
          .current-time,
          .timestamp,
          .last-checkin-time,
          .dynamic-status,
          .real-time-data {
            visibility: hidden !important;
          }
        `
      })
      
      const attendanceCalendar = page.getByTestId('attendance-calendar')
      if (await attendanceCalendar.isVisible()) {
        await expect(attendanceCalendar).toHaveScreenshot('attendance-calendar.png', {
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should match check-in modal design', async ({ page }) => {
      await page.getByRole('link', { name: /attendance|출근/i }).click()
      
      const checkInButton = page.getByRole('button', { name: /check in|출근/i })
      if (await checkInButton.isVisible()) {
        await checkInButton.click()
        await page.waitForTimeout(500) // Wait for modal animation
        
        const checkInModal = page.getByTestId('check-in-modal')
        if (await checkInModal.isVisible()) {
          await expect(checkInModal).toHaveScreenshot('check-in-modal.png', {
            threshold: 0.2,
            animations: 'disabled'
          })
        }
        
        // Close modal
        const cancelButton = page.getByRole('button', { name: /cancel|취소/i })
        if (await cancelButton.isVisible()) {
          await cancelButton.click()
        }
      }
    })

    test('should match labor hours input interface', async ({ page }) => {
      await page.getByRole('link', { name: /attendance|출근/i }).click()
      
      // Look for bulk entry or labor hours input
      const bulkEntryButton = page.getByRole('button', { name: /bulk entry|일괄 입력/i })
      if (await bulkEntryButton.isVisible()) {
        await bulkEntryButton.click()
        await page.waitForTimeout(500)
        
        const laborHoursInput = page.getByTestId('labor-hours-input')
        if (await laborHoursInput.isVisible()) {
          // Focus on labor hours input area
          const inputContainer = laborHoursInput.locator('..').first()
          await expect(inputContainer).toHaveScreenshot('labor-hours-input.png', {
            threshold: 0.2,
            animations: 'disabled'
          })
        }
      }
    })
  })

  test.describe('Documents Tab Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should match documents grid layout', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      await page.waitForLoadState('networkidle')
      
      // Hide dynamic file dates and timestamps
      await page.addStyleTag({
        content: `
          .file-date,
          .upload-time,
          .last-modified,
          .file-size-dynamic {
            visibility: hidden !important;
          }
        `
      })
      
      const documentsGrid = page.getByTestId('documents-grid')
      if (await documentsGrid.isVisible()) {
        await expect(documentsGrid).toHaveScreenshot('documents-grid.png', {
          threshold: 0.3,
          animations: 'disabled'
        })
      }
    })

    test('should match file upload interface', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const uploadArea = page.getByTestId('file-upload-area')
      if (await uploadArea.isVisible()) {
        await expect(uploadArea).toHaveScreenshot('file-upload-area.png', {
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should match document preview modal', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const firstDocument = page.getByTestId('document-item').first()
      if (await firstDocument.isVisible()) {
        await firstDocument.click()
        await page.waitForTimeout(500)
        
        const previewModal = page.getByTestId('document-preview')
        if (await previewModal.isVisible()) {
          await expect(previewModal).toHaveScreenshot('document-preview-modal.png', {
            threshold: 0.3,
            animations: 'disabled'
          })
          
          // Close modal
          const closeButton = previewModal.getByRole('button', { name: /close|닫기/i })
          if (await closeButton.isVisible()) {
            await closeButton.click()
          } else {
            await page.keyboard.press('Escape')
          }
        }
      }
    })
  })

  test.describe('Blueprint Markup Tool Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should match markup tool interface', async ({ page }) => {
      // Navigate to markup tool
      const markupLink = page.getByRole('link', { name: /markup|마킹/i })
      if (await markupLink.isVisible()) {
        await markupLink.click()
      } else {
        // Alternative navigation through documents
        await page.getByRole('tab', { name: /documents|문서함/i }).click()
        const markupButton = page.getByRole('button', { name: /markup.*tool|마킹.*도구/i })
        if (await markupButton.isVisible()) {
          await markupButton.click()
        }
      }
      
      await page.waitForLoadState('networkidle')
      
      const markupInterface = page.getByTestId('markup-interface')
      if (await markupInterface.isVisible()) {
        await expect(markupInterface).toHaveScreenshot('markup-tool-interface.png', {
          fullPage: true,
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should match tool palette design', async ({ page }) => {
      await page.goto('/dashboard/markup') // Direct navigation if route exists
      
      const toolPalette = page.getByTestId('tool-palette')
      if (await toolPalette.isVisible()) {
        await expect(toolPalette).toHaveScreenshot('markup-tool-palette.png', {
          threshold: 0.1,
          animations: 'disabled'
        })
      }
    })

    test('should match markup canvas with blueprint', async ({ page }) => {
      await page.goto('/dashboard/markup')
      
      // Look for existing markup document or create one
      const markupCanvas = page.getByTestId('markup-canvas')
      if (await markupCanvas.isVisible()) {
        // Add some test markings
        await markupCanvas.click({ position: { x: 100, y: 100 } })
        await page.waitForTimeout(200)
        
        await expect(markupCanvas).toHaveScreenshot('markup-canvas-with-markings.png', {
          threshold: 0.3,
          animations: 'disabled'
        })
      }
    })

    test('should match markup document list', async ({ page }) => {
      await page.goto('/dashboard/markup')
      
      const documentList = page.getByTestId('markup-document-list')
      if (await documentList.isVisible()) {
        // Hide dynamic timestamps
        await page.addStyleTag({
          content: `
            .created-date,
            .modified-date,
            .timestamp {
              visibility: hidden !important;
            }
          `
        })
        
        await expect(documentList).toHaveScreenshot('markup-document-list.png', {
          threshold: 0.3,
          animations: 'disabled'
        })
      }
    })
  })

  test.describe('Form Components Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should match daily report form design', async ({ page }) => {
      // Navigate to daily reports
      await page.getByRole('link', { name: /daily reports|일일 보고서/i }).click()
      
      const createButton = page.getByRole('button', { name: /create|새로 만들기/i })
      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForLoadState('networkidle')
        
        // Hide dynamic elements
        await page.addStyleTag({
          content: `
            .current-date,
            .auto-generated-id,
            .timestamp {
              visibility: hidden !important;
            }
          `
        })
        
        await expect(page).toHaveScreenshot('daily-report-form.png', {
          fullPage: true,
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should match form validation states', async ({ page }) => {
      await page.getByRole('link', { name: /daily reports|일일 보고서/i }).click()
      
      const createButton = page.getByRole('button', { name: /create|새로 만들기/i })
      if (await createButton.isVisible()) {
        await createButton.click()
        
        // Try to submit empty form to trigger validation
        const submitButton = page.getByRole('button', { name: /submit|제출/i })
        if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForTimeout(500) // Wait for validation messages
          
          await expect(page).toHaveScreenshot('form-validation-errors.png', {
            threshold: 0.3,
            animations: 'disabled'
          })
        }
      }
    })

    test('should match input components design', async ({ page }) => {
      await page.getByRole('link', { name: /daily reports|일일 보고서/i }).click()
      
      const createButton = page.getByRole('button', { name: /create|새로 만들기/i })
      if (await createButton.isVisible()) {
        await createButton.click()
        
        // Focus on different input types
        const textInput = page.getByLabel(/title|제목/i)
        if (await textInput.isVisible()) {
          await textInput.focus()
          await expect(textInput).toHaveScreenshot('text-input-focused.png', {
            threshold: 0.2,
            animations: 'disabled'
          })
        }
        
        const textarea = page.getByLabel(/content|내용/i)
        if (await textarea.isVisible()) {
          await textarea.focus()
          await expect(textarea).toHaveScreenshot('textarea-focused.png', {
            threshold: 0.2,
            animations: 'disabled'
          })
        }
      }
    })
  })

  test.describe('Modal and Dialog Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should match confirmation dialog design', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Try to delete a document to trigger confirmation
      const documentItem = page.getByTestId('document-item').first()
      if (await documentItem.isVisible()) {
        await documentItem.hover()
        
        const deleteButton = page.getByRole('button', { name: /delete|삭제/i })
        if (await deleteButton.isVisible()) {
          await deleteButton.click()
          await page.waitForTimeout(300)
          
          const confirmDialog = page.getByTestId('delete-confirmation')
          if (await confirmDialog.isVisible()) {
            await expect(confirmDialog).toHaveScreenshot('confirmation-dialog.png', {
              threshold: 0.2,
              animations: 'disabled'
            })
            
            // Cancel to close dialog
            const cancelButton = confirmDialog.getByRole('button', { name: /cancel|취소/i })
            if (await cancelButton.isVisible()) {
              await cancelButton.click()
            }
          }
        }
      }
    })

    test('should match settings modal design', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      
      // Look for settings button
      const settingsButton = page.getByRole('button', { name: /settings|설정/i })
      if (await settingsButton.isVisible()) {
        await settingsButton.click()
        await page.waitForTimeout(500)
        
        const settingsModal = page.getByTestId('settings-modal')
        if (await settingsModal.isVisible()) {
          await expect(settingsModal).toHaveScreenshot('settings-modal.png', {
            threshold: 0.2,
            animations: 'disabled'
          })
          
          // Close modal
          const closeButton = settingsModal.getByRole('button', { name: /close|닫기/i })
          if (await closeButton.isVisible()) {
            await closeButton.click()
          }
        }
      }
    })

    test('should match notification toast design', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      
      // Trigger a notification action
      await page.getByRole('link', { name: /attendance|출근/i }).click()
      
      const checkInButton = page.getByRole('button', { name: /check in|출근/i })
      if (await checkInButton.isVisible()) {
        await checkInButton.click()
        
        // Fill minimal required fields and submit
        const locationInput = page.getByLabel(/location|위치/i)
        if (await locationInput.isVisible()) {
          await locationInput.fill('Test Location')
        }
        
        const confirmButton = page.getByRole('button', { name: /confirm|확인/i })
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
          
          // Wait for success toast
          const toast = page.getByTestId('toast-notification')
          if (await toast.isVisible()) {
            await expect(toast).toHaveScreenshot('success-toast.png', {
              threshold: 0.2,
              animations: 'disabled'
            })
          }
        }
      }
    })
  })

  test.describe('Mobile Responsive Visual Tests', () => {
    test('should match mobile dashboard layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      await dashboardPage.navigateToDashboard()
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          .timestamp,
          .current-time,
          .real-time-data {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('mobile-dashboard.png', {
        fullPage: true,
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should match mobile navigation menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      await dashboardPage.navigateToDashboard()
      
      // Open mobile menu
      const menuButton = page.getByRole('button', { name: /menu|메뉴/i })
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(500)
        
        await expect(page).toHaveScreenshot('mobile-navigation-menu.png', {
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should match mobile form layouts', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      
      // Navigate to attendance check-in
      await page.getByRole('link', { name: /attendance|출근/i }).click()
      
      const checkInButton = page.getByRole('button', { name: /check in|출근/i })
      if (await checkInButton.isVisible()) {
        await checkInButton.click()
        await page.waitForTimeout(500)
        
        const mobileForm = page.getByTestId('check-in-modal')
        if (await mobileForm.isVisible()) {
          await expect(mobileForm).toHaveScreenshot('mobile-checkin-form.png', {
            threshold: 0.2,
            animations: 'disabled'
          })
        }
      }
    })
  })

  test.describe('Theme and Color Consistency Tests', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should match light theme colors', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      
      // Ensure light theme is active
      const themeToggle = page.getByRole('button', { name: /theme|테마/i })
      if (await themeToggle.isVisible()) {
        const currentTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        })
        
        if (currentTheme === 'dark') {
          await themeToggle.click()
          await page.waitForTimeout(500)
        }
      }
      
      // Test key UI elements for color consistency
      const colorTestElements = [
        page.getByTestId('sidebar'),
        page.getByTestId('top-navigation'),
        page.getByTestId('main-content'),
        page.getByRole('button').first(),
        page.getByRole('link').first()
      ]
      
      for (let i = 0; i < colorTestElements.length; i++) {
        const element = colorTestElements[i]
        if (await element.isVisible()) {
          await expect(element).toHaveScreenshot(`light-theme-element-${i}.png`, {
            threshold: 0.1,
            animations: 'disabled'
          })
        }
      }
    })

    test('should match dark theme colors if available', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      
      // Try to enable dark theme
      const themeToggle = page.getByRole('button', { name: /theme|dark|테마|다크/i })
      if (await themeToggle.isVisible()) {
        await themeToggle.click()
        await page.waitForTimeout(500)
        
        // Test dark theme consistency
        await expect(page).toHaveScreenshot('dark-theme-dashboard.png', {
          fullPage: true,
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should match button states and hover effects', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      
      const primaryButton = page.getByRole('button', { name: /create|새로 만들기/i }).first()
      if (await primaryButton.isVisible()) {
        // Normal state
        await expect(primaryButton).toHaveScreenshot('button-normal-state.png', {
          threshold: 0.1,
          animations: 'disabled'
        })
        
        // Hover state
        await primaryButton.hover()
        await page.waitForTimeout(200)
        await expect(primaryButton).toHaveScreenshot('button-hover-state.png', {
          threshold: 0.1,
          animations: 'disabled'
        })
        
        // Focus state
        await primaryButton.focus()
        await page.waitForTimeout(200)
        await expect(primaryButton).toHaveScreenshot('button-focus-state.png', {
          threshold: 0.1,
          animations: 'disabled'
        })
      }
    })
  })

  test.describe('Cross-Browser Visual Consistency', () => {
    test('should match design across different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop-large' },
        { width: 1366, height: 768, name: 'desktop-medium' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ]
      
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await dashboardPage.navigateToDashboard()
        await page.waitForLoadState('networkidle')
        
        // Hide dynamic elements
        await page.addStyleTag({
          content: `
            .timestamp,
            .current-time,
            .real-time-data {
              visibility: hidden !important;
            }
          `
        })
        
        await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should maintain font rendering consistency', async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      await dashboardPage.navigateToDashboard()
      
      // Test different text elements
      const textElements = [
        page.getByRole('heading').first(),
        page.getByRole('button').first(),
        page.getByRole('link').first(),
        page.getByText(/dashboard|대시보드/i).first()
      ]
      
      for (let i = 0; i < textElements.length; i++) {
        const element = textElements[i]
        if (await element.isVisible()) {
          await expect(element).toHaveScreenshot(`font-rendering-${i}.png`, {
            threshold: 0.1,
            animations: 'disabled'
          })
        }
      }
    })
  })

  test.describe('Error States Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should match 404 error page design', async ({ page }) => {
      await page.goto('/nonexistent-page')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('404-error-page.png', {
        fullPage: true,
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should match network error states', async ({ page }) => {
      await dashboardPage.navigateToDashboard()
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      // Try to perform an action that requires network
      await page.getByRole('link', { name: /daily reports|일일 보고서/i }).click()
      await page.waitForTimeout(2000) // Wait for error state
      
      const errorState = page.getByTestId('error-state')
      if (await errorState.isVisible()) {
        await expect(errorState).toHaveScreenshot('network-error-state.png', {
          threshold: 0.2,
          animations: 'disabled'
        })
      }
    })

    test('should match empty state designs', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Search for something that doesn't exist
      const searchInput = page.getByTestId('documents-search')
      if (await searchInput.isVisible()) {
        await searchInput.fill('nonexistentdocument12345')
        await searchInput.press('Enter')
        await page.waitForTimeout(1000)
        
        const emptyState = page.getByTestId('empty-state')
        if (await emptyState.isVisible()) {
          await expect(emptyState).toHaveScreenshot('documents-empty-state.png', {
            threshold: 0.2,
            animations: 'disabled'
          })
        }
      }
    })
  })
})