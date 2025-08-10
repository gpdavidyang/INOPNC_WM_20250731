#!/usr/bin/env tsx
/**
 * Script to verify all components use real database instead of hardcoded data
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

interface CheckResult {
  component: string
  issues: string[]
  passed: boolean
}

// Components to check
const COMPONENTS_TO_CHECK = [
  'components/dashboard/tabs/attendance-tab.tsx',
  'components/dashboard/tabs/work-logs-tab.tsx',
  'components/dashboard/tabs/home-tab.tsx',
  'components/notifications/notification-list.tsx',
  'components/daily-reports/daily-report-form-enhanced.tsx',
  'components/site-info/TodaySiteInfo.tsx'
]

// Test files to check (excluding verification test files that need hardcoded patterns)
const TEST_FILES_TO_CHECK = [
  '__tests__/utils/test-utils.tsx',
  '__tests__/components/dashboard/tabs/attendance-tab.test.tsx',
  '__tests__/components/dashboard/work-logs-tab.test.tsx',
  '__tests__/app/actions/documents-simplified.test.ts',
  'app/actions/__tests__/validation.test.ts'
]

// Patterns that indicate hardcoded data (refined to avoid false positives in tests)
const HARDCODED_PATTERNS = [
  { pattern: /const\s+mockData\s*=/g, description: 'Mock data variable declaration' },
  { pattern: /강남 A현장.*주상복합/g, description: 'Hardcoded site: 강남 A현장' },
  { pattern: /송파 B현장.*리모델링/g, description: 'Hardcoded site: 송파 B현장' },
  { pattern: /송파 C현장.*오피스텔/g, description: 'Hardcoded site: 송파 C현장' },
  { pattern: /방배 D현장.*단독주택/g, description: 'Hardcoded site: 방배 D현장' },
  { pattern: /site_name:\s*['"]강남 A현장['"]/g, description: 'Hardcoded site name in data' },
  { pattern: /site_name:\s*['"]송파 [BC]현장['"]/g, description: 'Hardcoded site name in data' },
  { pattern: /name:\s*['"]강남 A현장['"]/g, description: 'Hardcoded site name in data' },
  { pattern: /name:\s*['"]송파 [BC]현장['"]/g, description: 'Hardcoded site name in data' },
  { pattern: /\|\|\s*['"]김건축['"]/g, description: 'Hardcoded fallback name: 김건축' },
  { pattern: /\|\|\s*['"]이안전['"]/g, description: 'Hardcoded fallback name: 이안전' },
  { pattern: /\|\|\s*['"]010-[0-9]{4}-[0-9]{4}['"]/g, description: 'Hardcoded fallback phone number' }
]

// Patterns that indicate proper database usage
const DATABASE_PATTERNS = [
  { pattern: /supabase\s*\.\s*from\s*\(/g, description: 'Supabase query' },
  { pattern: /createClient/g, description: 'Supabase client creation' },
  { pattern: /\.select\s*\(/g, description: 'Database select query' },
  { pattern: /\.insert\s*\(/g, description: 'Database insert query' },
  { pattern: /\.update\s*\(/g, description: 'Database update query' },
  { pattern: /getNotifications/g, description: 'Database action function' },
  { pattern: /getSites/g, description: 'Database action function' },
  { pattern: /getSiteInfo/g, description: 'Database action function' },
  { pattern: /createDailyReport/g, description: 'Database action function' },
  { pattern: /sites:\s*Site\[\]/g, description: 'Sites props interface' },
  { pattern: /siteInfo:\s*SiteInfo/g, description: 'SiteInfo props interface' },
  { pattern: /sites\s*&&\s*sites\.length/g, description: 'Sites props usage' },
  { pattern: /siteInfo\s*&&/g, description: 'SiteInfo props usage' }
]

function checkComponent(componentPath: string): CheckResult {
  const fullPath = path.join(process.cwd(), componentPath)
  const issues: string[] = []
  
  if (!fs.existsSync(fullPath)) {
    return {
      component: componentPath,
      issues: [`File not found: ${fullPath}`],
      passed: false
    }
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8')
  const lines = content.split('\n')
  
  // Check for hardcoded patterns
  HARDCODED_PATTERNS.forEach(({ pattern, description }) => {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const lineNumber = lines.findIndex(line => line.includes(match)) + 1
        issues.push(`Line ${lineNumber}: ${description} - "${match.substring(0, 50)}..."`)
      })
    }
  })
  
  // Check if database patterns exist
  let hasDatabase = false
  DATABASE_PATTERNS.forEach(({ pattern }) => {
    if (pattern.test(content)) {
      hasDatabase = true
    }
  })
  
  if (!hasDatabase && !componentPath.includes('test')) {
    issues.push('No database queries found - might be using static data')
  }
  
  return {
    component: componentPath,
    issues,
    passed: issues.length === 0
  }
}

async function checkDatabase() {
  console.log('🔍 Checking database connection...\n')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    return false
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test sites table
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('name, status')
      .limit(5)
    
    if (sitesError) {
      console.error('❌ Cannot fetch sites:', sitesError.message)
      return false
    }
    
    console.log(`✅ Sites table: ${sites?.length || 0} sites found`)
    
    // Test attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id')
      .limit(5)
    
    if (attendanceError) {
      console.error('❌ Cannot fetch attendance records:', attendanceError.message)
      return false
    }
    
    console.log(`✅ Attendance table: ${attendance?.length || 0} records found`)
    
    // Test daily reports
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('id')
      .limit(5)
    
    if (reportsError) {
      console.error('❌ Cannot fetch daily reports:', reportsError.message)
      return false
    }
    
    console.log(`✅ Daily reports table: ${reports?.length || 0} reports found`)
    
    return true
  } catch (error) {
    console.error('❌ Database error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Database Usage Verification Tool\n')
  console.log('=' .repeat(60))
  
  // Step 1: Check components for hardcoded data
  console.log('\n📝 Checking components for hardcoded data...\n')
  
  const results: CheckResult[] = []
  let totalIssues = 0
  
  for (const component of COMPONENTS_TO_CHECK) {
    const result = checkComponent(component)
    results.push(result)
    totalIssues += result.issues.length
    
    if (result.passed) {
      console.log(`✅ ${component}`)
    } else {
      console.log(`❌ ${component}`)
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`)
      })
    }
  }
  
  // Step 1.5: Check test files for hardcoded data
  console.log('\n🧪 Checking test files for hardcoded data...\n')
  
  const testResults: CheckResult[] = []
  let totalTestIssues = 0
  
  for (const testFile of TEST_FILES_TO_CHECK) {
    const result = checkComponent(testFile)
    testResults.push(result)
    totalTestIssues += result.issues.length
    
    if (result.passed) {
      console.log(`✅ ${testFile}`)
    } else {
      console.log(`❌ ${testFile}`)
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`)
      })
    }
  }
  
  // Step 2: Check database connectivity
  console.log('\n' + '=' .repeat(60))
  console.log('\n🔗 Checking database connectivity...\n')
  
  const dbConnected = await checkDatabase()
  
  // Summary
  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 Summary\n')
  
  const passedComponents = results.filter(r => r.passed).length
  const failedComponents = results.filter(r => !r.passed).length
  const passedTests = testResults.filter(r => r.passed).length
  const failedTests = testResults.filter(r => !r.passed).length
  
  console.log(`Components checked: ${COMPONENTS_TO_CHECK.length}`)
  console.log(`  ✅ Passed: ${passedComponents}`)
  console.log(`  ❌ Failed: ${failedComponents}`)
  console.log(`  Total issues found: ${totalIssues}`)
  
  console.log(`\nTest files checked: ${TEST_FILES_TO_CHECK.length}`)
  console.log(`  ✅ Passed: ${passedTests}`)
  console.log(`  ❌ Failed: ${failedTests}`)
  console.log(`  Total test issues found: ${totalTestIssues}`)
  
  console.log(`\nDatabase connection: ${dbConnected ? '✅ Connected' : '❌ Not connected'}`)
  
  const totalAllIssues = totalIssues + totalTestIssues
  
  if (totalAllIssues === 0 && dbConnected) {
    console.log('\n🎉 All components and tests are clean!')
    console.log('No hardcoded mock data found in components or tests.')
  } else {
    console.log('\n⚠️ Issues found:')
    if (totalIssues > 0) {
      console.log(`  - ${totalIssues} hardcoded data issues in components`)
    }
    if (totalTestIssues > 0) {
      console.log(`  - ${totalTestIssues} hardcoded data issues in test files`)
    }
    if (!dbConnected) {
      console.log('  - Database connection failed')
    }
    console.log('\n💡 Recommendations:')
    console.log('  1. Replace all mockData with Supabase queries in components')
    console.log('  2. Remove hardcoded site names and IDs from tests')
    console.log('  3. Use dynamic test data or database factories')
    console.log('  4. Run "npm run seed:full" to populate test data')
  }
  
  // Exit with error code if issues found
  process.exit(totalAllIssues > 0 || !dbConnected ? 1 : 0)
}

// Run the verification
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})