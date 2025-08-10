import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  /* Global timeout for each test */
  timeout: 60 * 1000,
  /* Expect timeout for assertions */
  expect: {
    timeout: 10 * 1000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Global test timeout */
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Test PWA functionality on desktop
        contextOptions: {
          permissions: ['notifications', 'camera', 'microphone'],
        },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          permissions: ['notifications', 'camera', 'microphone'],
        },
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          permissions: ['notifications', 'camera', 'microphone'],
        },
      },
    },

    // High-resolution desktop for UI testing
    {
      name: 'desktop-large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile Browsers - Latest iPhones
    {
      name: 'iphone-14',
      use: { 
        ...devices['iPhone 14'],
        contextOptions: {
          geolocation: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
          permissions: ['geolocation', 'notifications', 'camera'],
        },
      },
    },

    {
      name: 'iphone-14-pro',
      use: { 
        ...devices['iPhone 14 Pro'],
        contextOptions: {
          geolocation: { latitude: 37.7749, longitude: -122.4194 },
          permissions: ['geolocation', 'notifications', 'camera'],
        },
      },
    },

    {
      name: 'iphone-se',
      use: { 
        ...devices['iPhone SE'],
        contextOptions: {
          permissions: ['geolocation', 'notifications', 'camera'],
        },
      },
    },

    // Android Devices
    {
      name: 'pixel-7',
      use: { 
        ...devices['Pixel 7'],
        contextOptions: {
          geolocation: { latitude: 37.7749, longitude: -122.4194 },
          permissions: ['geolocation', 'notifications', 'camera'],
        },
      },
    },

    {
      name: 'galaxy-s9',
      use: { 
        ...devices['Galaxy S9+'],
        contextOptions: {
          permissions: ['geolocation', 'notifications', 'camera'],
        },
      },
    },

    // Tablets
    {
      name: 'ipad',
      use: { 
        ...devices['iPad Pro 11'],
        contextOptions: {
          permissions: ['geolocation', 'notifications', 'camera'],
        },
      },
    },

    {
      name: 'ipad-mini',
      use: { 
        ...devices['iPad Mini'],
        contextOptions: {
          permissions: ['geolocation', 'notifications', 'camera'],
        },
      },
    },

    // Performance testing with network throttling
    {
      name: 'mobile-slow-3g',
      use: {
        ...devices['Pixel 5'],
        contextOptions: {
          permissions: ['geolocation', 'notifications', 'camera'],
        },
        // Simulate slow 3G connection
        launchOptions: {
          args: ['--enable-features=NetworkService', '--disable-features=VizDisplayCompositor'],
        },
      },
    },

    // Accessibility testing
    {
      name: 'desktop-accessibility',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'active',
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})