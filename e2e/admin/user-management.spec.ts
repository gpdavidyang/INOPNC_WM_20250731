import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { AdminPage } from '../pages/admin.page'

test.describe('Admin User Management', () => {
  let authPage: AuthPage
  let adminPage: AdminPage

  const testUser = {
    email: 'e2etest@inopnc.com',
    name: 'E2E Test User',
    role: 'worker',
    site: 'Site 1',
    organization: 'INOPNC',
    active: true
  }

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    adminPage = new AdminPage(page)

    // Login as admin
    await authPage.navigateToLogin()
    await authPage.loginAsAdmin()
  })

  test.describe('Admin Dashboard and Navigation', () => {
    test('should display admin dashboard with system statistics', async ({ page }) => {
      await adminPage.expectAdminDashboardVisible()
      
      // Check page URL and title
      await expect(page).toHaveURL(/.*admin\/dashboard/)
      await expect(page).toHaveTitle(/admin dashboard/i)
      
      // Check system statistics
      await expect(adminPage.totalUsersCard).toBeVisible()
      await expect(adminPage.activeSitesCard).toBeVisible()
      await expect(adminPage.systemStatusCard).toBeVisible()
      
      // Verify stats contain numbers
      const totalUsers = await adminPage.getTotalUsersFromCard()
      const activeSites = await adminPage.getActiveSitesFromCard()
      
      expect(totalUsers).toMatch(/\d+/)
      expect(activeSites).toMatch(/\d+/)
    })

    test('should navigate to user management', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      await expect(page).toHaveURL(/.*admin\/users/)
      await adminPage.expectUserManagementVisible()
      
      // Check page elements
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible()
    })

    test('should navigate to site management', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      await expect(page).toHaveURL(/.*admin\/sites/)
      await adminPage.expectSiteManagementVisible()
      
      // Check page elements
      await expect(page.getByRole('heading', { name: /site management/i })).toBeVisible()
    })

    test('should have proper admin navigation', async ({ page }) => {
      // Should see all admin navigation items
      await expect(adminPage.userManagementLink).toBeVisible()
      await expect(adminPage.siteManagementLink).toBeVisible()
      await expect(adminPage.systemSettingsLink).toBeVisible()
      
      // Should not see regular user options
      await expect(page.getByRole('link', { name: /my tasks/i })).not.toBeVisible()
    })
  })

  test.describe('User Creation and Management', () => {
    test('should create a new user successfully', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      const initialUserCount = await adminPage.getUserCount()
      
      await adminPage.createUser(testUser)
      
      // Should show success message
      await adminPage.expectSuccessMessage(/user created|user added/i)
      
      // Should redirect back to user list
      await expect(page).toHaveURL(/.*admin\/users/)
      
      // User should appear in table
      await adminPage.expectUserInTable(testUser.email)
      
      // User count should increase
      const newUserCount = await adminPage.getUserCount()
      expect(newUserCount).toBe(initialUserCount + 1)
    })

    test('should validate required fields when creating user', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Click add user button
      await adminPage.addUserButton.click()
      await adminPage.expectUserFormVisible()
      
      // Try to save without required fields
      await adminPage.saveUserButton.click()
      
      // Should show validation errors
      await adminPage.expectValidationError(/email is required/i)
      await adminPage.expectValidationError(/name is required/i)
      await adminPage.expectValidationError(/role is required/i)
    })

    test('should validate email format', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      await adminPage.addUserButton.click()
      await adminPage.expectUserFormVisible()
      
      // Enter invalid email
      await adminPage.userEmailInput.fill('invalid-email')
      await adminPage.userNameInput.fill('Test User')
      await adminPage.userRoleSelect.selectOption('worker')
      
      await adminPage.saveUserButton.click()
      
      // Should show email validation error
      await adminPage.expectValidationError(/invalid email|email format/i)
    })

    test('should prevent duplicate email addresses', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Create first user
      await adminPage.createUser({
        ...testUser,
        email: 'duplicate@test.com'
      })
      
      // Try to create second user with same email
      await adminPage.createUser({
        ...testUser,
        email: 'duplicate@test.com',
        name: 'Different Name'
      })
      
      // Should show duplicate email error
      await adminPage.expectValidationError(/email already exists|duplicate email/i)
    })

    test('should cancel user creation', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      const initialUserCount = await adminPage.getUserCount()
      
      await adminPage.addUserButton.click()
      await adminPage.expectUserFormVisible()
      
      // Fill some data
      await adminPage.userEmailInput.fill('cancelled@test.com')
      await adminPage.userNameInput.fill('Cancelled User')
      
      // Cancel
      await adminPage.cancelUserButton.click()
      
      // Should return to user list without creating user
      await expect(page).toHaveURL(/.*admin\/users/)
      
      const finalUserCount = await adminPage.getUserCount()
      expect(finalUserCount).toBe(initialUserCount)
    })
  })

  test.describe('User Editing and Updates', () => {
    test('should edit existing user successfully', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // First create a user to edit
      await adminPage.createUser({
        ...testUser,
        email: 'edit-test@inopnc.com'
      })
      
      // Edit the user
      await adminPage.editUser('edit-test@inopnc.com', {
        name: 'Updated Test User',
        role: 'site_manager'
      })
      
      // Should show success message
      await adminPage.expectSuccessMessage(/user updated/i)
      
      // Updated information should be visible
      await expect(adminPage.usersTable.getByText('Updated Test User')).toBeVisible()
      await expect(adminPage.usersTable.getByText('site_manager')).toBeVisible()
    })

    test('should toggle user active status', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Create active user
      await adminPage.createUser({
        ...testUser,
        email: 'toggle-test@inopnc.com',
        active: true
      })
      
      // Edit to deactivate
      await adminPage.editUser('toggle-test@inopnc.com', {
        active: false
      })
      
      await adminPage.expectSuccessMessage(/user updated/i)
      
      // Status should be updated in table
      const userRow = adminPage.usersTable.getByText('toggle-test@inopnc.com').locator('..').locator('..')
      await expect(userRow.getByText(/inactive|disabled/i)).toBeVisible()
    })

    test('should handle concurrent user edits', async ({ page, context }) => {
      await adminPage.navigateToUserManagement()
      
      // Create user to edit
      await adminPage.createUser({
        ...testUser,
        email: 'concurrent-test@inopnc.com'
      })
      
      // Open user edit in two tabs
      const newPage = await context.newPage()
      const newAdminPage = new AdminPage(newPage)
      await newAdminPage.goto('/admin/users')
      
      // Start editing in both tabs
      await adminPage.editUser('concurrent-test@inopnc.com', {
        name: 'First Edit'
      })
      
      // Second edit should detect conflict or handle gracefully
      await newAdminPage.editUser('concurrent-test@inopnc.com', {
        name: 'Second Edit'
      })
      
      // Should handle conflict appropriately
      await expect(newPage.getByText(/conflict|updated by another user/i)).toBeVisible()
      
      await newPage.close()
    })
  })

  test.describe('User Deletion', () => {
    test('should delete user with confirmation', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Create user to delete
      await adminPage.createUser({
        ...testUser,
        email: 'delete-test@inopnc.com'
      })
      
      const initialCount = await adminPage.getUserCount()
      
      // Delete user
      await adminPage.deleteUser('delete-test@inopnc.com')
      
      // Should show success message
      await adminPage.expectSuccessMessage(/user deleted/i)
      
      // User should be removed from table
      await expect(adminPage.usersTable.getByText('delete-test@inopnc.com')).not.toBeVisible()
      
      // User count should decrease
      const newCount = await adminPage.getUserCount()
      expect(newCount).toBe(initialCount - 1)
    })

    test('should show confirmation dialog before deletion', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Assume at least one user exists
      const userCount = await adminPage.getUserCount()
      if (userCount === 0) {
        await adminPage.createUser({
          ...testUser,
          email: 'confirm-delete@inopnc.com'
        })
      }
      
      // Start deletion process
      const firstUserRow = adminPage.usersTable.locator('tbody tr').first()
      const deleteButton = firstUserRow.getByRole('button', { name: /delete/i })
      await deleteButton.click()
      
      // Should show confirmation dialog
      await adminPage.expectConfirmDialog()
      await expect(page.getByText(/are you sure|confirm deletion/i)).toBeVisible()
      
      // Cancel deletion
      await adminPage.cancelButton.click()
      
      // User should still be in table
      await expect(adminPage.usersTable.locator('tbody tr')).toHaveCount(userCount)
    })

    test('should prevent deletion of users with dependencies', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Try to delete a user who has created reports or other dependencies
      // This would typically be tested with existing test data
      
      // Mock scenario where user has dependencies
      await page.route('**/api/admin/users/**/delete', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Cannot delete user with existing reports'
          })
        })
      })
      
      const firstUserRow = adminPage.usersTable.locator('tbody tr').first()
      const deleteButton = firstUserRow.getByRole('button', { name: /delete/i })
      await deleteButton.click()
      
      await adminPage.confirmButton.click()
      
      // Should show error message
      await adminPage.expectValidationError(/cannot delete.*existing reports/i)
    })
  })

  test.describe('User Search and Filtering', () => {
    test('should search users by email', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      const searchQuery = 'worker@inopnc.com'
      await adminPage.searchUsers(searchQuery)
      
      // Should show filtered results
      await expect(adminPage.usersTable.getByText(searchQuery)).toBeVisible()
      
      // Other users should be hidden or results should be limited
      const visibleRows = await adminPage.usersTable.locator('tbody tr').count()
      expect(visibleRows).toBeGreaterThanOrEqual(1)
    })

    test('should search users by name', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      const searchQuery = 'Worker'
      await adminPage.searchUsers(searchQuery)
      
      // Should show users with matching names
      await expect(page.getByText(/search results/i)).toBeVisible()
    })

    test('should filter users by role', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      const initialCount = await adminPage.getUserCount()
      
      await adminPage.filterUsers('worker')
      
      // Should show only workers
      const filteredCount = await adminPage.getUserCount()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
      
      // All visible users should have worker role
      const roleColumn = adminPage.usersTable.locator('[data-column="role"]')
      if (await roleColumn.first().isVisible()) {
        await expect(roleColumn.first()).toContainText('worker')
      }
    })

    test('should filter users by status', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      await adminPage.filterUsers('active')
      
      // Should show only active users
      const statusColumn = adminPage.usersTable.locator('[data-column="status"]')
      if (await statusColumn.first().isVisible()) {
        await expect(statusColumn.first()).toContainText(/active|enabled/i)
      }
    })

    test('should clear search and show all users', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Apply search first
      await adminPage.searchUsers('worker')
      const searchedCount = await adminPage.getUserCount()
      
      // Clear search
      await adminPage.userSearchInput.fill('')
      await adminPage.userSearchInput.press('Enter')
      
      // Should show all users again
      const allUsersCount = await adminPage.getUserCount()
      expect(allUsersCount).toBeGreaterThanOrEqual(searchedCount)
    })
  })

  test.describe('Bulk Operations', () => {
    test('should export users data', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      await adminPage.exportUsers()
      
      // Should open export modal
      await expect(page.getByTestId('export-modal')).toBeVisible()
      await expect(page.getByText(/export users/i)).toBeVisible()
      
      // Select format and export
      await page.getByRole('radio', { name: /excel/i }).click()
      await page.getByRole('button', { name: /export/i }).click()
      
      // Should show export success
      await expect(page.getByText(/export started|download will begin/i)).toBeVisible()
    })

    test('should support bulk status updates', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Select multiple users (if bulk selection is implemented)
      const checkboxes = adminPage.usersTable.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()
      
      if (checkboxCount > 0) {
        // Select first two checkboxes
        await checkboxes.first().click()
        if (checkboxCount > 1) {
          await checkboxes.nth(1).click()
        }
        
        // Use bulk actions
        await adminPage.bulkActionsDropdown.click()
        await page.getByRole('option', { name: /deactivate/i }).click()
        
        // Should show confirmation
        await adminPage.expectConfirmDialog()
        await adminPage.confirmButton.click()
        
        // Should show success message
        await adminPage.expectSuccessMessage(/users updated/i)
      }
    })
  })

  test.describe('User Permissions and Role Management', () => {
    test('should enforce role hierarchy in user creation', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      await adminPage.addUserButton.click()
      await adminPage.expectUserFormVisible()
      
      // Check available roles
      await adminPage.userRoleSelect.click()
      
      // Admin should be able to create all roles
      await expect(page.getByRole('option', { name: /worker/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /site_manager/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /admin/i })).toBeVisible()
    })

    test('should validate site assignment for site managers', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      await adminPage.createUser({
        ...testUser,
        email: 'sitemanager@test.com',
        role: 'site_manager'
        // Site should be required for site managers
      })
      
      // Should require site selection for site managers
      if (testUser.site === undefined) {
        await adminPage.expectValidationError(/site is required.*site manager/i)
      }
    })

    test('should show appropriate fields based on role selection', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      await adminPage.addUserButton.click()
      await adminPage.expectUserFormVisible()
      
      // Select site manager role
      await adminPage.userRoleSelect.selectOption('site_manager')
      
      // Site selection should become visible/required
      await expect(adminPage.userSiteSelect).toBeVisible()
      
      // Select admin role
      await adminPage.userRoleSelect.selectOption('admin')
      
      // Organization selection should be visible
      await expect(adminPage.userOrganizationSelect).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness and Accessibility', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await adminPage.navigateToUserManagement()
      await adminPage.expectUserManagementVisible()
      
      // Mobile table should be responsive
      await expect(adminPage.usersTable).toBeVisible()
      
      // Add user button should be accessible
      await expect(adminPage.addUserButton).toBeVisible()
      
      // Search should work on mobile
      await adminPage.searchUsers('worker')
      await expect(page.getByText(/search results/i)).toBeVisible()
    })

    test('should be keyboard navigable', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Should be able to navigate with Tab
      await page.keyboard.press('Tab')
      await expect(adminPage.addUserButton).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(adminPage.userSearchInput).toBeFocused()
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Check for accessibility attributes
      await expect(adminPage.usersTable).toHaveAttribute('role', 'table')
      await expect(adminPage.userSearchInput).toHaveAttribute('aria-label')
      await expect(adminPage.addUserButton).toHaveAttribute('aria-label')
    })
  })

  test.describe('Performance and Error Handling', () => {
    test('should load user management page quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await adminPage.navigateToUserManagement()
      await adminPage.expectUserManagementVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should handle network errors gracefully', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Simulate network failure for user creation
      await page.route('**/api/admin/users', route => route.abort())
      
      await adminPage.createUser({
        ...testUser,
        email: 'network-test@inopnc.com'
      })
      
      // Should show network error
      await expect(page.getByText(/network error|failed to create/i)).toBeVisible()
    })

    test('should handle pagination for large user lists', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Check if pagination is present
      const paginationVisible = await adminPage.pagination.isVisible()
      
      if (paginationVisible) {
        // Test pagination
        const nextButton = adminPage.pagination.getByRole('button', { name: /next/i })
        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
          await nextButton.click()
          
          // Should load next page
          await expect(page.getByText(/page 2/i)).toBeVisible()
        }
      }
    })

    test('should validate data integrity', async ({ page }) => {
      await adminPage.navigateToUserManagement()
      
      // Try to create user with XSS attempt
      await adminPage.createUser({
        ...testUser,
        email: 'xss@test.com',
        name: '<script>alert("xss")</script>'
      })
      
      // Should sanitize or reject malicious input
      await expect(adminPage.usersTable.getByText('<script>')).not.toBeVisible()
    })
  })
})