#!/usr/bin/env tsx
/**
 * Comprehensive Construction Site Data Seeder
 * Generates realistic Korean construction site data using the advanced data generation classes
 * 
 * Usage: npx tsx scripts/seed-comprehensive-data.ts [options]
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { faker } from '@faker-js/faker'
import { ConstructionDataGenerator, PayrollCalculator, MaterialWorkflowManager } from '../lib/data-generation/generators'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize advanced data generators
const dataGenerator = ConstructionDataGenerator.getInstance()
const payrollCalculator = PayrollCalculator.getInstance()
const materialWorkflow = MaterialWorkflowManager.getInstance()

// Configuration for data volume
const CONFIG = {
  ORGANIZATIONS: 5,
  SITES_PER_ORG: 3,
  WORKERS: 50,
  MANAGERS: 10,
  ADMINS: 3,
  DAYS_OF_HISTORY: 90,
  DAILY_REPORTS_PER_SITE: 60,
  DOCUMENTS_PER_SITE: 20,
  MATERIALS_TYPES: 30,
  NOTIFICATIONS_PER_USER: 10,
  EQUIPMENT_ITEMS: 25
}

// Korean construction-related data
const KOREAN_DATA = {
  lastNames: ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'],
  firstNames: ['민수', '지훈', '서연', '지우', '서준', '민지', '준호', '지영', '성민', '수진', '영호', '은주', '태현', '혜진', '진우'],
  companies: ['삼성건설', '현대건설', 'GS건설', '대림산업', '포스코건설', 'DL이앤씨', '대우건설', '롯데건설', 'SK에코플랜트', 'HDC현대산업개발'],
  siteTypes: ['아파트', '오피스텔', '주상복합', '상가', '물류센터', '공장', '병원', '학교', '호텔', '리모델링'],
  districts: ['강남구', '서초구', '송파구', '강동구', '마포구', '용산구', '성동구', '광진구', '중구', '종로구'],
  materials: [
    '철근 SD400 D10', '철근 SD400 D13', '철근 SD400 D16', '철근 SD400 D19', '철근 SD400 D22',
    '레미콘 25-21-120', '레미콘 25-24-120', '레미콘 25-27-120', '레미콘 30-24-120',
    '시멘트 포틀랜드 1종', '시멘트 포틀랜드 2종', '모래 강모래', '모래 바다모래',
    '자갈 13mm', '자갈 25mm', '벽돌 적벽돌', '벽돌 시멘트벽돌',
    '합판 12mm', '합판 18mm', '각재 3x6', '각재 4x8',
    '페인트 수성', '페인트 유성', '타일 300x300', '타일 600x600',
    '유리 5mm', '유리 강화 10mm', '단열재 스티로폼', '단열재 우레탄폼'
  ],
  equipment: [
    '타워크레인 25톤', '타워크레인 50톤', '굴삭기 06급', '굴삭기 02급',
    '덤프트럭 15톤', '덤프트럭 25톤', '펌프카', '믹서트럭',
    '지게차 3톤', '지게차 5톤', '고소작업대', '스카이차',
    '콘크리트 펌프', '발전기 100KW', '발전기 200KW', '용접기',
    '컴프레서', '브레이커', '그라인더', '전동드릴',
    '안전발판', '안전네트', '비계파이프', '클램프', '안전고리'
  ],
  workProcesses: [
    '터파기', '기초공사', '골조공사', '철근배근', '거푸집설치',
    '콘크리트타설', '양생작업', '철골공사', '조적공사', '미장공사',
    '방수공사', '단열공사', '타일공사', '도장공사', '전기공사',
    '설비공사', '소방공사', '엘리베이터설치', '창호공사', '마감공사'
  ],
  weatherConditions: ['맑음', '흐림', '비', '눈', '안개', '강풍'],
  safetyIssues: [
    '안전모 착용 필수', '안전화 착용 필수', '안전대 착용 필수',
    '추락 위험 구역', '중장비 작업 구역', '크레인 작업 반경 주의',
    '전기 작업 중', '용접 작업 중', '고소 작업 중'
  ]
}

// Helper functions
function getRandomKoreanName(): string {
  const lastName = faker.helpers.arrayElement(KOREAN_DATA.lastNames)
  const firstName = faker.helpers.arrayElement(KOREAN_DATA.firstNames)
  return `${lastName}${firstName}`
}

function getRandomPhone(): string {
  return `010-${faker.number.int({ min: 1000, max: 9999 })}-${faker.number.int({ min: 1000, max: 9999 })}`
}

function getRandomAddress(): string {
  const district = faker.helpers.arrayElement(KOREAN_DATA.districts)
  const street = faker.number.int({ min: 1, max: 999 })
  const detail = faker.number.int({ min: 1, max: 100 })
  return `서울특별시 ${district} ${street}길 ${detail}`
}

async function seedComprehensiveData() {
  console.log('🚀 Starting comprehensive data seeding...\n')
  console.log('📊 Target data volume:')
  console.log(`   - Organizations: ${CONFIG.ORGANIZATIONS}`)
  console.log(`   - Sites: ${CONFIG.ORGANIZATIONS * CONFIG.SITES_PER_ORG}`)
  console.log(`   - Users: ${CONFIG.WORKERS + CONFIG.MANAGERS + CONFIG.ADMINS}`)
  console.log(`   - History: ${CONFIG.DAYS_OF_HISTORY} days`)
  console.log(`   - Total expected records: ~${(CONFIG.WORKERS + CONFIG.MANAGERS) * CONFIG.DAYS_OF_HISTORY} attendance records\n`)

  try {
    // Step 1: Create Organizations
    console.log('🏢 Creating organizations...')
    const organizations = []
    
    for (let i = 0; i < CONFIG.ORGANIZATIONS; i++) {
      const orgName = i < KOREAN_DATA.companies.length 
        ? KOREAN_DATA.companies[i] 
        : `${faker.helpers.arrayElement(KOREAN_DATA.companies)} ${i}팀`
      
      organizations.push({
        name: orgName,
        type: i === 0 ? 'partner' : 'customer',
        is_active: true,
        description: `${orgName} - 건설 ${i === 0 ? '협력사' : '원청사'}`
      })
    }

    const { data: orgsData, error: orgError } = await supabase
      .from('organizations')
      .upsert(organizations, { onConflict: 'name' })
      .select()

    if (orgError) throw orgError
    console.log(`✅ Created ${orgsData?.length || 0} organizations\n`)

    // Step 2: Create Sites with realistic data
    console.log('🏗️ Creating construction sites...')
    const sites = []
    const siteOrgs = orgsData || []
    
    for (const org of siteOrgs) {
      for (let i = 0; i < CONFIG.SITES_PER_ORG; i++) {
        const siteType = faker.helpers.arrayElement(KOREAN_DATA.siteTypes)
        const district = faker.helpers.arrayElement(KOREAN_DATA.districts)
        const siteName = `${district} ${siteType} ${i + 1}차`
        
        sites.push({
          name: siteName,
          code: `${district.substring(0, 2).toUpperCase()}-${Date.now()}-${i}`,
          address: getRandomAddress(),
          description: `${siteType} 신축공사`,
          status: faker.helpers.arrayElement(['active', 'active', 'active', 'completed']),
          start_date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
          end_date: faker.date.future({ years: 1 }).toISOString().split('T')[0],
          organization_id: org.id,
          construction_manager_phone: getRandomPhone(),
          safety_manager_phone: getRandomPhone(),
          accommodation_name: `${district} 숙소`,
          accommodation_address: getRandomAddress(),
          work_process: faker.helpers.arrayElement(KOREAN_DATA.workProcesses),
          work_section: `${faker.helpers.arrayElement(['지하', '지상'])} ${faker.number.int({ min: 1, max: 5 })}층`,
          component_name: faker.helpers.arrayElement(['A', 'B', 'C', 'D']) + ` 구역`,
          manager_name: getRandomKoreanName(),
          safety_manager_name: getRandomKoreanName()
        })
      }
    }

    const { data: sitesData, error: siteError } = await supabase
      .from('sites')
      .upsert(sites, { onConflict: 'code' })
      .select()

    if (siteError) throw siteError
    console.log(`✅ Created ${sitesData?.length || 0} sites\n`)

    // Step 3: Create Users (Profiles) using ConstructionDataGenerator
    console.log('👥 Creating user profiles using advanced data generation...')
    const profiles = []
    
    // Generate workers using ConstructionDataGenerator
    for (let i = 0; i < CONFIG.WORKERS; i++) {
      const workerProfile = dataGenerator.generateWorkerProfile()
      profiles.push({
        email: `worker${i + 1}@test.com`,
        full_name: workerProfile.name,
        role: 'worker',
        phone: workerProfile.phone,
        is_verified: true,
        organization_id: faker.helpers.arrayElement(siteOrgs)?.id
      })
    }
    
    // Generate managers using ConstructionDataGenerator
    for (let i = 0; i < CONFIG.MANAGERS; i++) {
      const managerProfile = dataGenerator.generateManagerProfile()
      profiles.push({
        email: `manager${i + 1}@test.com`,
        full_name: managerProfile.name,
        role: 'site_manager',
        phone: managerProfile.phone,
        is_verified: true,
        organization_id: faker.helpers.arrayElement(siteOrgs)?.id
      })
    }
    
    // Generate admins using ConstructionDataGenerator
    for (let i = 0; i < CONFIG.ADMINS; i++) {
      const adminProfile = dataGenerator.generateManagerProfile()
      profiles.push({
        email: `admin${i + 1}@test.com`,
        full_name: adminProfile.name,
        role: 'admin',
        phone: adminProfile.phone,
        is_verified: true,
        organization_id: siteOrgs[0]?.id
      })
    }

    // Insert profiles in batches to avoid conflicts
    const batchSize = 10
    let createdProfiles = 0
    
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('profiles')
        .upsert(batch, { onConflict: 'email' })
        .select()
      
      if (!error && data) {
        createdProfiles += data.length
      }
    }
    
    console.log(`✅ Created ${createdProfiles} user profiles\n`)

    // Step 4: Create Attendance Records using ConstructionDataGenerator
    console.log('📅 Creating attendance records using advanced patterns...')
    
    const { data: workers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'worker')
      .limit(CONFIG.WORKERS)

    const activeSites = sitesData?.filter(s => s.status === 'active') || []
    let attendanceRecords = []
    let totalAttendance = 0
    
    if (workers && workers.length > 0 && activeSites.length > 0) {
      for (const worker of workers) {
        // Assign worker to 1-2 sites
        const workerSites = faker.helpers.arrayElements(activeSites, { min: 1, max: 2 })
        
        for (let d = 0; d < CONFIG.DAYS_OF_HISTORY; d++) {
          const date = new Date()
          date.setDate(date.getDate() - d)
          const dateStr = date.toISOString().split('T')[0]
          
          // Use ConstructionDataGenerator for realistic attendance patterns
          const attendanceRecord = dataGenerator.generateAttendanceRecord(
            worker.id,
            faker.helpers.arrayElement(workerSites).id,
            dateStr,
            worker.full_name
          )
          
          // Skip weekend records based on realistic patterns
          const dayOfWeek = date.getDay()
          if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() < 0.7) {
            continue
          }
          
          // Random absence (5% chance)
          if (Math.random() < 0.05) {
            continue
          }
          
          attendanceRecords.push(attendanceRecord)
          
          // Insert in batches
          if (attendanceRecords.length >= 100) {
            const { error } = await supabase
              .from('attendance_records')
              .upsert(attendanceRecords, { onConflict: 'user_id,work_date' })
            
            if (!error) {
              totalAttendance += attendanceRecords.length
            }
            attendanceRecords = []
          }
        }
      }
      
      // Insert remaining records
      if (attendanceRecords.length > 0) {
        const { error } = await supabase
          .from('attendance_records')
          .upsert(attendanceRecords, { onConflict: 'user_id,work_date' })
        
        if (!error) {
          totalAttendance += attendanceRecords.length
        }
      }
    }
    
    console.log(`✅ Created ${totalAttendance} attendance records\n`)

    // Step 5: Create Daily Reports using ConstructionDataGenerator
    console.log('📝 Creating daily reports using advanced data generation...')
    
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['site_manager', 'admin'])

    let dailyReports = []
    let totalReports = 0
    
    if (managers && managers.length > 0 && activeSites.length > 0) {
      for (const site of activeSites) {
        const siteManager = faker.helpers.arrayElement(managers)
        
        for (let d = 0; d < CONFIG.DAILY_REPORTS_PER_SITE; d++) {
          const date = new Date()
          date.setDate(date.getDate() - d)
          const dateStr = date.toISOString().split('T')[0]
          
          // Skip weekends sometimes
          if ((date.getDay() === 0 || date.getDay() === 6) && Math.random() < 0.5) {
            continue
          }
          
          // Use ConstructionDataGenerator for realistic daily reports
          const dailyReportData = dataGenerator.generateDailyReport(
            site.id,
            dateStr,
            siteManager.id
          )
          
          dailyReports.push(dailyReportData)
          
          // Insert in batches
          if (dailyReports.length >= 50) {
            const { error } = await supabase
              .from('daily_reports')
              .upsert(dailyReports, { onConflict: 'site_id,work_date' })
            
            if (!error) {
              totalReports += dailyReports.length
            }
            dailyReports = []
          }
        }
      }
      
      // Insert remaining reports
      if (dailyReports.length > 0) {
        const { error } = await supabase
          .from('daily_reports')
          .upsert(dailyReports, { onConflict: 'site_id,work_date' })
        
        if (!error) {
          totalReports += dailyReports.length
        }
      }
    }
    
    console.log(`✅ Created ${totalReports} daily reports\n`)

    // Step 6: Create Materials and Inventory using MaterialWorkflowManager
    console.log('📦 Creating materials and inventory using advanced workflow management...')
    
    // Generate materials using MaterialWorkflowManager
    const materials = []
    for (let i = 0; i < KOREAN_DATA.materials.length; i++) {
      const materialData = materialWorkflow.generateMaterial(
        KOREAN_DATA.materials[i],
        `MAT-${String(i + 1).padStart(4, '0')}`
      )
      materials.push(materialData)
    }

    const { data: materialsData, error: matError } = await supabase
      .from('materials')
      .upsert(materials, { onConflict: 'code' })
      .select()

    if (matError) {
      console.log('Materials table might not exist, skipping...')
    } else {
      console.log(`✅ Created ${materialsData?.length || 0} materials`)
      
      // Create inventory for each site using MaterialWorkflowManager
      if (materialsData && activeSites.length > 0) {
        const inventory = []
        
        for (const site of activeSites) {
          for (const material of materialsData.slice(0, 15)) {
            const inventoryData = materialWorkflow.generateInventoryRecord(
              site.id,
              material.id,
              material.min_stock,
              material.max_stock
            )
            inventory.push(inventoryData)
          }
        }
        
        const { error: invError } = await supabase
          .from('material_inventory')
          .upsert(inventory, { onConflict: 'site_id,material_id' })
        
        if (!invError) {
          console.log(`✅ Created ${inventory.length} inventory records`)
        }
      }
    }
    
    // Step 6.1: Create Material Workflow Requests using MaterialWorkflowManager
    console.log('📋 Creating material workflow requests...')
    
    if (materialsData && activeSites.length > 0 && managers && managers.length > 0) {
      const materialRequests = []
      const requestCount = 50 // Generate 50 material requests
      
      for (let i = 0; i < requestCount; i++) {
        const site = faker.helpers.arrayElement(activeSites)
        const material = faker.helpers.arrayElement(materialsData.slice(0, 10))
        const requester = faker.helpers.arrayElement(managers)
        
        const requestData = materialWorkflow.createMaterialRequest(
          site.id,
          material.id,
          requester.id,
          faker.number.int({ min: 10, max: 100 })
        )
        
        materialRequests.push(requestData)
      }
      
      const { data: requestsData, error: reqError } = await supabase
        .from('material_requests')
        .insert(materialRequests)
        .select()
      
      if (reqError) {
        console.log('Material requests table might not exist, skipping...')
      } else {
        console.log(`✅ Created ${requestsData?.length || 0} material requests`)
        
        // Process some requests through the approval workflow
        if (requestsData && requestsData.length > 0) {
          const processedRequests = []
          const samplesToProcess = Math.min(20, requestsData.length)
          
          for (let i = 0; i < samplesToProcess; i++) {
            const request = requestsData[i]
            const approver = faker.helpers.arrayElement(managers)
            
            const approval = materialWorkflow.processApproval(
              request.id,
              approver.id,
              faker.helpers.weightedArrayElement([
                { value: 'approved', weight: 70 },
                { value: 'rejected', weight: 20 },
                { value: 'pending', weight: 10 }
              ]).value
            )
            
            processedRequests.push(approval)
          }
          
          const { error: approvalError } = await supabase
            .from('material_request_approvals')
            .insert(processedRequests)
          
          if (!approvalError) {
            console.log(`✅ Created ${processedRequests.length} approval records`)
          }
        }
      }
    }
    
    console.log()

    // Step 7: Create Payroll Records using PayrollCalculator
    console.log('💰 Creating payroll records using advanced calculation system...')
    
    if (workers && workers.length > 0 && totalAttendance > 0) {
      const payrollRecords = []
      const payPeriods = [] // Track unique pay periods
      
      // Generate monthly payroll records for the last 3 months
      for (let monthsBack = 0; monthsBack < 3; monthsBack++) {
        const payPeriodDate = new Date()
        payPeriodDate.setMonth(payPeriodDate.getMonth() - monthsBack)
        payPeriodDate.setDate(25) // Pay day is 25th of each month
        const payPeriodStr = payPeriodDate.toISOString().split('T')[0]
        
        // Track this pay period
        const payPeriod = {
          period_start: new Date(payPeriodDate.getFullYear(), payPeriodDate.getMonth(), 1).toISOString().split('T')[0],
          period_end: new Date(payPeriodDate.getFullYear(), payPeriodDate.getMonth() + 1, 0).toISOString().split('T')[0],
          pay_date: payPeriodStr,
          status: monthsBack === 0 ? 'pending' : 'paid'
        }
        payPeriods.push(payPeriod)
        
        // Generate payroll records for each worker
        for (const worker of workers) {
          // Get worker's attendance for this month
          const { data: workerAttendance } = await supabase
            .from('attendance_records')
            .select('work_date, work_hours, overtime_hours, labor_hours')
            .eq('user_id', worker.id)
            .gte('work_date', payPeriod.period_start)
            .lte('work_date', payPeriod.period_end)
          
          if (workerAttendance && workerAttendance.length > 0) {
            // Calculate total hours for the month
            const totalWorkHours = workerAttendance.reduce((sum, record) => 
              sum + (record.work_hours || 0), 0)
            const totalOvertimeHours = workerAttendance.reduce((sum, record) => 
              sum + (record.overtime_hours || 0), 0)
            const totalLaborHours = workerAttendance.reduce((sum, record) => 
              sum + (record.labor_hours || 0), 0)
            
            // Use PayrollCalculator to generate realistic payroll data
            const payrollData = payrollCalculator.calculateMonthlyPayroll({
              workerId: worker.id,
              workerName: worker.full_name,
              totalWorkHours,
              totalOvertimeHours,
              totalLaborHours,
              workDays: workerAttendance.length,
              payPeriod: payPeriod.period_start,
              baseSalary: faker.number.int({ min: 2800000, max: 4200000 }), // 280만~420만원
              overtimeRate: 1.5
            })
            
            payrollRecords.push({
              worker_id: worker.id,
              worker_name: worker.full_name,
              pay_period_start: payPeriod.period_start,
              pay_period_end: payPeriod.period_end,
              pay_date: payPeriod.pay_date,
              base_salary: payrollData.baseSalary,
              work_days: payrollData.workDays,
              work_hours: payrollData.totalWorkHours,
              overtime_hours: payrollData.totalOvertimeHours,
              labor_hours: payrollData.totalLaborHours,
              regular_pay: payrollData.regularPay,
              overtime_pay: payrollData.overtimePay,
              total_gross_pay: payrollData.totalGrossPay,
              income_tax: payrollData.deductions.incomeTax,
              national_pension: payrollData.deductions.nationalPension,
              health_insurance: payrollData.deductions.healthInsurance,
              employment_insurance: payrollData.deductions.employmentInsurance,
              total_deductions: payrollData.totalDeductions,
              net_pay: payrollData.netPay,
              payment_method: faker.helpers.arrayElement(['bank_transfer', 'cash']),
              bank_account: payrollData.bankAccount,
              payment_status: payPeriod.status,
              bonus: payrollData.bonus || 0,
              allowances: payrollData.allowances || 0,
              notes: payrollData.notes || '정상 급여 지급'
            })
          }
        }
      }
      
      // Insert payroll records in batches
      if (payrollRecords.length > 0) {
        const batchSize = 50
        let totalPayrollRecords = 0
        
        for (let i = 0; i < payrollRecords.length; i += batchSize) {
          const batch = payrollRecords.slice(i, i + batchSize)
          const { data, error } = await supabase
            .from('payroll_records')
            .upsert(batch, { onConflict: 'worker_id,pay_period_start' })
            .select()
          
          if (error) {
            console.log('Payroll table might not exist, skipping payroll records...')
            break
          } else if (data) {
            totalPayrollRecords += data.length
          }
        }
        
        if (totalPayrollRecords > 0) {
          console.log(`✅ Created ${totalPayrollRecords} payroll records`)
          
          // Also create summary statistics
          const payrollStats = payrollCalculator.generatePayrollSummary(payrollRecords)
          console.log(`   💵 Total monthly payroll: ${payrollStats.totalMonthlyPayroll.toLocaleString()}원`)
          console.log(`   📊 Average worker salary: ${payrollStats.averageWorkerSalary.toLocaleString()}원`)
          console.log(`   ⏰ Total labor hours: ${payrollStats.totalLaborHours.toFixed(1)} 공수`)
        }
      }
    }
    
    console.log()

    // Step 8: Create Documents
    console.log('📄 Creating documents...')
    
    const documentTypes = [
      '작업지시서', '안전관리계획서', '품질시험성적서', '준공도서',
      '시공계획서', '구조계산서', '환경관리계획서', '계약서',
      '도면', '사양서', '견적서', '공정표'
    ]
    
    const documents = []
    for (const site of activeSites || []) {
      for (let i = 0; i < CONFIG.DOCUMENTS_PER_SITE; i++) {
        const docType = faker.helpers.arrayElement(documentTypes)
        documents.push({
          title: `${site.name} ${docType}`,
          type: docType,
          file_url: `https://example.com/documents/${faker.string.uuid()}.pdf`,
          file_size: faker.number.int({ min: 100000, max: 10000000 }),
          uploaded_by: faker.helpers.arrayElement(managers || [])?.id,
          site_id: site.id,
          description: `${site.name}의 ${docType} 문서입니다.`,
          status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
          version: `v${faker.number.int({ min: 1, max: 5 })}.0`
        })
      }
    }
    
    const { data: docsData, error: docError } = await supabase
      .from('documents')
      .upsert(documents, { onConflict: 'title,site_id' })
      .select()
    
    if (!docError) {
      console.log(`✅ Created ${docsData?.length || 0} documents\n`)
    }

    // Step 8: Create Notifications
    console.log('🔔 Creating notifications...')
    
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, role')

    const notifications = []
    const notificationTemplates = [
      { title: '작업 일지 승인 요청', message: '오늘의 작업 일지를 검토해 주세요.', type: 'info' },
      { title: '안전 점검 알림', message: '월간 안전 점검 일정입니다.', type: 'warning' },
      { title: '자재 부족 경고', message: '철근 재고가 최소 수량 이하입니다.', type: 'error' },
      { title: '일정 변경 안내', message: '내일 작업 일정이 변경되었습니다.', type: 'info' },
      { title: '교육 일정 안내', message: '안전 교육이 예정되어 있습니다.', type: 'success' },
      { title: '급여 명세서', message: '이번 달 급여 명세서가 발행되었습니다.', type: 'info' },
      { title: '휴가 승인', message: '신청하신 휴가가 승인되었습니다.', type: 'success' }
    ]
    
    if (allProfiles) {
      for (const profile of allProfiles) {
        const numNotifications = faker.number.int({ min: 5, max: CONFIG.NOTIFICATIONS_PER_USER })
        
        for (let i = 0; i < numNotifications; i++) {
          const template = faker.helpers.arrayElement(notificationTemplates)
          const daysAgo = faker.number.int({ min: 0, max: 30 })
          const createdAt = new Date()
          createdAt.setDate(createdAt.getDate() - daysAgo)
          
          notifications.push({
            profile_id: profile.id,
            title: template.title,
            message: template.message,
            type: template.type,
            is_read: Math.random() < 0.7, // 70% read
            created_at: createdAt.toISOString()
          })
        }
      }
      
      // Insert in batches
      const batchSize = 100
      let totalNotifications = 0
      
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        const { data, error } = await supabase
          .from('notifications')
          .insert(batch)
          .select()
        
        if (!error && data) {
          totalNotifications += data.length
        }
      }
      
      console.log(`✅ Created ${totalNotifications} notifications\n`)
    }

    // Step 9: Create Equipment Records
    console.log('🚜 Creating equipment records...')
    
    const equipment = KOREAN_DATA.equipment.map((name, index) => ({
      name: name,
      code: `EQP-${String(index + 1).padStart(4, '0')}`,
      category: name.split(' ')[0],
      status: faker.helpers.weightedArrayElement([
        { value: 'available', weight: 50 },
        { value: 'in_use', weight: 30 },
        { value: 'maintenance', weight: 15 },
        { value: 'broken', weight: 5 }
      ]).value,
      location: faker.helpers.arrayElement(activeSites || [])?.id,
      purchase_date: faker.date.past({ years: 3 }).toISOString().split('T')[0],
      last_maintenance: faker.date.recent({ days: 90 }).toISOString().split('T')[0],
      next_maintenance: faker.date.future({ years: 0.5 }).toISOString().split('T')[0],
      specifications: {
        manufacturer: faker.helpers.arrayElement(['현대', '두산', '볼보', '코마츠', '대우']),
        model: `Model-${faker.number.int({ min: 100, max: 999 })}`,
        year: faker.number.int({ min: 2018, max: 2024 })
      }
    }))

    const { data: equipmentData, error: eqError } = await supabase
      .from('equipment')
      .upsert(equipment, { onConflict: 'code' })
      .select()

    if (eqError) {
      console.log('Equipment table might not exist, skipping...')
    } else {
      console.log(`✅ Created ${equipmentData?.length || 0} equipment records\n`)
    }

    // Final Summary
    console.log('🎉 Data seeding completed successfully!\n')
    console.log('📊 Final Summary:')
    console.log(`   ✅ Organizations: ${orgsData?.length || 0}`)
    console.log(`   ✅ Sites: ${sitesData?.length || 0}`)
    console.log(`   ✅ User Profiles: ${createdProfiles}`)
    console.log(`   ✅ Attendance Records: ${totalAttendance}`)
    console.log(`   ✅ Daily Reports: ${totalReports}`)
    console.log(`   ✅ Materials: ${materialsData?.length || 0}`)
    console.log(`   ✅ Documents: ${docsData?.length || 0}`)
    console.log(`   ✅ Notifications: ${notifications.length}`)
    console.log(`   ✅ Equipment: ${equipmentData?.length || 0}`)
    
    console.log('\n✨ Your database now contains comprehensive test data!')
    console.log('📝 Test with various scenarios:')
    console.log('   - Multiple organizations and sites')
    console.log('   - Realistic attendance patterns')
    console.log('   - Various user roles and permissions')
    console.log('   - Edge cases (absences, overtime, weekends)')
    console.log('   - Historical data for analytics')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

// Run the seed function
seedComprehensiveData()