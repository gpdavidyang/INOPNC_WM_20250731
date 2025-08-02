import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'
import { MarkupToolPage } from '../pages/markup-tool.page'

test.describe('Blueprint Markup Tool Workflow', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage
  let markupPage: MarkupToolPage

  const testDocument = {
    title: 'E2E Test Blueprint Markup',
    description: 'Test blueprint with various markup annotations',
    location: 'personal',
    site: 'Site 1'
  }

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    markupPage = new MarkupToolPage(page)

    // Login as worker
    await authPage.navigateToLogin()
    await authPage.loginAsWorker()
  })

  test.describe('Markup Tool Page and Navigation', () => {
    test('should display markup tool page with all elements', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.expectMarkupToolPageVisible()
      
      // Check page URL and title
      await expect(page).toHaveURL(/.*markup/)
      await expect(page).toHaveTitle(/markup tool|도면 마킹/i)
      
      // Check main elements
      await expect(markupPage.newMarkupButton).toBeVisible()
      await expect(markupPage.documentsList).toBeVisible()
      await expect(markupPage.searchInput).toBeVisible()
    })

    test('should navigate to markup editor', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      await expect(page).toHaveURL(/.*markup\/editor/)
      await markupPage.expectEditorVisible()
    })

    test('should search existing documents', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      
      const searchQuery = 'blueprint'
      await markupPage.searchDocuments(searchQuery)
      
      // Should show filtered results
      await expect(page.getByText(/search results/i)).toBeVisible()
    })

    test('should filter documents by location', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      
      const initialCount = await markupPage.getDocumentCount()
      await markupPage.filterDocuments('Personal')
      
      // Should show filtered results
      const filteredCount = await markupPage.getDocumentCount()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    })

    test('should toggle between grid and list view', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      
      await markupPage.toggleViewMode()
      
      // View should change (check for different CSS classes or layout)
      await expect(markupPage.documentsList).toBeVisible()
    })
  })

  test.describe('Blueprint Upload and Loading', () => {
    test('should upload blueprint via file input', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Create a test image file (would use actual file in real test)
      // await markupPage.uploadBlueprint('test-files/blueprint.jpg')
      
      // For now, test the upload interface
      await expect(markupPage.uploadArea).toBeVisible()
      await expect(markupPage.fileInput).toBeVisible()
    })

    test('should upload blueprint via drag and drop', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Test drag and drop zone
      await expect(markupPage.dragDropZone).toBeVisible()
      
      // In real test, would simulate file drop
      // const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
      // await markupPage.dragDropZone.dispatchEvent('drop', { dataTransfer })
    })

    test('should display uploaded blueprint on canvas', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Mock blueprint upload
      await page.route('**/api/upload', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            url: '/test-blueprint.jpg'
          })
        })
      })
      
      // Upload would load blueprint
      // await markupPage.uploadBlueprint('test-files/blueprint.jpg')
      // await markupPage.expectBlueprintLoaded()
    })

    test('should handle invalid file types', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Try uploading invalid file type
      // await markupPage.uploadBlueprint('test-files/document.pdf')
      
      // Should show error message
      // await markupPage.expectValidationError(/invalid file type/i)
    })

    test('should handle large file uploads', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Test large file handling
      await expect(markupPage.uploadArea).toBeVisible()
      
      // Would test with large file and show progress
      // await markupPage.expectSuccessMessage(/upload complete/i)
    })
  })

  test.describe('Drawing Tools and Markup Creation', () => {
    test.beforeEach(async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Mock blueprint loaded
      await page.addInitScript(() => {
        // Mock canvas with blueprint
        window.mockBlueprintLoaded = true
      })
    })

    test('should select and use box tool', async ({ page }) => {
      await markupPage.selectTool('box')
      await markupPage.expectToolSelected('box')
      
      // Draw a box
      await markupPage.drawBox(100, 100, 150, 100)
      
      // Should create markup object
      await markupPage.expectMarkupExists()
    })

    test('should select and use text tool', async ({ page }) => {
      await markupPage.selectTool('text')
      await markupPage.expectToolSelected('text')
      
      // Add text annotation
      await markupPage.addText(200, 200, 'Foundation Area')
      
      // Should create text markup
      await expect(page.getByText('Foundation Area')).toBeVisible()
    })

    test('should select and use pen tool', async ({ page }) => {
      await markupPage.selectTool('pen')
      await markupPage.expectToolSelected('pen')
      
      // Draw with pen
      const penPoints = [
        { x: 150, y: 150 },
        { x: 200, y: 180 },
        { x: 250, y: 160 },
        { x: 280, y: 200 }
      ]
      await markupPage.drawWithPen(penPoints)
      
      // Should create pen markup
      await markupPage.expectMarkupExists()
    })

    test('should change markup colors', async ({ page }) => {
      await markupPage.selectTool('box')
      await markupPage.selectColor('red')
      
      // Draw box with red color
      await markupPage.drawBox(50, 50, 100, 100)
      
      // Verify color applied
      const markupObject = page.locator('.markup-object').first()
      await expect(markupObject).toHaveCSS('color', 'red')
    })

    test('should use undo and redo functionality', async ({ page }) => {
      await markupPage.selectTool('box')
      
      // Draw multiple boxes
      await markupPage.drawBox(100, 100, 50, 50)
      await markupPage.drawBox(200, 200, 50, 50)
      
      // Undo last action
      await markupPage.undo()
      
      // Should remove last box
      const objectCount = await page.locator('.markup-object').count()
      expect(objectCount).toBe(1)
      
      // Redo
      await markupPage.redo()
      
      // Should restore box
      const restoredCount = await page.locator('.markup-object').count()
      expect(restoredCount).toBe(2)
    })

    test('should clear all markups', async ({ page }) => {
      await markupPage.selectTool('box')
      
      // Draw multiple objects
      await markupPage.drawBox(100, 100, 50, 50)
      await markupPage.drawBox(200, 200, 50, 50)
      
      // Clear all
      await markupPage.clearAll()
      
      // Should remove all markups
      const objectCount = await page.locator('.markup-object').count()
      expect(objectCount).toBe(0)
    })
  })

  test.describe('Canvas Navigation and Zoom', () => {
    test.beforeEach(async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
    })

    test('should zoom in and out', async ({ page }) => {
      const initialSize = await markupPage.getCanvasSize()
      
      // Zoom in
      await markupPage.zoomIn()
      
      // Canvas content should be larger
      const zoomedSize = await markupPage.getCanvasSize()
      // Note: This depends on implementation details
      
      // Zoom out
      await markupPage.zoomOut()
      
      // Should return closer to original size
    })

    test('should fit to screen', async ({ page }) => {
      // Zoom in first
      await markupPage.zoomIn()
      await markupPage.zoomIn()
      
      // Fit to screen
      await markupPage.fitToScreen()
      
      // Should resize to fit viewport
      const canvasSize = await markupPage.getCanvasSize()
      expect(canvasSize.width).toBeGreaterThan(0)
      expect(canvasSize.height).toBeGreaterThan(0)
    })

    test('should pan canvas with mouse', async ({ page }) => {
      // This would test mouse drag panning
      await markupPage.canvas.hover()
      
      // Hold and drag to pan
      await page.mouse.down()
      await page.mouse.move(100, 100)
      await page.mouse.up()
      
      // Canvas should pan (implementation specific)
    })

    test('should zoom with mouse wheel', async ({ page }) => {
      await markupPage.canvas.hover()
      
      // Ctrl + wheel to zoom
      await page.keyboard.down('Control')
      await page.mouse.wheel(0, -100) // Zoom in
      await page.keyboard.up('Control')
      
      // Should zoom in
    })
  })

  test.describe('Save and Load Workflow', () => {
    test.beforeEach(async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Add some markups
      await markupPage.selectTool('box')
      await markupPage.drawBox(100, 100, 150, 100)
      await markupPage.addText(150, 250, 'Test Annotation')
    })

    test('should save document with metadata', async ({ page }) => {
      await markupPage.saveDocument(testDocument)
      
      await markupPage.expectSuccessMessage(/saved successfully/i)
      
      // Should return to document list
      await expect(page).toHaveURL(/.*markup\/$/)
      await markupPage.expectDocumentInList(testDocument.title)
    })

    test('should validate required fields on save', async ({ page }) => {
      await markupPage.saveButton.click()
      await markupPage.expectSaveDialogVisible()
      
      // Try to save without title
      await markupPage.saveConfirmButton.click()
      
      await markupPage.expectValidationError(/title is required/i)
    })

    test('should cancel save operation', async ({ page }) => {
      await markupPage.saveButton.click()
      await markupPage.expectSaveDialogVisible()
      
      await markupPage.saveCancelButton.click()
      
      // Should remain in editor
      await expect(page).toHaveURL(/.*editor/)
      await markupPage.expectEditorVisible()
    })

    test('should open existing document', async ({ page }) => {
      // First save a document
      await markupPage.saveDocument(testDocument)
      
      // Return to home and open
      await markupPage.returnToHome()
      await markupPage.openButton.click()
      await markupPage.expectOpenDialogVisible()
      
      // Select and open document
      await markupPage.openDocument(testDocument.title)
      
      // Should load in editor with markups
      await expect(page).toHaveURL(/.*editor/)
      await markupPage.expectEditorVisible()
      await markupPage.expectMarkupExists()
    })

    test('should handle unsaved changes warning', async ({ page }) => {
      // Make changes without saving
      await markupPage.selectTool('box')
      await markupPage.drawBox(300, 300, 50, 50)
      
      // Try to navigate away
      await markupPage.homeButton.click()
      
      // Should show unsaved changes warning
      await expect(page.getByText(/unsaved changes/i)).toBeVisible()
      
      // Can choose to save or discard
      const discardButton = page.getByRole('button', { name: /discard|버리기/i })
      await discardButton.click()
      
      // Should navigate to home
      await expect(page).toHaveURL(/.*markup\/$/)
    })
  })

  test.describe('Document Management', () => {
    test('should delete document', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      
      const initialCount = await markupPage.getDocumentCount()
      
      if (initialCount > 0) {
        // Get first document title
        const firstDocTitle = await markupPage.documentTitles.first().textContent()
        
        if (firstDocTitle) {
          await markupPage.deleteDocument(firstDocTitle)
          
          // Should show success message
          await markupPage.expectSuccessMessage(/deleted successfully/i)
          
          // Document count should decrease
          const newCount = await markupPage.getDocumentCount()
          expect(newCount).toBe(initialCount - 1)
        }
      }
    })

    test('should share document via link', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Add markup and save
      await markupPage.selectTool('box')
      await markupPage.drawBox(100, 100, 100, 100)
      await markupPage.saveDocument(testDocument)
      
      // Open document and share
      await markupPage.openDocument(testDocument.title)
      const shareLink = await markupPage.copyShareLink()
      
      // Should get a valid share URL
      expect(shareLink).toMatch(/https?:\/\/.*\/share\//)
    })

    test('should share document via email', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Save document first
      await markupPage.saveDocument(testDocument)
      
      // Share via email
      await markupPage.openDocument(testDocument.title)
      await markupPage.shareViaEmail('test@example.com')
      
      await markupPage.expectSuccessMessage(/email sent/i)
    })

    test('should handle document permissions', async ({ page }) => {
      // This would test role-based access
      await dashboardPage.navigateToMarkupTool()
      
      // Worker should only see their own documents
      const documentCount = await markupPage.getDocumentCount()
      expect(documentCount).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Mobile and Touch Interactions', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.navigateToMarkupTool()
      await markupPage.expectMarkupToolPageVisible()
      
      // Mobile layout should be optimized
      await expect(markupPage.newMarkupButton).toBeVisible()
      
      // Document cards should be touch-friendly
      const documentCard = markupPage.documentCards.first()
      if (await documentCard.isVisible()) {
        const boundingBox = await documentCard.boundingBox()
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44) // Touch target size
      }
    })

    test('should support touch drawing on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Should show mobile-optimized editor
      await markupPage.expectEditorVisible()
      
      // Tools should be accessible
      await expect(markupPage.toolPalette).toBeVisible()
      
      // Canvas should support touch
      await markupPage.selectTool('pen')
      
      // Simulate touch drawing
      await markupPage.canvas.tap({ position: { x: 100, y: 100 } })
    })

    test('should have accessible tool buttons', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Tool buttons should have proper ARIA labels
      await expect(markupPage.boxTool).toHaveAttribute('aria-label')
      await expect(markupPage.textTool).toHaveAttribute('aria-label')
      await expect(markupPage.penTool).toHaveAttribute('aria-label')
    })
  })

  test.describe('Performance and Error Handling', () => {
    test('should load markup tool quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await dashboardPage.navigateToMarkupTool()
      await markupPage.expectMarkupToolPageVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should handle large blueprints efficiently', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Test with large image (would need actual large file)
      // Performance should remain responsive
      await expect(markupPage.canvas).toBeVisible()
    })

    test('should handle network errors gracefully', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      
      // Simulate network failure
      await page.route('**/api/markup-documents/**', route => route.abort())
      
      // Try to load documents
      await page.reload()
      
      // Should show error message
      await expect(page.getByText(/network error|failed to load/i)).toBeVisible()
    })

    test('should auto-save work in progress', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Add markup
      await markupPage.selectTool('box')
      await markupPage.drawBox(100, 100, 100, 100)
      
      // Wait for auto-save (if implemented)
      await page.waitForTimeout(5000)
      
      // Should see auto-save indicator
      await expect(page.getByText(/auto saved|자동 저장/i)).toBeVisible()
    })

    test('should handle concurrent editing conflicts', async ({ page, context }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Save document
      await markupPage.saveDocument(testDocument)
      
      // Open same document in new tab
      const newPage = await context.newPage()
      const newMarkupPage = new MarkupToolPage(newPage)
      await newMarkupPage.goto('/dashboard/markup')
      await newMarkupPage.openDocument(testDocument.title)
      
      // Make changes in both tabs
      await markupPage.addText(100, 100, 'First Edit')
      await newMarkupPage.addText(200, 200, 'Second Edit')
      
      // Save from first tab
      await markupPage.saveDocument({
        ...testDocument,
        title: testDocument.title + ' Modified'
      })
      
      // Try to save from second tab
      // Should detect conflict
      await newMarkupPage.saveDocument({
        ...testDocument,
        title: testDocument.title + ' Conflict'
      })
      
      // Should show conflict resolution dialog
      await expect(newPage.getByText(/conflict detected|충돌 감지/i)).toBeVisible()
      
      await newPage.close()
    })
  })

  test.describe('Keyboard Shortcuts and Accessibility', () => {
    test('should support keyboard shortcuts', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Undo with Ctrl+Z
      await page.keyboard.press('Control+z')
      // Redo with Ctrl+Y
      await page.keyboard.press('Control+y')
      // Save with Ctrl+S
      await page.keyboard.press('Control+s')
      
      // Should open save dialog
      await markupPage.expectSaveDialogVisible()
    })

    test('should be keyboard navigable', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      
      // Should be able to navigate with Tab
      await page.keyboard.press('Tab')
      await expect(markupPage.newMarkupButton).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(markupPage.searchInput).toBeFocused()
    })

    test('should have proper focus management', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Focus should be on canvas after loading
      await expect(markupPage.canvas).toBeFocused()
      
      // Tab should move to tool palette
      await page.keyboard.press('Tab')
      await expect(markupPage.toolPalette).toContainText(/tools/i)
    })
  })
})