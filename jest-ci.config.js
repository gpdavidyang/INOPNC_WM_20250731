const baseConfig = require('./jest.config.js')

// CI-specific Jest configuration
module.exports = {
  ...baseConfig,
  // CI optimizations
  bail: 1, // Stop on first test failure
  ci: true,
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'Test Report',
        outputPath: './test-results/test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true
      }
    ]
  ],
  // Performance settings for CI
  maxWorkers: '50%',
  testTimeout: 15000,
  // Additional ignore patterns for CI
  testPathIgnorePatterns: [
    ...baseConfig.testPathIgnorePatterns,
    '__tests__/e2e/', // E2E tests run separately
    '__tests__/performance/', // Performance tests run separately
  ],
  // Fail fast in CI
  errorOnDeprecated: true,
}