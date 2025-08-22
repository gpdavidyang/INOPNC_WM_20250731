#!/usr/bin/env node

/**
 * CI/CD Setup Validation Script
 * 
 * This script validates that all CI/CD components are properly configured:
 * - GitHub Actions workflows
 * - Test configurations
 * - Coverage settings
 * - Required scripts and dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CIValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '✅',
      'warn': '⚠️ ',
      'error': '❌',
      'check': '🔍'
    }[type] || 'ℹ️ ';
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warn') this.warnings.push(message);
    if (type === 'check') this.checks.push(message);
  }

  validateFile(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.log(`${description} exists: ${filePath}`, 'info');
      return true;
    } else {
      this.log(`${description} missing: ${filePath}`, 'error');
      return false;
    }
  }

  validateWorkflows() {
    this.log('Validating GitHub Actions workflows...', 'check');
    
    const workflows = [
      { file: '.github/workflows/ci.yml', name: 'Main CI/CD Pipeline' },
      { file: '.github/workflows/preview-deployment.yml', name: 'Preview Deployment' },
      { file: '.github/workflows/nightly-tests.yml', name: 'Nightly Testing' },
      { file: '.github/workflows/test-monitoring.yml', name: 'Test Monitoring' },
      { file: '.github/workflows/auto-backup.yml', name: 'Auto Backup (existing)' },
      { file: '.github/workflows/docs-sync.yml', name: 'Docs Sync (existing)' }
    ];

    let workflowsValid = true;
    for (const workflow of workflows) {
      if (!this.validateFile(workflow.file, workflow.name)) {
        workflowsValid = false;
      }
    }

    // Validate workflow content
    if (fs.existsSync('.github/workflows/ci.yml')) {
      const ciContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
      
      const requiredJobs = [
        'lint-and-typecheck',
        'unit-integration-tests',
        'critical-tests',
        'e2e-tests',
        'coverage-check',
        'build-verification',
        'security-scan',
        'deployment-readiness'
      ];

      for (const job of requiredJobs) {
        if (ciContent.includes(job)) {
          this.log(`CI job '${job}' configured`, 'info');
        } else {
          this.log(`CI job '${job}' missing or misconfigured`, 'error');
          workflowsValid = false;
        }
      }
    }

    return workflowsValid;
  }

  validateTestConfiguration() {
    this.log('Validating test configuration...', 'check');
    
    let testConfigValid = true;

    // Jest configuration
    if (this.validateFile('jest.config.js', 'Jest configuration')) {
      const jestConfig = require(path.resolve('jest.config.js'));
      const config = typeof jestConfig === 'function' ? jestConfig() : jestConfig;
      
      if (config.coverageThreshold && config.coverageThreshold.global) {
        const threshold = config.coverageThreshold.global.lines;
        if (threshold >= 70) {
          this.log(`Coverage threshold set to ${threshold}%`, 'info');
        } else {
          this.log(`Coverage threshold too low: ${threshold}% (should be ≥70%)`, 'warn');
        }
      } else {
        this.log('Coverage threshold not configured', 'error');
        testConfigValid = false;
      }
    } else {
      testConfigValid = false;
    }

    // Playwright configuration
    if (this.validateFile('playwright.config.ts', 'Playwright configuration')) {
      const playwrightContent = fs.readFileSync('playwright.config.ts', 'utf8');
      
      if (playwrightContent.includes('chromium') && 
          playwrightContent.includes('firefox') && 
          playwrightContent.includes('webkit')) {
        this.log('All browsers configured for Playwright', 'info');
      } else {
        this.log('Not all browsers configured in Playwright', 'warn');
      }
    } else {
      testConfigValid = false;
    }

    // Codecov configuration
    this.validateFile('codecov.yml', 'Codecov configuration');

    return testConfigValid;
  }

  validateScripts() {
    this.log('Validating package.json scripts...', 'check');
    
    let scriptsValid = true;

    if (this.validateFile('package.json', 'Package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const requiredScripts = [
        'test',
        'test:e2e',
        'test:critical',
        'build',
        'lint',
        'type-check'
      ];

      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.log(`Script '${script}' configured`, 'info');
        } else {
          this.log(`Script '${script}' missing`, 'error');
          scriptsValid = false;
        }
      }

      // Check for testing dependencies
      const testDeps = [
        '@playwright/test',
        'jest',
        '@testing-library/react',
        '@testing-library/jest-dom'
      ];

      for (const dep of testDeps) {
        if ((packageJson.dependencies && packageJson.dependencies[dep]) ||
            (packageJson.devDependencies && packageJson.devDependencies[dep])) {
          this.log(`Test dependency '${dep}' installed`, 'info');
        } else {
          this.log(`Test dependency '${dep}' missing`, 'error');
          scriptsValid = false;
        }
      }
    } else {
      scriptsValid = false;
    }

    return scriptsValid;
  }

  validateTestFiles() {
    this.log('Validating test files structure...', 'check');
    
    let testFilesValid = true;

    // Check for test directories
    const testDirs = [
      '__tests__',
      'e2e'
    ];

    for (const dir of testDirs) {
      if (fs.existsSync(dir)) {
        const files = this.countFiles(dir, /\.(test|spec)\.(ts|tsx|js)$/);
        this.log(`${dir} directory contains ${files} test files`, 'info');
      } else {
        this.log(`Test directory '${dir}' missing`, 'error');
        testFilesValid = false;
      }
    }

    // Check for critical test files
    const criticalTests = [
      '__tests__/integration/auth-integration.test.tsx',
      'e2e/auth/login.spec.ts',
      'e2e/dashboard/navigation.spec.ts'
    ];

    for (const testFile of criticalTests) {
      if (fs.existsSync(testFile)) {
        this.log(`Critical test file exists: ${testFile}`, 'info');
      } else {
        this.log(`Critical test file missing: ${testFile}`, 'warn');
      }
    }

    return testFilesValid;
  }

  validateHealthCheck() {
    this.log('Validating health check endpoint...', 'check');
    
    const healthEndpoint = 'app/api/health/route.ts';
    return this.validateFile(healthEndpoint, 'Health check API endpoint');
  }

  countFiles(dir, pattern) {
    let count = 0;
    
    function scan(directory) {
      if (!fs.existsSync(directory)) return;
      
      const items = fs.readdirSync(directory);
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (pattern.test(item)) {
          count++;
        }
      }
    }
    
    scan(dir);
    return count;
  }

  testCommand(command, description) {
    try {
      execSync(command, { stdio: 'pipe' });
      this.log(`${description} - OK`, 'info');
      return true;
    } catch (error) {
      this.log(`${description} - Failed: ${error.message}`, 'error');
      return false;
    }
  }

  validateCommands() {
    this.log('Validating CI commands...', 'check');
    
    let commandsValid = true;

    // Test basic commands that CI will run
    const commands = [
      { cmd: 'npm run lint -- --max-warnings 0', desc: 'Linting' },
      { cmd: 'npm run type-check', desc: 'Type checking' },
      { cmd: 'npm run build', desc: 'Build process' }
    ];

    for (const { cmd, desc } of commands) {
      if (!this.testCommand(cmd, desc)) {
        commandsValid = false;
      }
    }

    return commandsValid;
  }

  async runValidation() {
    this.log('🚀 Starting CI/CD setup validation...', 'info');
    this.log('', 'info');

    const validations = [
      { name: 'GitHub Actions Workflows', fn: () => this.validateWorkflows() },
      { name: 'Test Configuration', fn: () => this.validateTestConfiguration() },
      { name: 'Package Scripts', fn: () => this.validateScripts() },
      { name: 'Test Files Structure', fn: () => this.validateTestFiles() },
      { name: 'Health Check Endpoint', fn: () => this.validateHealthCheck() },
      { name: 'CI Commands', fn: () => this.validateCommands() }
    ];

    let allValid = true;
    for (const validation of validations) {
      this.log(`\n--- ${validation.name} ---`, 'check');
      const isValid = validation.fn();
      if (!isValid) allValid = false;
    }

    this.log('\n📊 Validation Summary', 'info');
    this.log(`Total checks performed: ${this.checks.length}`, 'info');
    this.log(`Errors found: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'info');
    this.log(`Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'warn' : 'info');

    if (this.errors.length > 0) {
      this.log('\n❌ Errors that must be fixed:', 'error');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  Warnings to consider:', 'warn');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (allValid && this.errors.length === 0) {
      this.log('\n🎉 CI/CD setup validation completed successfully!', 'info');
      this.log('Your CI/CD pipeline is ready for production use.', 'info');
      return true;
    } else {
      this.log('\n❌ CI/CD setup validation failed.', 'error');
      this.log('Please fix the errors above before deploying.', 'error');
      return false;
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CIValidator();
  validator.runValidation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed with error:', error);
      process.exit(1);
    });
}

module.exports = CIValidator;