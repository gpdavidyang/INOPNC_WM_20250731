'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initWebVitals, observePerformance, performanceMark } from '@/lib/monitoring/web-vitals'
import { setUserContext } from '@/lib/monitoring/sentry'
import { initRUM, rum } from '@/lib/monitoring/rum'
import * as Sentry from '@sentry/nextjs'

interface PerformanceMonitoringProviderProps {
  children: React.ReactNode
  user?: any
}

export function PerformanceMonitoringProvider({ 
  children, 
  user 
}: PerformanceMonitoringProviderProps) {
  const pathname = usePathname()
  
  // Initialize monitoring on mount
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals()
    
    // Start performance observers
    observePerformance()
    
    // Initialize Real User Monitoring
    initRUM({
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enableSessionReplay: true,
      enableUserInteractions: true,
      enableResourceTiming: true,
    })
    
    // Set user context if available
    if (user) {
      setUserContext(user)
    }
  }, [user])
  
  // Track page transitions
  useEffect(() => {
    // Start navigation timing
    performanceMark.start('navigation')
    
    // Track page view in RUM
    rum.trackPageView()
    
    // Create span for page load using modern Sentry API
    let span: any = null
    
    try {
      const client = Sentry.getClient()
      if (client) {
        // Use modern Sentry span API
        span = Sentry.startSpan({
          name: pathname,
          op: 'navigation',
          attributes: {
            'route.path': pathname,
          },
        }, (span) => {
          return span
        })
      }
    } catch (error) {
      // Ignore Sentry errors
    }
    
    // Cleanup function
    return () => {
      // End navigation timing
      const navigationTime = performanceMark.end('navigation')
      
      if (navigationTime && span) {
        try {
          span.setMeasurement?.('navigation.duration', navigationTime, 'millisecond')
          span.end?.()
        } catch (error) {
          // Ignore Sentry errors
        }
      }
    }
  }, [pathname])
  
  // Monitor React renders in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      let renderCount = 0
      let lastRenderTime = Date.now()
      
      const checkRenderPerformance = () => {
        renderCount++
        const now = Date.now()
        const timeSinceLastRender = now - lastRenderTime
        
        // Warn about rapid re-renders
        if (timeSinceLastRender < 16 && renderCount > 5) { // More than 5 renders in 16ms
          console.warn('[Performance] Rapid re-renders detected:', {
            count: renderCount,
            timeSinceLastRender,
            pathname,
          })
          
          Sentry.addBreadcrumb({
            category: 'performance',
            message: 'Rapid re-renders detected',
            level: 'warning',
            data: {
              count: renderCount,
              pathname,
            },
          })
        }
        
        lastRenderTime = now
        
        // Reset counter periodically
        if (renderCount > 100) {
          renderCount = 0
        }
      }
      
      checkRenderPerformance()
    }
  })
  
  return <>{children}</>
}