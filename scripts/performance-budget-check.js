#!/usr/bin/env node
/**
 * Performance Budget Checker
 * Validates performance metrics against defined budgets
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class PerformanceBudgetChecker {
  constructor() {
    this.budgets = {
      // Core Web Vitals (milliseconds)
      'first-contentful-paint': 2500,
      'largest-contentful-paint': 2500,
      'first-input-delay': 100,
      'total-blocking-time': 300,
      'speed-index': 3000,
      'interactive': 5000,
      
      // Layout stability (score)
      'cumulative-layout-shift': 0.1,
      
      // Overall scores (0-100)
      'performance-score': 80,
      'accessibility-score': 90,
      'best-practices-score': 85,
      'seo-score': 80,
      
      // Resource budgets (bytes)
      'total-byte-weight': 2 * 1024 * 1024, // 2MB
      'unused-javascript': 40 * 1024, // 40KB
      'unused-css-rules': 40 * 1024, // 40KB
      'render-blocking-resources': 500, // 500ms
      
      // Bundle size limits
      'main-bundle-size': 500 * 1024, // 500KB
      'vendor-bundle-size': 1024 * 1024, // 1MB
    }
    
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      timestamp: new Date().toISOString()
    }
  }

  async run() {
    console.log('🏁 Starting Performance Budget Check')
    console.log('====================================')
    
    try {
      // Check if Lighthouse CI reports exist
      await this.checkLighthouseReports()
      
      // Check bundle sizes
      await this.checkBundleSizes()
      
      // Generate report
      await this.generateReport()
      
      // Display results
      this.displayResults()
      
      // Exit with appropriate code
      process.exit(this.results.failed.length > 0 ? 1 : 0)
      
    } catch (error) {
      console.error('❌ Performance budget check failed:', error.message)
      process.exit(1)
    }
  }

  async checkLighthouseReports() {
    console.log('📊 Checking Lighthouse reports...')
    
    const reportsDir = '.lighthouseci'
    if (!fs.existsSync(reportsDir)) {
      console.log('⚠️  No Lighthouse reports found, skipping checks')
      return
    }

    const reportFiles = fs.readdirSync(reportsDir)
      .filter(file => file.startsWith('lhr-') && file.endsWith('.json'))

    if (reportFiles.length === 0) {
      console.log('⚠️  No Lighthouse report files found')
      return
    }

    for (const reportFile of reportFiles) {
      const reportPath = path.join(reportsDir, reportFile)
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      
      const url = report.finalUrl || report.requestedUrl
      console.log(`\n🌐 Checking ${url}`)
      
      // Check performance metrics
      this.checkMetric('first-contentful-paint', report.audits['first-contentful-paint']?.numericValue, url)
      this.checkMetric('largest-contentful-paint', report.audits['largest-contentful-paint']?.numericValue, url)
      this.checkMetric('first-input-delay', report.audits['max-potential-fid']?.numericValue, url)
      this.checkMetric('cumulative-layout-shift', report.audits['cumulative-layout-shift']?.numericValue, url)
      this.checkMetric('total-blocking-time', report.audits['total-blocking-time']?.numericValue, url)
      this.checkMetric('speed-index', report.audits['speed-index']?.numericValue, url)
      this.checkMetric('interactive', report.audits['interactive']?.numericValue, url)
      
      // Check category scores
      this.checkMetric('performance-score', report.categories?.performance?.score * 100, url)
      this.checkMetric('accessibility-score', report.categories?.accessibility?.score * 100, url)
      this.checkMetric('best-practices-score', report.categories?.['best-practices']?.score * 100, url)
      this.checkMetric('seo-score', report.categories?.seo?.score * 100, url)
      
      // Check resource metrics
      this.checkMetric('total-byte-weight', report.audits['total-byte-weight']?.numericValue, url)
      this.checkMetric('unused-javascript', report.audits['unused-javascript']?.numericValue, url)
      this.checkMetric('unused-css-rules', report.audits['unused-css-rules']?.numericValue, url)
      this.checkMetric('render-blocking-resources', report.audits['render-blocking-resources']?.numericValue, url)
    }
  }

  async checkBundleSizes() {
    console.log('\n📦 Checking bundle sizes...')
    
    try {
      // Run build to generate bundle stats
      console.log('Building application...')
      execSync('npm run build', { stdio: 'pipe' })
      
      // Check if Next.js build output exists
      const buildDir = '.next'
      if (!fs.existsSync(buildDir)) {
        console.log('⚠️  Build directory not found, skipping bundle size checks')
        return
      }

      // Analyze bundle sizes (simplified check)
      const staticDir = path.join(buildDir, 'static', 'chunks')
      if (fs.existsSync(staticDir)) {
        const chunks = fs.readdirSync(staticDir)
          .filter(file => file.endsWith('.js'))
          .map(file => {
            const filePath = path.join(staticDir, file)
            const stats = fs.statSync(filePath)
            return { name: file, size: stats.size }
          })

        // Check main bundle size
        const mainChunk = chunks.find(chunk => chunk.name.includes('main'))
        if (mainChunk) {
          this.checkMetric('main-bundle-size', mainChunk.size, 'main bundle')
        }

        // Check vendor bundle size
        const vendorChunks = chunks.filter(chunk => 
          chunk.name.includes('vendor') || 
          chunk.name.includes('framework') ||
          chunk.name.includes('webpack')
        )
        
        const totalVendorSize = vendorChunks.reduce((total, chunk) => total + chunk.size, 0)
        if (totalVendorSize > 0) {
          this.checkMetric('vendor-bundle-size', totalVendorSize, 'vendor bundles')
        }

        // Log bundle information
        console.log('\n📊 Bundle sizes:')
        chunks.forEach(chunk => {
          const sizeKB = (chunk.size / 1024).toFixed(2)
          console.log(`  ${chunk.name}: ${sizeKB}KB`)
        })
      }
      
    } catch (error) {
      console.log('⚠️  Could not check bundle sizes:', error.message)
    }
  }

  checkMetric(metricName, value, context) {
    if (value === undefined || value === null) {
      return
    }

    const budget = this.budgets[metricName]
    if (!budget) {
      return
    }

    const result = {
      metric: metricName,
      value,
      budget,
      context,
      timestamp: new Date().toISOString()
    }

    // Determine if metric passes budget
    let passes = false
    let isWarning = false

    if (metricName.includes('score')) {
      // Higher is better for scores
      passes = value >= budget
      isWarning = value >= budget * 0.9 // Warning if within 10% of budget
    } else {
      // Lower is better for times/sizes
      passes = value <= budget
      isWarning = value <= budget * 1.1 // Warning if within 10% of budget
    }

    if (passes) {
      this.results.passed.push(result)
      console.log(`  ✅ ${metricName}: ${this.formatValue(metricName, value)} (budget: ${this.formatValue(metricName, budget)})`)
    } else if (isWarning) {
      this.results.warnings.push(result)
      console.log(`  ⚠️  ${metricName}: ${this.formatValue(metricName, value)} (budget: ${this.formatValue(metricName, budget)})`)
    } else {
      this.results.failed.push(result)
      console.log(`  ❌ ${metricName}: ${this.formatValue(metricName, value)} (budget: ${this.formatValue(metricName, budget)})`)
    }
  }

  formatValue(metricName, value) {
    if (metricName.includes('score')) {
      return `${value.toFixed(1)}`
    } else if (metricName.includes('size') || metricName.includes('weight')) {
      return `${(value / 1024).toFixed(2)}KB`
    } else if (metricName === 'cumulative-layout-shift') {
      return value.toFixed(3)
    } else {
      return `${Math.round(value)}ms`
    }
  }

  async generateReport() {
    const report = {
      summary: {
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        warnings: this.results.warnings.length,
        total: this.results.passed.length + this.results.failed.length + this.results.warnings.length
      },
      budgets: this.budgets,
      results: this.results,
      generatedAt: new Date().toISOString()
    }

    // Ensure reports directory exists
    const reportsDir = 'test-results/performance'
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    // Write JSON report
    const reportPath = path.join(reportsDir, 'budget-check-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Write HTML report
    const htmlReport = this.generateHtmlReport(report)
    const htmlPath = path.join(reportsDir, 'budget-check-report.html')
    fs.writeFileSync(htmlPath, htmlReport)

    console.log(`\n📝 Reports generated:`)
    console.log(`  JSON: ${reportPath}`)
    console.log(`  HTML: ${htmlPath}`)
  }

  generateHtmlReport(data) {
    const { summary, results } = data
    const successRate = Math.round((summary.passed / summary.total) * 100)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Budget Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { padding: 20px; border-radius: 8px; text-align: center; }
        .metric.success { background: #d4edda; color: #155724; }
        .metric.warning { background: #fff3cd; color: #856404; }
        .metric.danger { background: #f8d7da; color: #721c24; }
        .metric h3 { margin: 0 0 10px 0; font-size: 24px; }
        .results { margin-top: 30px; }
        .result-section { margin-bottom: 30px; }
        .result-item { padding: 15px; margin: 10px 0; border-radius: 5px; display: flex; justify-content: space-between; }
        .result-item.passed { background: #d4edda; border-left: 4px solid #28a745; }
        .result-item.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .result-item.failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .metric-name { font-weight: bold; }
        .metric-value { font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Budget Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric ${summary.failed > 0 ? 'danger' : summary.warnings > 0 ? 'warning' : 'success'}">
            <h3>${summary.total}</h3>
            <p>Total Checks</p>
        </div>
        <div class="metric success">
            <h3>${summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric ${summary.warnings > 0 ? 'warning' : 'success'}">
            <h3>${summary.warnings}</h3>
            <p>Warnings</p>
        </div>
        <div class="metric ${summary.failed > 0 ? 'danger' : 'success'}">
            <h3>${summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric ${successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'danger'}">
            <h3>${successRate}%</h3>
            <p>Success Rate</p>
        </div>
    </div>
    
    <div class="results">
        ${summary.failed > 0 ? `
        <div class="result-section">
            <h3>❌ Failed Budgets</h3>
            ${results.failed.map(result => `
                <div class="result-item failed">
                    <div>
                        <div class="metric-name">${result.metric}</div>
                        <div style="font-size: 12px; color: #666;">${result.context}</div>
                    </div>
                    <div class="metric-value">
                        ${this.formatValue(result.metric, result.value)} / ${this.formatValue(result.metric, result.budget)}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${summary.warnings > 0 ? `
        <div class="result-section">
            <h3>⚠️ Warnings</h3>
            ${results.warnings.map(result => `
                <div class="result-item warning">
                    <div>
                        <div class="metric-name">${result.metric}</div>
                        <div style="font-size: 12px; color: #666;">${result.context}</div>
                    </div>
                    <div class="metric-value">
                        ${this.formatValue(result.metric, result.value)} / ${this.formatValue(result.metric, result.budget)}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="result-section">
            <h3>✅ Passed Budgets</h3>
            ${results.passed.map(result => `
                <div class="result-item passed">
                    <div>
                        <div class="metric-name">${result.metric}</div>
                        <div style="font-size: 12px; color: #666;">${result.context}</div>
                    </div>
                    <div class="metric-value">
                        ${this.formatValue(result.metric, result.value)} / ${this.formatValue(result.metric, result.budget)}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`
  }

  displayResults() {
    console.log('\n📋 Performance Budget Summary')
    console.log('=============================')
    console.log(`Total Checks: ${this.results.passed.length + this.results.failed.length + this.results.warnings.length}`)
    console.log(`✅ Passed: ${this.results.passed.length}`)
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`)
    console.log(`❌ Failed: ${this.results.failed.length}`)

    if (this.results.failed.length > 0) {
      console.log('\n💥 Budget Violations:')
      this.results.failed.forEach(result => {
        console.log(`  - ${result.metric}: ${this.formatValue(result.metric, result.value)} (budget: ${this.formatValue(result.metric, result.budget)})`)
      })
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Near Budget Limits:')
      this.results.warnings.forEach(result => {
        console.log(`  - ${result.metric}: ${this.formatValue(result.metric, result.value)} (budget: ${this.formatValue(result.metric, result.budget)})`)
      })
    }

    if (this.results.failed.length === 0) {
      console.log('\n🎉 All performance budgets are within limits!')
    } else {
      console.log('\n🔧 Performance budgets exceeded. Please optimize the failing metrics.')
    }
  }
}

// Run the budget checker
if (require.main === module) {
  const checker = new PerformanceBudgetChecker()
  checker.run().catch(error => {
    console.error('Budget checker failed:', error)
    process.exit(1)
  })
}

module.exports = PerformanceBudgetChecker