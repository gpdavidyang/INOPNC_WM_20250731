module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3001/auth/login',
        'http://localhost:3001/dashboard',
        'http://localhost:3001/dashboard/daily-reports',
        'http://localhost:3001/dashboard/markup',
        'http://localhost:3001/dashboard/site-info'
      ],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Core Web Vitals thresholds
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 40000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 40000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }],
        
        // Accessibility requirements
        'color-contrast': 'error',
        'heading-order': 'error',
        'alt-text': 'error',
        'aria-roles': 'error',
        'label': 'error',
        'link-text': 'warn',
        'focus': 'error',
        'tabindex': 'error',
        
        // Best practices
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'error',
        'uses-https': 'error',
        'uses-http2': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}