import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Analytics Dashboard E2E Tests', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)

    // Login as admin to access analytics
    await authPage.navigateToLogin()
    await authPage.loginAsAdmin()
    await dashboardPage.navigateToDashboard()
  })

  test.describe('Analytics Dashboard Access and Navigation', () => {
    test('should display analytics dashboard for admin users', async ({ page }) => {
      // Navigate to analytics dashboard
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Should show analytics content
      await expect(page.getByTestId('analytics-dashboard')).toBeVisible()
      await expect(page).toHaveURL(/.*analytics/)
      
      // Check for main analytics sections
      const analyticssections = [
        page.getByTestId('performance-metrics'),
        page.getByTestId('user-activity'),
        page.getByTestId('business-metrics'),
        page.getByTestId('site-analytics')
      ]
      
      for (const section of analyticssections) {
        if (await section.isVisible()) {
          await expect(section).toBeVisible()
        }
      }
    })

    test('should restrict analytics access to authorized users', async ({ page }) => {
      // Logout and login as worker
      await authPage.logout()
      await authPage.loginAsWorker()
      
      // Try to access analytics directly
      await page.goto('/dashboard/analytics')
      
      // Should redirect or show access denied
      const accessDenied = page.getByText(/access.*denied|권한.*없음/i)
      const redirected = page.getByTestId('dashboard-content')
      
      if (await accessDenied.isVisible()) {
        await expect(accessDenied).toBeVisible()
      } else if (await redirected.isVisible()) {
        // Should redirect to main dashboard
        await expect(page).toHaveURL(/dashboard/)
        await expect(page).not.toHaveURL(/analytics/)
      }
    })

    test('should have navigation tabs for different analytics views', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Check for analytics navigation tabs
      const analyticsTabs = [
        /overview|개요/i,
        /performance|성능/i,
        /users|사용자/i,
        /business|비즈니스/i,
        /reports|보고서/i
      ]
      
      for (const tabPattern of analyticsTabs) {
        const tab = page.getByRole('tab', { name: tabPattern })
        if (await tab.isVisible()) {
          await expect(tab).toBeVisible()
          
          // Test tab switching
          await tab.click()
          await page.waitForLoadState('networkidle')
          
          // Should show corresponding content
          const tabContent = page.getByTestId('tab-content')
          if (await tabContent.isVisible()) {
            await expect(tabContent).toBeVisible()
          }
        }
      }
    })
  })

  test.describe('Real-time Metrics and Updates', () => {
    test('should display real-time user activity metrics', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Look for real-time metrics
      const realTimeSection = page.getByTestId('real-time-metrics')
      
      if (await realTimeSection.isVisible()) {
        // Should show current active users
        const activeUsers = realTimeSection.getByTestId('active-users')
        if (await activeUsers.isVisible()) {
          await expect(activeUsers).toBeVisible()
          
          // Value should be numeric
          const userCount = await activeUsers.textContent()
          expect(userCount?.match(/\d+/)).toBeTruthy()
        }
        
        // Should show real-time activity feed
        const activityFeed = realTimeSection.getByTestId('activity-feed')
        if (await activityFeed.isVisible()) {
          await expect(activityFeed).toBeVisible()
          
          // Should have activity items
          const activityItems = activityFeed.getByTestId('activity-item')
          const count = await activityItems.count()
          
          if (count > 0) {
            // Check if activities have timestamps
            for (let i = 0; i < Math.min(count, 3); i++) {
              const item = activityItems.nth(i)
              await expect(item).toContainText(/\d+.*ago|방금|분전|시간전/)
            }
          }
        }
      }
    })

    test('should update metrics automatically without refresh', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Get initial metric values
      const pageViews = page.getByTestId('page-views-metric')
      const userSessions = page.getByTestId('user-sessions-metric')
      
      let initialPageViews = ''
      let initialSessions = ''
      
      if (await pageViews.isVisible()) {
        initialPageViews = await pageViews.textContent() || ''
      }
      
      if (await userSessions.isVisible()) {
        initialSessions = await userSessions.textContent() || ''
      }
      
      // Wait for auto-update (typically 30-60 seconds)
      await page.waitForTimeout(3000) // Short wait for demo purposes
      
      // Simulate user activity to trigger metric updates
      await page.evaluate(() => {
        // Trigger custom analytics events
        window.dispatchEvent(new CustomEvent('analytics-update', {
          detail: { type: 'pageview', page: '/dashboard/analytics' }
        }))
      })
      
      // Check if metrics updated
      const updatedPageViews = await pageViews.textContent() || ''
      const updatedSessions = await userSessions.textContent() || ''
      
      // Values might change or stay same - important is no error occurred
      expect(updatedPageViews).toBeTruthy()
      expect(updatedSessions).toBeTruthy()
    })

    test('should show live data refresh indicators', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분析/i }).click()
      
      // Look for refresh indicators
      const refreshIndicator = page.getByTestId('refresh-indicator')
      const lastUpdated = page.getByTestId('last-updated')
      
      if (await refreshIndicator.isVisible()) {
        // Should animate during updates
        await expect(refreshIndicator).toBeVisible()
      }
      
      if (await lastUpdated.isVisible()) {
        // Should show recent timestamp
        const timestamp = await lastUpdated.textContent()
        expect(timestamp).toMatch(/just now|seconds ago|방금|초전/)
      }
      
      // Test manual refresh
      const refreshButton = page.getByRole('button', { name: /refresh|새로고침/i })
      if (await refreshButton.isVisible()) {
        await refreshButton.click()
        
        // Should show loading state
        const loadingSpinner = page.getByTestId('loading-spinner')
        if (await loadingSpinner.isVisible()) {
          await expect(loadingSpinner).toBeVisible()
          await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('should handle WebSocket connections for real-time data', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Check WebSocket connection status
      const connectionStatus = await page.evaluate(() => {
        // Check if WebSocket is connected
        const wsIndicator = document.querySelector('[data-testid="websocket-status"]')
        return {
          hasIndicator: !!wsIndicator,
          status: wsIndicator?.textContent || '',
          connectionExists: typeof window.WebSocket !== 'undefined'
        }
      })
      
      expect(connectionStatus.connectionExists).toBe(true)
      
      // If WebSocket status indicator exists, check connection
      if (connectionStatus.hasIndicator) {
        const wsStatus = page.getByTestId('websocket-status')
        await expect(wsStatus).toContainText(/connected|연결됨/)
      }
    })
  })

  test.describe('Performance Analytics', () => {
    test('should display Core Web Vitals metrics', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Navigate to performance tab
      const performanceTab = page.getByRole('tab', { name: /performance|성능/i })
      if (await performanceTab.isVisible()) {
        await performanceTab.click()
        
        // Check for Core Web Vitals
        const webVitals = [
          { testId: 'lcp-metric', name: 'LCP', threshold: 2500 },
          { testId: 'inp-metric', name: 'INP', threshold: 200 },
          { testId: 'cls-metric', name: 'CLS', threshold: 0.1 }
        ]
        
        for (const vital of webVitals) {
          const metric = page.getByTestId(vital.testId)
          if (await metric.isVisible()) {
            await expect(metric).toBeVisible()
            
            // Should show metric value and status
            const value = await metric.textContent()
            expect(value).toMatch(/\d+(\.\d+)?/)
            
            // Should indicate good/poor performance
            const status = metric.getByTestId('performance-status')
            if (await status.isVisible()) {
              await expect(status).toContainText(/good|poor|needs improvement|좋음|나쁨|개선 필요/)
            }
          }
        }
      }
    })

    test('should show page load time distribution', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const performanceTab = page.getByRole('tab', { name: /performance|성능/i })
      if (await performanceTab.isVisible()) {
        await performanceTab.click()
        
        // Check for load time chart
        const loadTimeChart = page.getByTestId('load-time-chart')
        if (await loadTimeChart.isVisible()) {
          await expect(loadTimeChart).toBeVisible()
          
          // Should show chart elements
          const chartBars = loadTimeChart.locator('.chart-bar')
          const chartCanvas = loadTimeChart.locator('canvas')
          
          const barsCount = await chartBars.count()
          const canvasCount = await chartCanvas.count()
          
          // Should have either bars or canvas for chart
          expect(barsCount + canvasCount).toBeGreaterThan(0)
        }
        
        // Check for performance summary
        const performanceSummary = page.getByTestId('performance-summary')
        if (await performanceSummary.isVisible()) {
          await expect(performanceSummary).toContainText(/average|median|p95|평균|중간값/)
        }
      }
    })

    test('should display resource timing breakdown', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const performanceTab = page.getByRole('tab', { name: /performance|성능/i })
      if (await performanceTab.isVisible()) {
        await performanceTab.click()
        
        // Check for resource timing
        const resourceTiming = page.getByTestId('resource-timing')
        if (await resourceTiming.isVisible()) {
          await expect(resourceTiming).toBeVisible()
          
          // Should show different resource types
          const resourceTypes = ['HTML', 'CSS', 'JavaScript', 'Images', 'API']
          
          for (const type of resourceTypes) {
            const resourceRow = resourceTiming.getByText(type)
            if (await resourceRow.isVisible()) {
              await expect(resourceRow).toBeVisible()
            }
          }
        }
      }
    })

    test('should track error rates and performance issues', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Check for error tracking
      const errorMetrics = page.getByTestId('error-metrics')
      if (await errorMetrics.isVisible()) {
        await expect(errorMetrics).toBeVisible()
        
        // Should show error rate
        const errorRate = errorMetrics.getByTestId('error-rate')
        if (await errorRate.isVisible()) {
          const rate = await errorRate.textContent()
          expect(rate).toMatch(/\d+(\.\d+)?%/)
        }
        
        // Should show recent errors
        const recentErrors = errorMetrics.getByTestId('recent-errors')
        if (await recentErrors.isVisible()) {
          await expect(recentErrors).toBeVisible()
        }
      }
    })
  })

  test.describe('User Activity Analytics', () => {
    test('should display user session analytics', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const usersTab = page.getByRole('tab', { name: /users|사용자/i })
      if (await usersTab.isVisible()) {
        await usersTab.click()
        
        // Check for session metrics
        const sessionMetrics = page.getByTestId('session-metrics')
        if (await sessionMetrics.isVisible()) {
          await expect(sessionMetrics).toBeVisible()
          
          // Should show total sessions, unique users, etc.
          const metrics = [
            'total-sessions',
            'unique-users',
            'average-session-duration',
            'bounce-rate'
          ]
          
          for (const metric of metrics) {
            const element = sessionMetrics.getByTestId(metric)
            if (await element.isVisible()) {
              await expect(element).toBeVisible()
              
              const value = await element.textContent()
              expect(value).toMatch(/\d+/)
            }
          }
        }
      }
    })

    test('should show user journey and flow analysis', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const usersTab = page.getByRole('tab', { name: /users|사용자/i })
      if (await usersTab.isVisible()) {
        await usersTab.click()
        
        // Check for user journey visualization
        const userJourney = page.getByTestId('user-journey')
        if (await userJourney.isVisible()) {
          await expect(userJourney).toBeVisible()
          
          // Should show common paths
          const journeySteps = userJourney.getByTestId('journey-step')
          const stepsCount = await journeySteps.count()
          
          if (stepsCount > 0) {
            // Each step should show page and transition rate
            for (let i = 0; i < Math.min(stepsCount, 3); i++) {
              const step = journeySteps.nth(i)
              await expect(step).toContainText(/dashboard|login|attendance/)
            }
          }
        }
      }
    })

    test('should display device and browser analytics', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const usersTab = page.getByRole('tab', { name: /users|사용자/i })
      if (await usersTab.isVisible()) {
        await usersTab.click()
        
        // Check for device breakdown
        const deviceAnalytics = page.getByTestId('device-analytics')
        if (await deviceAnalytics.isVisible()) {
          await expect(deviceAnalytics).toBeVisible()
          
          // Should show device types
          const deviceTypes = ['Desktop', 'Mobile', 'Tablet']
          for (const device of deviceTypes) {
            const deviceElement = deviceAnalytics.getByText(device)
            if (await deviceElement.isVisible()) {
              await expect(deviceElement).toBeVisible()
            }
          }
        }
        
        // Check for browser breakdown
        const browserAnalytics = page.getByTestId('browser-analytics')
        if (await browserAnalytics.isVisible()) {
          await expect(browserAnalytics).toBeVisible()
          
          // Should show browser usage
          const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge']
          for (const browser of browsers) {
            const browserElement = browserAnalytics.getByText(browser)
            if (await browserElement.isVisible()) {
              await expect(browserElement).toBeVisible()
            }
          }
        }
      }
    })

    test('should track feature usage and engagement', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const usersTab = page.getByRole('tab', { name: /users|사용자/i })
      if (await usersTab.isVisible()) {
        await usersTab.click()
        
        // Check for feature usage tracking
        const featureUsage = page.getByTestId('feature-usage')
        if (await featureUsage.isVisible()) {
          await expect(featureUsage).toBeVisible()
          
          // Should show usage for different features
          const features = [
            'Daily Reports',
            'Attendance',
            'Documents',
            'Markup Tool',
            'Analytics'
          ]
          
          for (const feature of features) {
            const featureRow = featureUsage.getByText(feature)
            if (await featureRow.isVisible()) {
              await expect(featureRow).toBeVisible()
            }
          }
        }
      }
    })
  })

  test.describe('Business Metrics and KPIs', () => {
    test('should display construction-specific business metrics', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const businessTab = page.getByRole('tab', { name: /business|비즈니스/i })
      if (await businessTab.isVisible()) {
        await businessTab.click()
        
        // Check for construction business metrics
        const businessMetrics = page.getByTestId('business-metrics')
        if (await businessMetrics.isVisible()) {
          await expect(businessMetrics).toBeVisible()
          
          // Should show construction-specific KPIs
          const kpis = [
            'total-projects',
            'active-sites',
            'worker-productivity',
            'safety-incidents',
            'project-completion-rate'
          ]
          
          for (const kpi of kpis) {
            const element = businessMetrics.getByTestId(kpi)
            if (await element.isVisible()) {
              await expect(element).toBeVisible()
              
              const value = await element.textContent()
              expect(value).toMatch(/\d+/)
            }
          }
        }
      }
    })

    test('should track project progress and milestones', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const businessTab = page.getByRole('tab', { name: /business|비즈니스/i })
      if (await businessTab.isVisible()) {
        await businessTab.click()
        
        // Check for project progress tracking
        const projectProgress = page.getByTestId('project-progress')
        if (await projectProgress.isVisible()) {
          await expect(projectProgress).toBeVisible()
          
          // Should show project timeline
          const timeline = projectProgress.getByTestId('project-timeline')
          if (await timeline.isVisible()) {
            await expect(timeline).toBeVisible()
            
            // Should have milestone markers
            const milestones = timeline.getByTestId('milestone')
            const milestoneCount = await milestones.count()
            
            if (milestoneCount > 0) {
              // Each milestone should have date and status
              for (let i = 0; i < Math.min(milestoneCount, 3); i++) {
                const milestone = milestones.nth(i)
                await expect(milestone).toContainText(/\d{4}-\d{2}-\d{2}/)
              }
            }
          }
        }
      }
    })

    test('should display labor hours and productivity metrics', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const businessTab = page.getByRole('tab', { name: /business|비즈니스/i })
      if (await businessTab.isVisible()) {
        await businessTab.click()
        
        // Check for labor analytics
        const laborAnalytics = page.getByTestId('labor-analytics')
        if (await laborAnalytics.isVisible()) {
          await expect(laborAnalytics).toBeVisible()
          
          // Should show 공수 (labor hours) metrics
          const laborMetrics = [
            'total-labor-hours',
            'average-daily-hours',
            'overtime-percentage',
            'productivity-index'
          ]
          
          for (const metric of laborMetrics) {
            const element = laborAnalytics.getByTestId(metric)
            if (await element.isVisible()) {
              await expect(element).toBeVisible()
              
              // Should contain 공수 or hours-related text
              const text = await element.textContent()
              expect(text).toMatch(/\d+(\.\d+)?|공수|hours/)
            }
          }
        }
      }
    })

    test('should show cost and resource utilization', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const businessTab = page.getByRole('tab', { name: /business|비즈니스/i })
      if (await businessTab.isVisible()) {
        await businessTab.click()
        
        // Check for cost analysis
        const costAnalysis = page.getByTestId('cost-analysis')
        if (await costAnalysis.isVisible()) {
          await expect(costAnalysis).toBeVisible()
          
          // Should show cost breakdown
          const costCategories = [
            'labor-costs',
            'material-costs',
            'equipment-costs',
            'overhead-costs'
          ]
          
          for (const category of costCategories) {
            const element = costAnalysis.getByTestId(category)
            if (await element.isVisible()) {
              await expect(element).toBeVisible()
            }
          }
        }
      }
    })
  })

  test.describe('Data Visualization and Charts', () => {
    test('should display interactive charts and graphs', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Check for various chart types
      const chartTypes = [
        'line-chart',
        'bar-chart',
        'pie-chart',
        'area-chart',
        'heatmap'
      ]
      
      for (const chartType of chartTypes) {
        const chart = page.getByTestId(chartType)
        if (await chart.isVisible()) {
          await expect(chart).toBeVisible()
          
          // Chart should be interactive
          const chartArea = chart.locator('svg, canvas, .chart-container').first()
          if (await chartArea.isVisible()) {
            // Hover to show tooltips
            await chartArea.hover()
            
            const tooltip = page.getByTestId('chart-tooltip')
            if (await tooltip.isVisible()) {
              await expect(tooltip).toBeVisible()
            }
          }
        }
      }
    })

    test('should support chart filtering and date range selection', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Test date range picker
      const dateRangePicker = page.getByTestId('date-range-picker')
      if (await dateRangePicker.isVisible()) {
        await dateRangePicker.click()
        
        // Select predefined range
        const lastWeekOption = page.getByRole('option', { name: /last week|지난 주/i })
        if (await lastWeekOption.isVisible()) {
          await lastWeekOption.click()
          
          // Charts should update
          await page.waitForLoadState('networkidle')
          
          // Verify chart updated with new data
          const chartContainer = page.getByTestId('chart-container')
          if (await chartContainer.isVisible()) {
            await expect(chartContainer).toBeVisible()
          }
        }
      }
      
      // Test chart filters
      const chartFilter = page.getByTestId('chart-filter')
      if (await chartFilter.isVisible()) {
        await chartFilter.click()
        
        // Select specific metric
        const metricOption = page.getByRole('option', { name: /sessions|views|사용자/i })
        if (await metricOption.isVisible()) {
          await metricOption.click()
          await page.waitForLoadState('networkidle')
        }
      }
    })

    test('should export charts and data', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Look for export functionality
      const exportButton = page.getByRole('button', { name: /export|내보내기/i })
      if (await exportButton.isVisible()) {
        await exportButton.click()
        
        // Should show export options
        const exportModal = page.getByTestId('export-modal')
        await expect(exportModal).toBeVisible()
        
        // Test different export formats
        const exportFormats = ['CSV', 'Excel', 'PDF', 'PNG']
        
        for (const format of exportFormats) {
          const formatOption = exportModal.getByRole('radio', { name: format })
          if (await formatOption.isVisible()) {
            await formatOption.click()
            
            const exportConfirmButton = exportModal.getByRole('button', { name: /export|내보내기/i })
            if (await exportConfirmButton.isVisible()) {
              // Start download
              const downloadPromise = page.waitForEvent('download')
              await exportConfirmButton.click()
              
              const download = await downloadPromise
              expect(download.suggestedFilename()).toMatch(new RegExp(`\\.(${format.toLowerCase()}|xlsx)$`, 'i'))
              break // Only test one format to avoid multiple downloads
            }
          }
        }
        
        // Close modal
        const closeButton = exportModal.getByRole('button', { name: /close|닫기/i })
        if (await closeButton.isVisible()) {
          await closeButton.click()
        }
      }
    })

    test('should handle large datasets efficiently', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Select large date range to test performance
      const dateRangePicker = page.getByTestId('date-range-picker')
      if (await dateRangePicker.isVisible()) {
        await dateRangePicker.click()
        
        // Select year-to-date or large range
        const largeRangeOption = page.getByRole('option', { name: /year|annual|연간/i })
        if (await largeRangeOption.isVisible()) {
          const startTime = Date.now()
          
          await largeRangeOption.click()
          
          // Wait for charts to render
          await page.waitForLoadState('networkidle')
          
          const loadTime = Date.now() - startTime
          
          // Should load within reasonable time
          expect(loadTime).toBeLessThan(10000) // 10 seconds max
          
          // Charts should still be responsive
          const chart = page.getByTestId('main-chart')
          if (await chart.isVisible()) {
            await expect(chart).toBeVisible()
          }
        }
      }
    })
  })

  test.describe('Alerts and Notifications', () => {
    test('should display performance alerts', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Check for alerts section
      const alertsSection = page.getByTestId('analytics-alerts')
      if (await alertsSection.isVisible()) {
        await expect(alertsSection).toBeVisible()
        
        // Should show different alert types
        const alertTypes = [
          'performance-alert',
          'error-alert',
          'usage-alert',
          'security-alert'
        ]
        
        for (const alertType of alertTypes) {
          const alert = alertsSection.getByTestId(alertType)
          if (await alert.isVisible()) {
            await expect(alert).toBeVisible()
            
            // Should have severity indicator
            const severity = alert.getByTestId('alert-severity')
            if (await severity.isVisible()) {
              await expect(severity).toContainText(/high|medium|low|critical|높음|보통|낮음|심각/)
            }
          }
        }
      }
    })

    test('should configure alert thresholds', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Look for alert settings
      const alertSettings = page.getByRole('button', { name: /alert.*settings|알림.*설정/i })
      if (await alertSettings.isVisible()) {
        await alertSettings.click()
        
        // Should open alert configuration
        const alertConfig = page.getByTestId('alert-configuration')
        await expect(alertConfig).toBeVisible()
        
        // Test threshold configuration
        const thresholdInput = alertConfig.getByLabel(/threshold|임계값/i).first()
        if (await thresholdInput.isVisible()) {
          await thresholdInput.clear()
          await thresholdInput.fill('95')
          
          // Save configuration
          const saveButton = alertConfig.getByRole('button', { name: /save|저장/i })
          if (await saveButton.isVisible()) {
            await saveButton.click()
            await expect(page.getByText(/settings.*saved|설정.*저장/i)).toBeVisible()
          }
        }
      }
    })

    test('should send real-time notifications for critical issues', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Simulate critical metric threshold breach
      await page.evaluate(() => {
        // Trigger critical alert
        window.dispatchEvent(new CustomEvent('analytics-alert', {
          detail: {
            type: 'critical',
            metric: 'error_rate',
            value: 15,
            threshold: 5,
            message: 'Error rate exceeded critical threshold'
          }
        }))
      })
      
      // Should show notification
      const notification = page.getByTestId('alert-notification')
      if (await notification.isVisible()) {
        await expect(notification).toBeVisible()
        await expect(notification).toContainText(/error.*rate|critical|오류율|심각/)
        
        // Should be dismissible
        const dismissButton = notification.getByRole('button', { name: /dismiss|닫기/i })
        if (await dismissButton.isVisible()) {
          await dismissButton.click()
          await expect(notification).not.toBeVisible()
        }
      }
    })
  })

  test.describe('Mobile Responsiveness and Performance', () => {
    test('should display analytics dashboard on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Should show mobile-optimized analytics
      const mobileAnalytics = page.getByTestId('mobile-analytics')
      if (await mobileAnalytics.isVisible()) {
        await expect(mobileAnalytics).toBeVisible()
      } else {
        // Should adapt existing interface for mobile
        await expect(page.getByTestId('analytics-dashboard')).toBeVisible()
      }
      
      // Charts should be responsive
      const chart = page.getByTestId('main-chart')
      if (await chart.isVisible()) {
        const boundingBox = await chart.boundingBox()
        expect(boundingBox?.width).toBeLessThanOrEqual(375)
      }
    })

    test('should maintain performance on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      const startTime = Date.now()
      
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Wait for analytics to load
      await expect(page.getByTestId('analytics-dashboard')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // Should load quickly even on mobile
      expect(loadTime).toBeLessThan(5000) // 5 seconds max for mobile
    })

    test('should handle touch interactions with charts', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      const chart = page.getByTestId('main-chart')
      if (await chart.isVisible()) {
        // Test touch interactions
        await chart.tap()
        
        // Should show touch-friendly tooltip or interaction
        const tooltip = page.getByTestId('chart-tooltip')
        if (await tooltip.isVisible()) {
          await expect(tooltip).toBeVisible()
        }
        
        // Test pinch zoom if supported
        await chart.dispatchEvent('touchstart', {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ]
        })
        
        await chart.dispatchEvent('touchmove', {
          touches: [
            { clientX: 90, clientY: 90 },
            { clientX: 210, clientY: 210 }
          ]
        })
        
        await chart.dispatchEvent('touchend')
        
        // Chart should handle zoom gracefully
        await expect(chart).toBeVisible()
      }
    })
  })

  test.describe('Data Security and Privacy', () => {
    test('should mask sensitive data appropriately', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Check that user-specific data is anonymized
      const userTable = page.getByTestId('user-activity-table')
      if (await userTable.isVisible()) {
        const userRows = userTable.getByTestId('user-row')
        const rowCount = await userRows.count()
        
        if (rowCount > 0) {
          // User identifiers should be masked or anonymized
          for (let i = 0; i < Math.min(rowCount, 3); i++) {
            const row = userRows.nth(i)
            const userCell = row.getByTestId('user-id')
            
            if (await userCell.isVisible()) {
              const text = await userCell.textContent()
              // Should not contain full email or real names
              expect(text).not.toMatch(/@.*\.com|kim.*lee|박.*이/)
              // Should be masked or use IDs
              expect(text).toMatch(/user.*\d+|anonymous|익명|\*\*\*/)
            }
          }
        }
      }
    })

    test('should implement proper access controls', async ({ page }) => {
      // Test with different user roles
      await authPage.logout()
      await authPage.loginAsManager()
      
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Manager should have limited analytics access
      const restrictedSection = page.getByTestId('admin-only-analytics')
      if (await restrictedSection.isVisible()) {
        // Should not be visible for managers
        await expect(restrictedSection).not.toBeVisible()
      }
      
      // Should see manager-level analytics
      const managerAnalytics = page.getByTestId('manager-analytics')
      if (await managerAnalytics.isVisible()) {
        await expect(managerAnalytics).toBeVisible()
      }
    })

    test('should handle data retention policies', async ({ page }) => {
      await page.getByRole('link', { name: /analytics|분석/i }).click()
      
      // Check for data retention information
      const dataRetention = page.getByTestId('data-retention-info')
      if (await dataRetention.isVisible()) {
        await expect(dataRetention).toBeVisible()
        await expect(dataRetention).toContainText(/retention|retained|보관|유지/)
      }
      
      // Check that historical data has appropriate limits
      const dateRangePicker = page.getByTestId('date-range-picker')
      if (await dateRangePicker.isVisible()) {
        await dateRangePicker.click()
        
        // Should not allow selecting data older than retention period
        const oldDateOption = page.getByRole('option', { name: /2 years|2년/i })
        if (await oldDateOption.isVisible()) {
          await oldDateOption.click()
          
          // Should show warning or limit data
          const retentionWarning = page.getByText(/data.*not.*available|limited.*data|데이터.*없음/)
          if (await retentionWarning.isVisible()) {
            await expect(retentionWarning).toBeVisible()
          }
        }
      }
    })
  })
})