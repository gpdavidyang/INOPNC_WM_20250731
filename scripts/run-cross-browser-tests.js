#!/usr/bin/env node
/**
 * Cross-Browser and Mobile Testing Script
 * Executes comprehensive testing across multiple browsers and devices
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class CrossBrowserTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      projects: {},
      startTime: Date.now(),
      endTime: null
    }
    
    this.config = {
      // Test suites to run
      suites: [
        {
          name: 'Cross-Browser Compatibility',
          command: 'npm run test:e2e:compatibility',
          projects: ['chromium', 'firefox', 'webkit'],
          critical: true
        },
        {
          name: 'Mobile Responsive Design',
          command: 'npm run test:e2e:responsive',
          projects: ['iphone-se', 'iphone-14', 'ipad', 'desktop-large'],
          critical: true
        },
        {
          name: 'Touch Gestures',
          command: 'npm run test:e2e:touch',
          projects: ['iphone-14', 'pixel-7'],
          critical: false
        },
        {
          name: 'PWA Functionality',
          command: 'npm run test:e2e:pwa',
          projects: ['chromium', 'iphone-14'],
          critical: false
        },
        {
          name: 'Performance Testing',
          command: 'npm run test:e2e:performance',
          projects: ['mobile-slow-3g', 'desktop-large'],
          critical: false
        },
        {
          name: 'Accessibility Testing',
          command: 'npm run test:e2e:accessibility',
          projects: ['desktop-accessibility'],
          critical: true
        }
      ],
      
      // Output configuration
      outputDir: 'test-results/cross-browser',
      reportFormat: 'json'
    }
  }

  async run() {
    console.log('🚀 Starting Cross-Browser and Mobile Testing Suite')
    console.log('================================================')
    
    // Ensure output directory exists
    this.ensureOutputDir()
    
    // Run pre-flight checks
    await this.preflightChecks()
    
    // Execute test suites
    for (const suite of this.config.suites) {
      await this.runTestSuite(suite)
    }
    
    // Generate reports
    await this.generateReports()
    
    // Display summary
    this.displaySummary()
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0)
  }

  ensureOutputDir() {
    const outputPath = path.resolve(this.config.outputDir)
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true })
    }
  }

  async preflightChecks() {
    console.log('🔍 Running pre-flight checks...')
    
    try {
      // Check if Playwright browsers are installed
      execSync('npx playwright --version', { stdio: 'pipe' })
      console.log('✅ Playwright is available')
      
      // Check if development server can start
      console.log('🌐 Checking server availability...')
      const serverCheck = spawn('npm', ['run', 'dev'], { 
        stdio: 'pipe',
        detached: true 
      })
      
      // Wait for server to start
      await new Promise((resolve, reject) => {
        let output = ''
        const timeout = setTimeout(() => {
          serverCheck.kill()
          reject(new Error('Server startup timeout'))
        }, 30000)
        
        serverCheck.stdout.on('data', (data) => {
          output += data.toString()
          if (output.includes('Ready in') || output.includes('Local:')) {
            clearTimeout(timeout)
            serverCheck.kill()
            resolve()
          }
        })
        
        serverCheck.on('error', reject)
      })
      
      console.log('✅ Development server is working')
      
    } catch (error) {
      console.error('❌ Pre-flight check failed:', error.message)
      process.exit(1)
    }
  }

  async runTestSuite(suite) {
    console.log(`\\n📱 Running: ${suite.name}`)
    console.log(`Projects: ${suite.projects.join(', ')}`)
    console.log(`Critical: ${suite.critical ? 'Yes' : 'No'}`)
    
    const startTime = Date.now()
    
    try {
      const output = execSync(suite.command, { 
        encoding: 'utf8',
        timeout: 300000, // 5 minutes timeout
        stdio: 'pipe'
      })
      
      const duration = Date.now() - startTime
      const result = this.parseTestOutput(output)
      
      this.results.projects[suite.name] = {
        ...result,
        duration,
        critical: suite.critical,
        projects: suite.projects,
        status: 'passed'
      }
      
      this.results.passed += result.passed
      this.results.failed += result.failed
      this.results.skipped += result.skipped
      
      console.log(`✅ ${suite.name} completed in ${duration}ms`)
      console.log(`   Passed: ${result.passed}, Failed: ${result.failed}, Skipped: ${result.skipped}`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const output = error.stdout || error.stderr || error.message
      const result = this.parseTestOutput(output)
      
      this.results.projects[suite.name] = {
        ...result,
        duration,
        critical: suite.critical,
        projects: suite.projects,
        status: 'failed',
        error: error.message
      }
      
      this.results.failed += Math.max(result.failed, 1) // At least 1 failure
      
      console.log(`❌ ${suite.name} failed after ${duration}ms`)
      console.log(`   Error: ${error.message}`)
      
      if (suite.critical) {
        console.log('⚠️  This is a critical test suite!')
      }
    }
  }

  parseTestOutput(output) {
    // Parse Playwright test output
    const passedMatch = output.match(/(\d+) passed/)
    const failedMatch = output.match(/(\d+) failed/)
    const skippedMatch = output.match(/(\d+) skipped/)
    
    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0
    }
  }

  async generateReports() {
    console.log('\\n📊 Generating test reports...')
    
    this.results.endTime = Date.now()
    this.results.totalDuration = this.results.endTime - this.results.startTime
    
    // Generate JSON report
    const jsonReport = {
      summary: {
        total: this.results.passed + this.results.failed + this.results.skipped,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        duration: this.results.totalDuration,
        timestamp: new Date().toISOString()
      },
      projects: this.results.projects,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }
    
    const reportPath = path.join(this.config.outputDir, 'cross-browser-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2))
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(jsonReport)
    const htmlPath = path.join(this.config.outputDir, 'cross-browser-report.html')
    fs.writeFileSync(htmlPath, htmlReport)
    
    console.log(`✅ Reports generated:`)
    console.log(`   JSON: ${reportPath}`)
    console.log(`   HTML: ${htmlPath}`)
  }

  generateHtmlReport(data) {
    const { summary, projects } = data
    const successRate = Math.round((summary.passed / summary.total) * 100)
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Browser Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { padding: 20px; border-radius: 8px; text-align: center; }
        .metric.success { background: #d4edda; color: #155724; }
        .metric.danger { background: #f8d7da; color: #721c24; }
        .metric.warning { background: #fff3cd; color: #856404; }
        .metric.info { background: #d1ecf1; color: #0c5460; }
        .metric h3 { margin: 0 0 10px 0; font-size: 24px; }
        .metric p { margin: 0; font-size: 14px; }
        .projects { display: grid; gap: 20px; }
        .project { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .project.passed { border-left: 4px solid #28a745; }
        .project.failed { border-left: 4px solid #dc3545; }
        .project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .project-title { font-size: 18px; font-weight: 600; }
        .status { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .project-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .detail { text-align: center; }
        .detail-value { font-size: 20px; font-weight: 600; margin-bottom: 5px; }
        .detail-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .projects-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .project-badge { padding: 4px 8px; background: #e9ecef; border-radius: 4px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Cross-Browser & Mobile Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric ${summary.failed > 0 ? 'danger' : 'success'}">
            <h3>${summary.total}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric success">
            <h3>${summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric ${summary.failed > 0 ? 'danger' : 'info'}">
            <h3>${summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric ${summary.skipped > 0 ? 'warning' : 'info'}">
            <h3>${summary.skipped}</h3>
            <p>Skipped</p>
        </div>
        <div class="metric ${successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'danger'}">
            <h3>${successRate}%</h3>
            <p>Success Rate</p>
        </div>
        <div class="metric info">
            <h3>${Math.round(summary.duration / 1000)}s</h3>
            <p>Total Duration</p>
        </div>
    </div>
    
    <div class="projects">
        ${Object.entries(projects).map(([name, project]) => `
            <div class="project ${project.status}">
                <div class="project-header">
                    <div class="project-title">${name}</div>
                    <div class="status ${project.status}">${project.status}</div>
                </div>
                <div class="project-details">
                    <div class="detail">
                        <div class="detail-value">${project.passed}</div>
                        <div class="detail-label">Passed</div>
                    </div>
                    <div class="detail">
                        <div class="detail-value">${project.failed}</div>
                        <div class="detail-label">Failed</div>
                    </div>
                    <div class="detail">
                        <div class="detail-value">${project.skipped}</div>
                        <div class="detail-label">Skipped</div>
                    </div>
                    <div class="detail">
                        <div class="detail-value">${Math.round(project.duration / 1000)}s</div>
                        <div class="detail-label">Duration</div>
                    </div>
                </div>
                <div class="projects-list">
                    ${project.projects.map(p => `<span class="project-badge">${p}</span>`).join('')}
                </div>
                ${project.error ? `<div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-family: monospace; font-size: 12px;">${project.error}</div>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`
  }

  displaySummary() {
    console.log('\\n📋 Test Summary')
    console.log('================')
    console.log(`Total Tests: ${this.results.passed + this.results.failed + this.results.skipped}`)
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log(`⏸️  Skipped: ${this.results.skipped}`)
    console.log(`⏱️  Duration: ${Math.round(this.results.totalDuration / 1000)}s`)
    
    const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)
    console.log(`📊 Success Rate: ${successRate}%`)
    
    // Show critical failures
    const criticalFailures = Object.entries(this.results.projects)
      .filter(([name, project]) => project.critical && project.status === 'failed')
    
    if (criticalFailures.length > 0) {
      console.log('\\n⚠️  Critical Test Failures:')
      criticalFailures.forEach(([name, project]) => {
        console.log(`   - ${name}: ${project.error}`)
      })
    }
    
    if (this.results.failed === 0) {
      console.log('\\n🎉 All tests passed! Your application works great across browsers and devices.')
    } else {
      console.log('\\n🔧 Some tests failed. Check the detailed report for more information.')
    }
  }
}

// Run the test suite
if (require.main === module) {
  const runner = new CrossBrowserTestRunner()
  runner.run().catch(error => {
    console.error('Test runner failed:', error)
    process.exit(1)
  })
}

module.exports = CrossBrowserTestRunner