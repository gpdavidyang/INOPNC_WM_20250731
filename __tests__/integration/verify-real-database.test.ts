/**
 * Integration test to verify all components use real Supabase data
 * and no hardcoded mock data is being used
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Polyfill fetch for Node.js test environment
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch')
}

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('Database Integration Tests - Verify Real Data Usage', () => {
  
  describe('1. Source Code Analysis - Find Hardcoded Data', () => {
    const componentsToCheck = [
      'components/dashboard/tabs/attendance-tab.tsx',
      'components/dashboard/tabs/work-logs-tab.tsx',
      'components/dashboard/tabs/home-tab.tsx',
      'components/notifications/notification-list.tsx',
      'components/daily-reports/daily-report-form-enhanced.tsx',
      'components/site-info/TodaySiteInfo.tsx'
    ]

    const hardcodedPatterns = [
      /mockData/gi,
      /mock\s*:/gi,
      /강남 A현장.*주상복합/g,
      /송파 B현장.*리모델링/g,
      /송파 C현장.*오피스텔/g,
      /방배 D현장.*단독주택/g,
      /const\s+(mock|test|sample|dummy)Data\s*=/gi,
      /id:\s*['"]1['"],\s*name:\s*['"]/g,
      /dummy/gi,
      /faker\./g  // Should only be in test/seed files
    ]

    test.each(componentsToCheck)('should not contain hardcoded data in %s', (filePath) => {
      const fullPath = path.join(process.cwd(), filePath)
      
      if (!fs.existsSync(fullPath)) {
        console.warn(`File not found: ${fullPath}`)
        return
      }

      const content = fs.readFileSync(fullPath, 'utf-8')
      const violations: string[] = []

      hardcodedPatterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          matches.forEach(match => {
            // Get line number
            const lines = content.substring(0, content.indexOf(match)).split('\n')
            const lineNumber = lines.length
            violations.push(`Line ${lineNumber}: Found "${match}"`)
          })
        }
      })

      if (violations.length > 0) {
        console.error(`\n❌ Hardcoded data found in ${filePath}:`)
        violations.forEach(v => console.error(`   ${v}`))
      }

      expect(violations).toHaveLength(0)
    })
  })

  describe('2. Database Connectivity Tests', () => {
    
    test('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('count')
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    test('should have real sites data (not hardcoded ones)', async () => {
      const { data: sites, error } = await supabase
        .from('sites')
        .select('name, description')

      expect(error).toBeNull()
      expect(sites).toBeDefined()
      expect(sites!.length).toBeGreaterThan(0)

      // Check if we have the test data from our seed scripts
      const siteNames = sites!.map(s => s.name)
      
      // These should exist from our seed data
      if (siteNames.includes('강남 A현장')) {
        const site = sites!.find(s => s.name === '강남 A현장')
        expect(site?.description).toBe('주상복합 건설') // From our seed data
      }
    })

    test('should have real attendance records', async () => {
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .limit(10)

      expect(error).toBeNull()
      expect(records).toBeDefined()
      
      if (records && records.length > 0) {
        // Verify structure
        expect(records[0]).toHaveProperty('profile_id')
        expect(records[0]).toHaveProperty('site_id')
        expect(records[0]).toHaveProperty('work_date')
        expect(records[0]).toHaveProperty('labor_hours')
      }
    })

    test('should have real daily reports', async () => {
      const { data: reports, error } = await supabase
        .from('daily_reports')
        .select('*')
        .limit(10)

      expect(error).toBeNull()
      expect(reports).toBeDefined()
      
      if (reports && reports.length > 0) {
        expect(reports[0]).toHaveProperty('site_id')
        expect(reports[0]).toHaveProperty('work_date')
        expect(reports[0]).toHaveProperty('work_content')
        expect(reports[0]).toHaveProperty('created_by')
      }
    })

    test('should have real user profiles', async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10)

      expect(error).toBeNull()
      expect(profiles).toBeDefined()
      expect(profiles!.length).toBeGreaterThan(0)
      
      // Check for various roles
      const roles = [...new Set(profiles!.map(p => p.role))]
      expect(roles.length).toBeGreaterThan(0)
    })
  })

  describe('3. API Endpoint Tests', () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    test('should fetch sites from API without mock data', async () => {
      // Note: This would require a running server
      // For now, we'll test the database directly
      const { data: sites } = await supabase
        .from('sites')
        .select('*')
        .eq('status', 'active')

      expect(sites).toBeDefined()
      expect(Array.isArray(sites)).toBe(true)
    })

    test('should fetch attendance records with proper joins', async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          sites!inner(name),
          profiles!inner(full_name)
        `)
        .limit(5)

      expect(error).toBeNull()
      if (data && data.length > 0) {
        // Verify joins are working
        expect(data[0].sites).toBeDefined()
        expect(data[0].profiles).toBeDefined()
      }
    })

    test('should fetch daily reports with relations', async () => {
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          sites!inner(name, address),
          profiles!inner(full_name, role)
        `)
        .limit(5)

      expect(error).toBeNull()
      if (data && data.length > 0) {
        expect(data[0].sites).toBeDefined()
        expect(data[0].profiles).toBeDefined()
      }
    })
  })

  describe('4. Data Integrity Tests', () => {
    
    test('all attendance records should have valid site references', async () => {
      const { data: records } = await supabase
        .from('attendance_records')
        .select('site_id')
        .limit(100)

      if (records && records.length > 0) {
        const siteIds = [...new Set(records.map(r => r.site_id).filter(Boolean))]
        
        const { data: sites } = await supabase
          .from('sites')
          .select('id')
          .in('id', siteIds)

        expect(sites?.length).toBe(siteIds.length)
      }
    })

    test('all daily reports should have valid creator references', async () => {
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('created_by')
        .limit(100)

      if (reports && reports.length > 0) {
        const creatorIds = [...new Set(reports.map(r => r.created_by).filter(Boolean))]
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .in('id', creatorIds)

        expect(profiles?.length).toBe(creatorIds.length)
      }
    })

    test('labor hours should be realistic values', async () => {
      const { data: records } = await supabase
        .from('attendance_records')
        .select('labor_hours')
        .not('labor_hours', 'is', null)
        .limit(100)

      if (records && records.length > 0) {
        records.forEach(record => {
          // Labor hours should be between 0 and 2 (0-16 hours)
          expect(record.labor_hours).toBeGreaterThanOrEqual(0)
          expect(record.labor_hours).toBeLessThanOrEqual(2)
          
          // Should be in increments of 0.25 (2 hours)
          const remainder = (record.labor_hours * 4) % 1
          expect(remainder).toBeCloseTo(0, 5)
        })
      }
    })
  })

  describe('5. Component-Specific Data Tests', () => {
    
    test('AttendanceTab should load real attendance data', async () => {
      // Simulate what AttendanceTab does
      const profileId = 'test-profile-id' // Would come from auth
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          work_date,
          check_in_time,
          check_out_time,
          status,
          labor_hours,
          notes,
          sites!inner(name)
        `)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: false })
        .limit(30)

      expect(error).toBeNull()
      // Verify the data structure matches what component expects
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty('work_date')
        expect(data[0]).toHaveProperty('labor_hours')
        expect(data[0].sites).toHaveProperty('name')
      }
    })

    test('WorkLogsTab should load real daily reports', async () => {
      // Simulate what WorkLogsTab should do (not mock data)
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          id,
          work_date,
          work_content,
          status,
          created_at,
          updated_at,
          sites!inner(id, name),
          profiles!inner(full_name)
        `)
        .order('work_date', { ascending: false })
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      
      if (data && data.length > 0) {
        // Verify structure matches WorkLog interface
        expect(data[0]).toHaveProperty('work_date')
        expect(data[0]).toHaveProperty('work_content')
        expect(data[0]).toHaveProperty('status')
        expect(data[0].sites).toHaveProperty('name')
        expect(data[0].profiles).toHaveProperty('full_name')
      }
    })

    test('Sites dropdown should load from database', async () => {
      const { data: sites, error } = await supabase
        .from('sites')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name')

      expect(error).toBeNull()
      expect(sites).toBeDefined()
      expect(Array.isArray(sites)).toBe(true)
      
      if (sites && sites.length > 0) {
        expect(sites[0]).toHaveProperty('id')
        expect(sites[0]).toHaveProperty('name')
        expect(sites[0]).toHaveProperty('address')
      }
    })
  })

  describe('6. Mock Data Detection', () => {
    
    test('should not find "mockData" variable declarations', () => {
      const componentsDir = path.join(process.cwd(), 'components')
      const files = findFilesRecursively(componentsDir, '.tsx')
      
      const violatingFiles: string[] = []
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8')
        if (content.includes('const mockData') || 
            content.includes('let mockData') ||
            content.includes('var mockData')) {
          violatingFiles.push(path.relative(process.cwd(), file))
        }
      })
      
      if (violatingFiles.length > 0) {
        console.error('\n❌ Files with mockData variables:')
        violatingFiles.forEach(f => console.error(`   - ${f}`))
      }
      
      expect(violatingFiles).toHaveLength(0)
    })

    test('should not have hardcoded Korean site names in components', () => {
      const componentsDir = path.join(process.cwd(), 'components')
      const files = findFilesRecursively(componentsDir, '.tsx')
      
      const hardcodedSites = [
        '강남 A현장',
        '송파 B현장',
        '송파 C현장',
        '방배 D현장'
      ]
      
      const violatingFiles: Map<string, string[]> = new Map()
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8')
        const foundSites: string[] = []
        
        hardcodedSites.forEach(site => {
          // Check if it's hardcoded (not from a variable or database)
          const regex = new RegExp(`['"\`]${site}['"\`]`, 'g')
          if (regex.test(content)) {
            foundSites.push(site)
          }
        })
        
        if (foundSites.length > 0) {
          violatingFiles.set(path.relative(process.cwd(), file), foundSites)
        }
      })
      
      if (violatingFiles.size > 0) {
        console.error('\n❌ Files with hardcoded site names:')
        violatingFiles.forEach((sites, file) => {
          console.error(`   ${file}: ${sites.join(', ')}`)
        })
      }
      
      // Note: This might find legitimate uses in seed files
      // We should only fail if found in actual components
      const componentViolations = Array.from(violatingFiles.keys())
        .filter(f => !f.includes('seed') && !f.includes('test'))
      
      expect(componentViolations).toHaveLength(0)
    })
  })
})

// Helper function to find files recursively
function findFilesRecursively(dir: string, extension: string): string[] {
  const results: string[] = []
  
  if (!fs.existsSync(dir)) {
    return results
  }
  
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      results.push(...findFilesRecursively(filePath, extension))
    } else if (file.endsWith(extension)) {
      results.push(filePath)
    }
  }
  
  return results
}

// Export for use in CI/CD
export { findFilesRecursively }