import { Page, BrowserContext } from '@playwright/test'

export interface BrowserInfo {
  name: 'chromium' | 'firefox' | 'webkit' | 'edge'
  version: string
  isMobile: boolean
  isTablet: boolean
  supportsTouch: boolean
  viewport: { width: number; height: number }
  userAgent: string
}

export class BrowserDetection {
  private page: Page
  private context: BrowserContext

  constructor(page: Page) {
    this.page = page
    this.context = page.context()
  }

  async getBrowserInfo(): Promise<BrowserInfo> {
    const userAgent = await this.page.evaluate(() => navigator.userAgent)
    const viewport = this.page.viewportSize() || { width: 1920, height: 1080 }
    
    const browserName = this.detectBrowserName(userAgent)
    const version = this.extractVersion(userAgent, browserName)
    const isMobile = this.isMobileViewport(viewport)
    const isTablet = this.isTabletViewport(viewport)
    const supportsTouch = await this.detectTouchSupport()

    return {
      name: browserName,
      version,
      isMobile,
      isTablet,
      supportsTouch,
      viewport,
      userAgent
    }
  }

  private detectBrowserName(userAgent: string): BrowserInfo['name'] {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      return 'chromium'
    }
    if (userAgent.includes('Firefox')) {
      return 'firefox'
    }
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'webkit'
    }
    if (userAgent.includes('Edg')) {
      return 'edge'
    }
    return 'chromium' // Default fallback
  }

  private extractVersion(userAgent: string, browserName: string): string {
    let match: RegExpMatchArray | null = null
    
    switch (browserName) {
      case 'chromium':
        match = userAgent.match(/Chrome\/(\d+\.\d+)/)
        break
      case 'firefox':
        match = userAgent.match(/Firefox\/(\d+\.\d+)/)
        break
      case 'webkit':
        match = userAgent.match(/Version\/(\d+\.\d+)/)
        break
      case 'edge':
        match = userAgent.match(/Edg\/(\d+\.\d+)/)
        break
    }
    
    return match ? match[1] : 'unknown'
  }

  private isMobileViewport(viewport: { width: number; height: number }): boolean {
    return viewport.width <= 768
  }

  private isTabletViewport(viewport: { width: number; height: number }): boolean {
    return viewport.width > 768 && viewport.width <= 1024
  }

  private async detectTouchSupport(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return 'ontouchstart' in window || 
             navigator.maxTouchPoints > 0 || 
             navigator.maxTouchPoints > 0
    })
  }

  async getFeatureSupport() {
    return await this.page.evaluate(() => {
      return {
        // CSS Features
        cssGrid: CSS.supports('display', 'grid'),
        cssFlexbox: CSS.supports('display', 'flex'),
        cssCustomProperties: CSS.supports('--test', 'value'),
        cssCalc: CSS.supports('width', 'calc(100% - 20px)'),
        cssTransforms: CSS.supports('transform', 'rotate(45deg)'),
        cssTransitions: CSS.supports('transition', 'all 0.3s ease'),
        
        // JavaScript APIs
        fetch: typeof fetch === 'function',
        promises: typeof Promise === 'function',
        asyncAwait: (async () => {}).constructor === Promise,
        intersectionObserver: typeof IntersectionObserver === 'function',
        resizeObserver: typeof ResizeObserver === 'function',
        mutationObserver: typeof MutationObserver === 'function',
        
        // Storage APIs
        localStorage: (() => {
          try {
            return typeof localStorage === 'object' && localStorage !== null
          } catch { return false }
        })(),
        sessionStorage: (() => {
          try {
            return typeof sessionStorage === 'object' && sessionStorage !== null
          } catch { return false }
        })(),
        indexedDB: typeof indexedDB === 'object',
        
        // Canvas and Graphics
        canvas2d: (() => {
          const canvas = document.createElement('canvas')
          return !!(canvas.getContext && canvas.getContext('2d'))
        })(),
        webgl: (() => {
          const canvas = document.createElement('canvas')
          return !!(canvas.getContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
        })(),
        
        // File APIs
        fileReader: typeof FileReader === 'function',
        fileAPI: typeof File === 'function' && typeof FileList === 'function',
        formData: typeof FormData === 'function',
        
        // Network APIs
        webSockets: typeof WebSocket === 'function',
        eventSource: typeof EventSource === 'function',
        
        // Performance APIs
        performance: typeof performance === 'object',
        performanceObserver: typeof PerformanceObserver === 'function',
        requestAnimationFrame: typeof requestAnimationFrame === 'function',
        requestIdleCallback: typeof requestIdleCallback === 'function',
        
        // PWA APIs
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notifications: 'Notification' in window,
        
        // Media APIs
        mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        webRTC: !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection),
        
        // Geolocation
        geolocation: 'geolocation' in navigator,
        
        // Touch and Input
        touchEvents: 'ontouchstart' in window,
        pointerEvents: 'onpointerdown' in window,
        
        // Modern Input Types
        inputTypes: {
          date: (() => { const i = document.createElement('input'); i.type = 'date'; return i.type === 'date' })(),
          time: (() => { const i = document.createElement('input'); i.type = 'time'; return i.type === 'time' })(),
          email: (() => { const i = document.createElement('input'); i.type = 'email'; return i.type === 'email' })(),
          tel: (() => { const i = document.createElement('input'); i.type = 'tel'; return i.type === 'tel' })(),
          number: (() => { const i = document.createElement('input'); i.type = 'number'; return i.type === 'number' })(),
          range: (() => { const i = document.createElement('input'); i.type = 'range'; return i.type === 'range' })(),
          color: (() => { const i = document.createElement('input'); i.type = 'color'; return i.type === 'color' })()
        }
      }
    })
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      if (!navigation) return null
      
      return {
        // Navigation Timing
        navigationStart: navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        
        // Paint Timing
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        
        // Resource Timing
        resourceCount: performance.getEntriesByType('resource').length,
        
        // Memory (Chrome only)
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      }
    })
  }

  async captureConsoleErrors(): Promise<string[]> {
    const errors: string[] = []
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    this.page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    return errors
  }

  async getViewportInfo() {
    return await this.page.evaluate(() => {
      return {
        // Viewport dimensions
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        screenWidth: screen.width,
        screenHeight: screen.height,
        
        // Device pixel ratio
        devicePixelRatio: window.devicePixelRatio,
        
        // Orientation (if supported)
        orientation: screen.orientation ? {
          angle: screen.orientation.angle,
          type: screen.orientation.type
        } : null,
        
        // Color depth
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        
        // Available screen space
        availWidth: screen.availWidth,
        availHeight: screen.availHeight
      }
    })
  }

  async testAccessibilityFeatures() {
    return await this.page.evaluate(() => {
      return {
        // Check for accessibility APIs
        accessibilityAPI: 'accessibility' in navigator,
        
        // Check for reduced motion preference
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        
        // Check for high contrast mode
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        
        // Check for dark mode preference
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        
        // Check for forced colors (Windows high contrast)
        forcedColors: window.matchMedia('(forced-colors: active)').matches,
        
        // Screen reader detection (limited)
        hasScreenReader: !!(
          navigator.userAgent.includes('NVDA') ||
          navigator.userAgent.includes('JAWS') ||
          navigator.userAgent.includes('VoiceOver') ||
          navigator.userAgent.includes('TalkBack')
        ),
        
        // Tab index support
        supportsTabIndex: 'tabIndex' in document.createElement('div')
      }
    })
  }
}

// Utility functions for test conditions
export function skipOnBrowser(browserName: string | string[], reason?: string) {
  return (browserInfo: BrowserInfo) => {
    const browsers = Array.isArray(browserName) ? browserName : [browserName]
    return browsers.includes(browserInfo.name)
  }
}

export function skipOnMobile(reason?: string) {
  return (browserInfo: BrowserInfo) => browserInfo.isMobile
}

export function skipOnDesktop(reason?: string) {
  return (browserInfo: BrowserInfo) => !browserInfo.isMobile && !browserInfo.isTablet
}

export function requiresFeature(feature: string) {
  return async (page: Page) => {
    const detection = new BrowserDetection(page)
    const features = await detection.getFeatureSupport()
    return (features as any)[feature] === true
  }
}