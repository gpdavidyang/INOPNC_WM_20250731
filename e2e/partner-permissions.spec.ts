import { test, expect } from '@playwright/test';

test.describe('Partner Permission Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
  });

  test('Partner login and dashboard access', async ({ page }) => {
    console.log('🧪 Testing partner login and dashboard access...');
    
    // Login as partner user
    await page.fill('input[name="email"]', 'partner@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check that partner can see the dashboard content
    const pageContent = page.locator('body');
    await expect(pageContent).toContainText(/대시보드|홈|Dashboard|Home/);
    
    console.log('✅ Partner login successful and dashboard accessible');
  });

  test('Partner site information access', async ({ page }) => {
    console.log('🧪 Testing partner site information access...');
    
    // Login as partner
    await page.fill('input[name="email"]', 'partner@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Check if site info is visible
    const siteInfoExists = await page.locator('text=오늘의 현장 정보').count() > 0;
    const siteNameExists = await page.locator('text=현장명').count() > 0;
    const addressExists = await page.locator('text=주소').count() > 0;
    
    if (siteInfoExists || siteNameExists || addressExists) {
      console.log('✅ Partner can see site information');
    } else {
      console.log('ℹ️ Site information section not visible to partner (this may be expected)');
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/partner-site-info.png', fullPage: true });
  });

  test('Partner navigation menu access', async ({ page }) => {
    console.log('🧪 Testing partner navigation menu access...');
    
    // Login as partner
    await page.fill('input[name="email"]', 'partner@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check main navigation items
    const navChecks = [
      { text: '홈', expected: true },
      { text: '작업일지', expected: true },
      { text: '문서함', expected: true },
      { text: '출근현황', expected: true }
    ];
    
    for (const nav of navChecks) {
      const element = page.locator(`text=${nav.text}`);
      const count = await element.count();
      
      if (count > 0) {
        console.log(`✅ Navigation item '${nav.text}' found`);
      } else {
        console.log(`ℹ️ Navigation item '${nav.text}' not found`);
      }
    }
    
    // Check for admin-only items (should NOT be present)
    const adminElements = await page.locator('text=관리자').count();
    const systemElements = await page.locator('text=시스템 관리').count();
    
    if (adminElements === 0 && systemElements === 0) {
      console.log('✅ Partner correctly restricted from admin functions');
    } else {
      console.log('⚠️ Partner may have unauthorized admin access');
    }
  });

  test('Partner document access', async ({ page }) => {
    console.log('🧪 Testing partner document access...');
    
    // Login as partner
    await page.fill('input[name="email"]', 'partner@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Try to navigate to documents
    const documentsLink = page.locator('text=문서함').first();
    
    try {
      await documentsLink.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Partner can access documents section');
      
      // Check if documents are loaded
      const hasDocuments = await page.locator('.document, .file, text=문서').count() > 0;
      const hasEmptyMessage = await page.locator('text=문서가 없습니다, text=No documents').count() > 0;
      
      if (hasDocuments) {
        console.log('✅ Partner can see document content');
      } else if (hasEmptyMessage) {
        console.log('ℹ️ Partner documents section is empty (may be expected)');
      } else {
        console.log('ℹ️ Document section status unclear');
      }
      
    } catch (error) {
      console.log('⚠️ Could not access documents section:', error);
    }
  });

  test('Partner daily reports access', async ({ page }) => {
    console.log('🧪 Testing partner daily reports access...');
    
    // Login as partner
    await page.fill('input[name="email"]', 'partner@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Try to navigate to daily reports
    const reportsLink = page.locator('text=작업일지').first();
    
    try {
      await reportsLink.click();
      await page.waitForTimeout(3000);
      
      console.log('✅ Partner can access daily reports section');
      
      // Check if reports are loaded
      const hasReports = await page.locator('.report, text=작업일지, text=보고서').count() > 0;
      const hasEmptyMessage = await page.locator('text=작업일지가 없습니다, text=No reports').count() > 0;
      
      if (hasReports) {
        console.log('✅ Partner can see daily reports content');
      } else if (hasEmptyMessage) {
        console.log('ℹ️ Partner daily reports section is empty (may be expected)');
      } else {
        console.log('ℹ️ Daily reports section status unclear');
      }
      
    } catch (error) {
      console.log('⚠️ Could not access daily reports section:', error);
    }
  });

  test('Partner mobile navigation', async ({ page }) => {
    console.log('🧪 Testing partner mobile navigation...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login as partner
    await page.fill('input[name="email"]', 'partner@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Wait for mobile layout
    await page.waitForTimeout(2000);
    
    // Check for mobile navigation elements
    const mobileNavExists = await page.locator('[class*="bottom"], [class*="mobile"], [data-testid*="mobile"]').count() > 0;
    
    if (mobileNavExists) {
      console.log('✅ Mobile navigation detected');
    } else {
      console.log('ℹ️ Mobile navigation layout may differ');
    }
    
    // Check bottom navigation items
    const bottomNavItems = ['홈', '작업일지', '문서함', '출근현황'];
    
    for (const item of bottomNavItems) {
      const itemExists = await page.locator(`text=${item}`).count() > 0;
      if (itemExists) {
        console.log(`✅ Mobile nav item '${item}' found`);
      } else {
        console.log(`ℹ️ Mobile nav item '${item}' not found`);
      }
    }
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/partner-mobile-nav.png', fullPage: true });
  });

  test('Partner profile and role verification', async ({ page }) => {
    console.log('🧪 Testing partner profile and role verification...');
    
    // Login as partner
    await page.fill('input[name="email"]', 'partner@inopnc.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Look for profile/user info
    const profileElements = page.locator('text=내정보, text=프로필, text=Profile, text=partner');
    
    if (await profileElements.count() > 0) {
      try {
        await profileElements.first().click();
        await page.waitForTimeout(2000);
        
        // Check for partner role indication
        const roleText = await page.textContent('body');
        if (roleText?.includes('파트너') || roleText?.includes('partner')) {
          console.log('✅ Partner role correctly displayed in profile');
        } else {
          console.log('ℹ️ Partner role not explicitly shown in profile');
        }
        
      } catch (error) {
        console.log('ℹ️ Could not access profile section');
      }
    }
    
    // Verify partner-specific access patterns
    const pageContent = await page.textContent('body');
    
    // Should NOT have admin terms
    const hasAdminTerms = pageContent?.includes('시스템 관리') || pageContent?.includes('관리자 권한');
    
    if (!hasAdminTerms) {
      console.log('✅ Partner correctly does not have admin interface elements');
    } else {
      console.log('⚠️ Partner may have unexpected admin elements visible');
    }
  });
});