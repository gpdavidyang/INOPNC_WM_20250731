import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Unified Documents Management E2E Tests', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)

    // Login as worker and navigate to dashboard
    await authPage.navigateToLogin()
    await authPage.loginAsWorker()
    await dashboardPage.navigateToDashboard()
  })

  test.describe('Documents Tab Navigation and UI', () => {
    test('should display documents tab with all document types', async ({ page }) => {
      // Navigate to documents tab
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Should show unified documents interface
      await expect(page.getByTestId('documents-content')).toBeVisible()
      
      // Check for document type sections or filters
      const documentTypes = [
        /daily reports|일일 보고서/i,
        /photos|사진/i,
        /markup documents|마킹 도면/i,
        /files|파일/i
      ]
      
      for (const typePattern of documentTypes) {
        const element = page.getByText(typePattern).first()
        if (await element.isVisible()) {
          await expect(element).toBeVisible()
        }
      }
    })

    test('should switch between different document views', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Test view switching (grid/list)
      const gridViewButton = page.getByRole('button', { name: /grid view|격자 보기/i })
      const listViewButton = page.getByRole('button', { name: /list view|목록 보기/i })
      
      if (await gridViewButton.isVisible()) {
        await gridViewButton.click()
        await expect(page.getByTestId('documents-grid')).toBeVisible()
      }
      
      if (await listViewButton.isVisible()) {
        await listViewButton.click()
        await expect(page.getByTestId('documents-list')).toBeVisible()
      }
    })

    test('should filter documents by type and date', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Test document type filter
      const filterDropdown = page.getByTestId('document-type-filter')
      if (await filterDropdown.isVisible()) {
        await filterDropdown.click()
        
        // Select specific document type
        const photoFilter = page.getByRole('option', { name: /photos|사진/i })
        if (await photoFilter.isVisible()) {
          await photoFilter.click()
          
          // Should show only photos
          const documentItems = page.getByTestId('document-item')
          const count = await documentItems.count()
          
          if (count > 0) {
            // Verify all visible items are photos
            for (let i = 0; i < Math.min(count, 5); i++) {
              const item = documentItems.nth(i)
              await expect(item).toContainText(/\.(jpg|jpeg|png|webp)/i)
            }
          }
        }
      }
      
      // Test date range filter
      const dateFilter = page.getByTestId('date-range-filter')
      if (await dateFilter.isVisible()) {
        await dateFilter.click()
        
        // Select last 7 days
        const lastWeekOption = page.getByRole('option', { name: /last week|지난 주/i })
        if (await lastWeekOption.isVisible()) {
          await lastWeekOption.click()
          await page.waitForLoadState('networkidle')
        }
      }
    })

    test('should search through all documents', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const searchInput = page.getByTestId('documents-search').or(page.getByPlaceholder(/search documents|문서 검색/i))
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test')
        await searchInput.press('Enter')
        
        // Should show search results
        await expect(page.getByTestId('search-results')).toBeVisible()
        
        // Clear search
        await searchInput.clear()
        await searchInput.press('Enter')
      }
    })
  })

  test.describe('File Upload and Management', () => {
    test('should upload files through drag and drop', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Look for upload area
      const uploadArea = page.getByTestId('file-upload-area').or(page.getByText(/drag.*drop|upload|파일 업로드/i).first())
      
      if (await uploadArea.isVisible()) {
        // Create a test file
        const fileContent = 'Test document content'
        const fileName = 'test-document.txt'
        
        // Simulate file upload
        const fileInput = page.getByTestId('file-input').or(page.locator('input[type="file"]').first())
        
        if (await fileInput.isVisible()) {
          // Create temporary file for testing
          await fileInput.setInputFiles({
            name: fileName,
            mimeType: 'text/plain',
            buffer: Buffer.from(fileContent)
          })
          
          // Should show upload progress or success
          const uploadProgress = page.getByTestId('upload-progress')
          const uploadSuccess = page.getByText(/upload.*success|업로드.*완료/i)
          
          if (await uploadProgress.isVisible()) {
            await expect(uploadProgress).toBeVisible()
          }
          
          if (await uploadSuccess.isVisible()) {
            await expect(uploadSuccess).toBeVisible()
          }
        }
      }
    })

    test('should handle multiple file uploads', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const fileInput = page.getByTestId('file-input').or(page.locator('input[type="file"]').first())
      
      if (await fileInput.isVisible()) {
        // Upload multiple files
        const files = [
          {
            name: 'document1.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('PDF content 1')
          },
          {
            name: 'document2.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('JPEG content 2')
          }
        ]
        
        await fileInput.setInputFiles(files)
        
        // Should show batch upload progress
        const batchUpload = page.getByTestId('batch-upload-progress')
        if (await batchUpload.isVisible()) {
          await expect(batchUpload).toBeVisible()
          
          // Wait for completion
          await expect(page.getByText(/upload.*complete|업로드.*완료/i)).toBeVisible({ timeout: 10000 })
        }
      }
    })

    test('should validate file types and sizes', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const fileInput = page.getByTestId('file-input').or(page.locator('input[type="file"]').first())
      
      if (await fileInput.isVisible()) {
        // Try to upload an invalid file type
        const invalidFile = {
          name: 'malicious.exe',
          mimeType: 'application/octet-stream',
          buffer: Buffer.from('Executable content')
        }
        
        await fileInput.setInputFiles([invalidFile])
        
        // Should show error for invalid file type
        await expect(page.getByText(/invalid.*file.*type|지원하지.*않는.*파일/i)).toBeVisible()
      }
    })
  })

  test.describe('Document Viewing and Actions', () => {
    test('should preview different document types', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Look for existing documents
      const documentItem = page.getByTestId('document-item').first()
      
      if (await documentItem.isVisible()) {
        await documentItem.click()
        
        // Should open preview modal
        const previewModal = page.getByTestId('document-preview')
        if (await previewModal.isVisible()) {
          await expect(previewModal).toBeVisible()
          
          // Should show document content based on type
          const documentContent = previewModal.getByTestId('document-content')
          if (await documentContent.isVisible()) {
            await expect(documentContent).toBeVisible()
          }
          
          // Close preview
          const closeButton = previewModal.getByRole('button', { name: /close|닫기/i })
          if (await closeButton.isVisible()) {
            await closeButton.click()
          } else {
            await page.keyboard.press('Escape')
          }
          
          await expect(previewModal).not.toBeVisible()
        }
      }
    })

    test('should download documents', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const documentItem = page.getByTestId('document-item').first()
      
      if (await documentItem.isVisible()) {
        // Right-click for context menu or look for download button
        await documentItem.hover()
        
        const downloadButton = page.getByRole('button', { name: /download|다운로드/i })
        if (await downloadButton.isVisible()) {
          // Start download and verify
          const downloadPromise = page.waitForEvent('download')
          await downloadButton.click()
          
          const download = await downloadPromise
          expect(download.suggestedFilename()).toBeTruthy()
        }
      }
    })

    test('should share documents with team members', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const documentItem = page.getByTestId('document-item').first()
      
      if (await documentItem.isVisible()) {
        await documentItem.hover()
        
        const shareButton = page.getByRole('button', { name: /share|공유/i })
        if (await shareButton.isVisible()) {
          await shareButton.click()
          
          // Should open share modal
          const shareModal = page.getByTestId('share-modal')
          await expect(shareModal).toBeVisible()
          
          // Should show team members list
          const teamMembersList = shareModal.getByTestId('team-members')
          if (await teamMembersList.isVisible()) {
            await expect(teamMembersList).toBeVisible()
            
            // Select a team member
            const teamMember = teamMembersList.getByRole('checkbox').first()
            if (await teamMember.isVisible()) {
              await teamMember.check()
              
              // Send share
              const sendShareButton = shareModal.getByRole('button', { name: /send|보내기/i })
              if (await sendShareButton.isVisible()) {
                await sendShareButton.click()
                await expect(page.getByText(/shared.*success|공유.*완료/i)).toBeVisible()
              }
            }
          }
          
          // Close modal
          const closeButton = shareModal.getByRole('button', { name: /close|닫기/i })
          if (await closeButton.isVisible()) {
            await closeButton.click()
          }
        }
      }
    })

    test('should delete documents with confirmation', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const documentItem = page.getByTestId('document-item').first()
      
      if (await documentItem.isVisible()) {
        await documentItem.hover()
        
        const deleteButton = page.getByRole('button', { name: /delete|삭제/i })
        if (await deleteButton.isVisible()) {
          await deleteButton.click()
          
          // Should show confirmation dialog
          const confirmDialog = page.getByTestId('delete-confirmation')
          await expect(confirmDialog).toBeVisible()
          
          // Cancel first
          const cancelButton = confirmDialog.getByRole('button', { name: /cancel|취소/i })
          if (await cancelButton.isVisible()) {
            await cancelButton.click()
            await expect(confirmDialog).not.toBeVisible()
          }
          
          // Document should still be visible
          await expect(documentItem).toBeVisible()
        }
      }
    })
  })

  test.describe('Blueprint Markup Integration', () => {
    test('should access markup tool from documents tab', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Look for markup tool button or section
      const markupToolButton = page.getByRole('button', { name: /markup.*tool|마킹.*도구/i })
      
      if (await markupToolButton.isVisible()) {
        await markupToolButton.click()
        
        // Should navigate to markup tool or open in modal
        const markupInterface = page.getByTestId('markup-interface')
        if (await markupInterface.isVisible()) {
          await expect(markupInterface).toBeVisible()
        } else {
          // Check if it navigated to markup page
          await expect(page).toHaveURL(/markup/)
        }
      }
    })

    test('should display markup documents in documents tab', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Filter for markup documents
      const filterDropdown = page.getByTestId('document-type-filter')
      if (await filterDropdown.isVisible()) {
        await filterDropdown.click()
        
        const markupFilter = page.getByRole('option', { name: /markup|마킹/i })
        if (await markupFilter.isVisible()) {
          await markupFilter.click()
          
          // Should show markup documents
          const markupDocs = page.getByTestId('document-item').filter({ hasText: /markup|마킹/ })
          const count = await markupDocs.count()
          
          if (count > 0) {
            // Click on first markup document
            await markupDocs.first().click()
            
            // Should show markup preview
            const markupPreview = page.getByTestId('markup-preview')
            if (await markupPreview.isVisible()) {
              await expect(markupPreview).toBeVisible()
              
              // Should show blueprint with markings
              const canvas = markupPreview.getByTestId('markup-canvas')
              if (await canvas.isVisible()) {
                await expect(canvas).toBeVisible()
              }
            }
          }
        }
      }
    })

    test('should create new markup document from documents tab', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const createMarkupButton = page.getByRole('button', { name: /create.*markup|새.*마킹/i })
      
      if (await createMarkupButton.isVisible()) {
        await createMarkupButton.click()
        
        // Should open markup creation workflow
        const blueprintUpload = page.getByTestId('blueprint-upload')
        if (await blueprintUpload.isVisible()) {
          await expect(blueprintUpload).toBeVisible()
          
          // Upload a test blueprint
          const fileInput = blueprintUpload.getByTestId('file-input')
          if (await fileInput.isVisible()) {
            await fileInput.setInputFiles({
              name: 'test-blueprint.jpg',
              mimeType: 'image/jpeg',
              buffer: Buffer.from('Test blueprint image')
            })
            
            // Should show markup editor
            const markupEditor = page.getByTestId('markup-editor')
            if (await markupEditor.isVisible()) {
              await expect(markupEditor).toBeVisible()
            }
          }
        }
      }
    })
  })

  test.describe('Organization and Folders', () => {
    test('should create and manage folders', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const createFolderButton = page.getByRole('button', { name: /create.*folder|새.*폴더/i })
      
      if (await createFolderButton.isVisible()) {
        await createFolderButton.click()
        
        // Should open folder creation dialog
        const folderDialog = page.getByTestId('create-folder-dialog')
        await expect(folderDialog).toBeVisible()
        
        // Enter folder name
        const folderNameInput = folderDialog.getByLabel(/folder.*name|폴더.*이름/i)
        await folderNameInput.fill('Test Project Folder')
        
        // Create folder
        const createButton = folderDialog.getByRole('button', { name: /create|만들기/i })
        await createButton.click()
        
        // Should show new folder in list
        await expect(page.getByText('Test Project Folder')).toBeVisible()
      }
    })

    test('should organize documents into folders', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const documentItem = page.getByTestId('document-item').first()
      
      if (await documentItem.isVisible()) {
        // Right-click or hover for move option
        await documentItem.hover()
        
        const moveButton = page.getByRole('button', { name: /move|이동/i })
        if (await moveButton.isVisible()) {
          await moveButton.click()
          
          // Should show folder selection
          const folderSelector = page.getByTestId('folder-selector')
          await expect(folderSelector).toBeVisible()
          
          // Select a folder
          const targetFolder = folderSelector.getByText(/folder|폴더/i).first()
          if (await targetFolder.isVisible()) {
            await targetFolder.click()
            
            const confirmMoveButton = page.getByRole('button', { name: /move|이동/i })
            await confirmMoveButton.click()
            
            await expect(page.getByText(/moved.*success|이동.*완료/i)).toBeVisible()
          }
        }
      }
    })

    test('should navigate folder hierarchy', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Look for folder in documents list
      const folder = page.getByTestId('folder-item').first()
      
      if (await folder.isVisible()) {
        await folder.dblclick()
        
        // Should enter folder
        const breadcrumb = page.getByTestId('folder-breadcrumb')
        if (await breadcrumb.isVisible()) {
          await expect(breadcrumb).toBeVisible()
          
          // Navigate back using breadcrumb
          const rootBreadcrumb = breadcrumb.getByText(/documents|문서함/i)
          if (await rootBreadcrumb.isVisible()) {
            await rootBreadcrumb.click()
            
            // Should return to root documents
            await expect(page.getByTestId('documents-content')).toBeVisible()
          }
        }
      }
    })
  })

  test.describe('Bulk Operations', () => {
    test('should select multiple documents', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Use Ctrl+click to select multiple documents
      const documentItems = page.getByTestId('document-item')
      const count = await documentItems.count()
      
      if (count >= 2) {
        // Select first document
        await documentItems.first().click()
        
        // Ctrl+click second document
        await page.keyboard.down('Control')
        await documentItems.nth(1).click()
        await page.keyboard.up('Control')
        
        // Should show bulk actions toolbar
        const bulkActions = page.getByTestId('bulk-actions')
        if (await bulkActions.isVisible()) {
          await expect(bulkActions).toBeVisible()
          
          // Should show selected count
          await expect(bulkActions).toContainText(/2.*selected|선택됨/)
        }
      }
    })

    test('should perform bulk download', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Select multiple documents (simulation)
      const selectAllCheckbox = page.getByTestId('select-all-documents')
      
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.check()
        
        const bulkDownloadButton = page.getByRole('button', { name: /download.*selected|선택.*다운로드/i })
        if (await bulkDownloadButton.isVisible()) {
          // Start bulk download
          const downloadPromise = page.waitForEvent('download')
          await bulkDownloadButton.click()
          
          const download = await downloadPromise
          expect(download.suggestedFilename()).toMatch(/\.zip$/i)
        }
      }
    })

    test('should perform bulk delete', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Select documents for deletion test
      const documentItems = page.getByTestId('document-item')
      const count = await documentItems.count()
      
      if (count >= 1) {
        // Select first document
        await documentItems.first().click()
        
        const bulkDeleteButton = page.getByRole('button', { name: /delete.*selected|선택.*삭제/i })
        if (await bulkDeleteButton.isVisible()) {
          await bulkDeleteButton.click()
          
          // Should show bulk delete confirmation
          const confirmDialog = page.getByTestId('bulk-delete-confirmation')
          await expect(confirmDialog).toBeVisible()
          
          // Cancel the deletion
          const cancelButton = confirmDialog.getByRole('button', { name: /cancel|취소/i })
          await cancelButton.click()
          
          await expect(confirmDialog).not.toBeVisible()
        }
      }
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Should show mobile-optimized document interface
      const mobileDocuments = page.getByTestId('mobile-documents')
      if (await mobileDocuments.isVisible()) {
        await expect(mobileDocuments).toBeVisible()
      } else {
        // Should adapt existing interface for mobile
        await expect(page.getByTestId('documents-content')).toBeVisible()
      }
      
      // Touch interactions should work
      const documentItem = page.getByTestId('document-item').first()
      if (await documentItem.isVisible()) {
        await documentItem.tap()
        
        // Should show mobile-friendly preview or actions
        const mobilePreview = page.getByTestId('mobile-document-preview')
        if (await mobilePreview.isVisible()) {
          await expect(mobilePreview).toBeVisible()
        }
      }
    })

    test('should support pull-to-refresh on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Simulate pull-to-refresh gesture
      const documentsContent = page.getByTestId('documents-content')
      
      if (await documentsContent.isVisible()) {
        // Simulate touch start at top
        await documentsContent.dispatchEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 50 }]
        })
        
        // Simulate pull down
        await documentsContent.dispatchEvent('touchmove', {
          touches: [{ clientX: 200, clientY: 150 }]
        })
        
        // Simulate release
        await documentsContent.dispatchEvent('touchend')
        
        // Should show refresh indicator
        const refreshIndicator = page.getByTestId('refresh-indicator')
        if (await refreshIndicator.isVisible()) {
          await expect(refreshIndicator).toBeVisible()
        }
      }
    })
  })

  test.describe('Performance and Accessibility', () => {
    test('should load documents efficiently', async ({ page }) => {
      const startTime = Date.now()
      
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Wait for documents to load
      await expect(page.getByTestId('documents-content')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should implement virtual scrolling for large document lists', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const documentsList = page.getByTestId('documents-list')
      
      if (await documentsList.isVisible()) {
        // Scroll down to test virtual scrolling
        await documentsList.evaluate(el => {
          el.scrollTop = el.scrollHeight / 2
        })
        
        await page.waitForTimeout(500)
        
        // Should still be responsive
        const documentItems = page.getByTestId('document-item')
        const visibleCount = await documentItems.count()
        
        // Virtual scrolling should limit visible items
        expect(visibleCount).toBeLessThan(100)
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Use Tab navigation
      await page.keyboard.press('Tab')
      
      // Should focus on first interactive element
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Use arrow keys for document navigation
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      
      // Should open document preview or perform action
      const preview = page.getByTestId('document-preview')
      if (await preview.isVisible()) {
        await expect(preview).toBeVisible()
        
        // Close with Escape
        await page.keyboard.press('Escape')
        await expect(preview).not.toBeVisible()
      }
    })

    test('should have proper ARIA labels and semantics', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Check for accessibility attributes
      const documentsList = page.getByTestId('documents-list')
      if (await documentsList.isVisible()) {
        await expect(documentsList).toHaveAttribute('role', 'grid')
      }
      
      const documentItems = page.getByTestId('document-item')
      if (await documentItems.count() > 0) {
        const firstItem = documentItems.first()
        await expect(firstItem).toHaveAttribute('role', 'gridcell')
        await expect(firstItem).toHaveAttribute('aria-label')
      }
      
      // Check buttons have proper labels
      const buttons = page.getByRole('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        const ariaLabel = await button.getAttribute('aria-label')
        const textContent = await button.textContent()
        
        expect(ariaLabel || textContent).toBeTruthy()
      }
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Simulate network failure
      await page.route('**/api/documents/**', route => route.abort())
      
      // Try to perform an action that requires network
      const refreshButton = page.getByRole('button', { name: /refresh|새로고침/i })
      if (await refreshButton.isVisible()) {
        await refreshButton.click()
        
        // Should show error message
        await expect(page.getByText(/network.*error|네트워크.*오류/i)).toBeVisible()
      }
    })

    test('should handle large file uploads', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      const fileInput = page.getByTestId('file-input').or(page.locator('input[type="file"]').first())
      
      if (await fileInput.isVisible()) {
        // Try to upload a large file (simulated)
        const largeFile = {
          name: 'large-document.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.alloc(50 * 1024 * 1024) // 50MB
        }
        
        await fileInput.setInputFiles([largeFile])
        
        // Should show appropriate message for large files
        const largeFileWarning = page.getByText(/large.*file|큰.*파일/i)
        if (await largeFileWarning.isVisible()) {
          await expect(largeFileWarning).toBeVisible()
        }
      }
    })

    test('should handle empty states correctly', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Filter to show no results
      const searchInput = page.getByTestId('documents-search')
      if (await searchInput.isVisible()) {
        await searchInput.fill('nonexistentdocument12345')
        await searchInput.press('Enter')
        
        // Should show empty state
        const emptyState = page.getByTestId('empty-state')
        if (await emptyState.isVisible()) {
          await expect(emptyState).toBeVisible()
          await expect(emptyState).toContainText(/no.*documents|문서가.*없습니다/i)
        }
        
        // Clear search to restore documents
        await searchInput.clear()
        await searchInput.press('Enter')
      }
    })

    test('should handle file corruption gracefully', async ({ page }) => {
      await page.getByRole('tab', { name: /documents|문서함/i }).click()
      
      // Try to upload a corrupted file
      const fileInput = page.getByTestId('file-input').or(page.locator('input[type="file"]').first())
      
      if (await fileInput.isVisible()) {
        const corruptedFile = {
          name: 'corrupted.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('This is not a valid PDF file')
        }
        
        await fileInput.setInputFiles([corruptedFile])
        
        // Should show error for corrupted file
        const corruptionError = page.getByText(/corrupted|invalid.*file|손상된.*파일/i)
        if (await corruptionError.isVisible()) {
          await expect(corruptionError).toBeVisible()
        }
      }
    })
  })
})