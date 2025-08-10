#!/usr/bin/env tsx
/**
 * Complete seed data script for testing
 * This replaces all hardcoded test data with proper database entries
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedCompleteData() {
  console.log('🚀 Starting complete data seeding...\n')

  try {
    // Step 1: Create Organizations
    console.log('📦 Creating organizations...')
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert([
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: '이노피앤씨',
          type: 'partner',
          is_active: true
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: '삼성건설',
          type: 'customer',
          is_active: true
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: '현대건설',
          type: 'customer',
          is_active: true
        }
      ])

    if (orgError) throw orgError
    console.log('✅ Organizations created\n')

    // Step 2: Create Sites (replacing hardcoded ones)
    console.log('🏗️ Creating construction sites...')
    const sitesData = [
      {
        name: '강남 A현장',
        code: 'GN-A-2024',
        address: '서울시 강남구 테헤란로 123',
        description: '주상복합 건설',
        status: 'active',
        start_date: '2024-01-15',
        end_date: '2025-12-31',
        organization_id: '22222222-2222-2222-2222-222222222222',
        construction_manager_phone: '010-1234-5678',
        safety_manager_phone: '010-8765-4321',
        accommodation_name: '강남 기숙사',
        accommodation_address: '서울시 강남구 역삼동 456',
        work_process: '슬라브 타설',
        work_section: '지하 1층',
        component_name: '기둥 C1-C5 구간',
        manager_name: '김건축',
        safety_manager_name: '이안전'
      },
      {
        name: '송파 B현장',
        code: 'SP-B-2024',
        address: '서울시 송파구 올림픽로 789',
        description: '아파트 리모델링',
        status: 'active',
        start_date: '2024-03-01',
        end_date: '2025-08-31',
        organization_id: '22222222-2222-2222-2222-222222222222',
        construction_manager_phone: '010-2345-6789',
        safety_manager_phone: '010-9876-5432',
        accommodation_name: '송파 숙소',
        accommodation_address: '서울시 송파구 방이동 321',
        work_process: '철근 배근',
        work_section: '지상 3층',
        component_name: '보 B1-B10 구간',
        manager_name: '박현장',
        safety_manager_name: '김안전'
      },
      {
        name: '송파 C현장',
        code: 'SP-C-2024',
        address: '서울시 송파구 문정동 543',
        description: '오피스텔 신축',
        status: 'active',
        start_date: '2024-02-15',
        end_date: '2025-10-31',
        organization_id: '33333333-3333-3333-3333-333333333333',
        construction_manager_phone: '010-3456-7890',
        safety_manager_phone: '010-0987-6543',
        accommodation_name: '문정 게스트하우스',
        accommodation_address: '서울시 송파구 문정동 654',
        work_process: '거푸집 설치',
        work_section: '지상 1층',
        component_name: '슬라브 S1 구역',
        manager_name: '이관리',
        safety_manager_name: '박안전'
      },
      {
        name: '방배 D현장',
        code: 'BB-D-2024',
        address: '서울시 서초구 방배동 876',
        description: '단독주택 신축',
        status: 'active',
        start_date: '2024-04-01',
        end_date: '2025-06-30',
        organization_id: '33333333-3333-3333-3333-333333333333',
        construction_manager_phone: '010-4567-8901',
        safety_manager_phone: '010-1098-7654',
        accommodation_name: '방배 원룸',
        accommodation_address: '서울시 서초구 방배동 987',
        work_process: '콘크리트 양생',
        work_section: '지하 2층',
        component_name: '벽체 W1-W5 구간',
        manager_name: '최담당',
        safety_manager_name: '정안전'
      }
    ]

    const { data: sites, error: siteError } = await supabase
      .from('sites')
      .upsert(sitesData, { onConflict: 'name' })
      .select()

    if (siteError) throw siteError
    console.log(`✅ Created ${sites?.length || 0} sites\n`)

    // Step 3: Create test users with proper profiles
    console.log('👤 Creating test users...')
    
    // Get existing users first
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('email')
    
    const existingEmails = existingProfiles?.map(p => p.email) || []
    
    const testUsers = [
      { email: 'worker1@test.com', name: '김작업', role: 'worker' },
      { email: 'worker2@test.com', name: '이작업', role: 'worker' },
      { email: 'worker3@test.com', name: '박작업', role: 'worker' },
      { email: 'manager1@test.com', name: '김건축', role: 'site_manager' },
      { email: 'manager2@test.com', name: '박현장', role: 'site_manager' },
      { email: 'manager3@test.com', name: '이관리', role: 'site_manager' }
    ]

    for (const user of testUsers) {
      if (!existingEmails.includes(user.email)) {
        console.log(`  Creating user: ${user.email}`)
        // Note: In production, users should be created through auth.users
        // This is just for profile records
        const { error } = await supabase
          .from('profiles')
          .insert({
            email: user.email,
            full_name: user.name,
            role: user.role,
            is_verified: true
          })
        
        if (error && !error.message.includes('duplicate')) {
          console.log(`  ⚠️ Warning: ${error.message}`)
        }
      }
    }
    console.log('✅ Test users created\n')

    // Step 4: Create attendance records with labor hours (공수)
    console.log('📅 Creating attendance records...')
    
    const { data: workers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'worker')
      .limit(3)

    if (workers && workers.length > 0 && sites && sites.length > 0) {
      const attendanceRecords = []
      const today = new Date()
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        for (const worker of workers) {
          // Randomly assign to a site
          const site = sites[Math.floor(Math.random() * sites.length)]
          
          // Generate realistic labor hours
          const laborHours = [0.25, 0.5, 0.75, 1.0, 1.25][Math.floor(Math.random() * 5)]
          const hoursWorked = laborHours * 8
          
          attendanceRecords.push({
            profile_id: worker.id,
            site_id: site.id,
            work_date: dateStr,
            check_in_time: '08:00:00',
            check_out_time: `${8 + hoursWorked}:00:00`,
            status: laborHours >= 1 ? 'present' : 'half_day',
            labor_hours: laborHours,
            notes: `${site.name} 작업`
          })
        }
      }

      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .upsert(attendanceRecords, { onConflict: 'profile_id,work_date' })

      if (attendanceError) throw attendanceError
      console.log(`✅ Created ${attendanceRecords.length} attendance records\n`)
    }

    // Step 5: Create daily reports
    console.log('📝 Creating daily reports...')
    
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'site_manager')
      .limit(3)

    if (managers && managers.length > 0 && sites && sites.length > 0) {
      const reports = []
      const today = new Date()
      
      for (let i = 0; i < 10; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        for (const site of sites.slice(0, 2)) { // Create for first 2 sites
          const manager = managers[Math.floor(Math.random() * managers.length)]
          
          reports.push({
            site_id: site.id,
            work_date: dateStr,
            created_by: manager.id,
            weather: ['맑음', '흐림', '비', '눈'][Math.floor(Math.random() * 4)],
            temperature: Math.floor(Math.random() * 20) + 10,
            worker_count: Math.floor(Math.random() * 20) + 5,
            work_content: `${site.work_process} 작업 진행`,
            safety_matters: '안전 수칙 준수',
            equipment_used: '크레인, 굴착기',
            materials_used: '철근, 콘크리트',
            issues: null,
            tomorrow_plan: '작업 계속 진행',
            status: 'approved'
          })
        }
      }

      const { error: reportError } = await supabase
        .from('daily_reports')
        .upsert(reports, { onConflict: 'site_id,work_date' })

      if (reportError) throw reportError
      console.log(`✅ Created ${reports.length} daily reports\n`)
    }

    // Step 6: Create notifications
    console.log('🔔 Creating notifications...')
    
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id')

    if (allProfiles && allProfiles.length > 0) {
      const notifications = []
      
      for (const profile of allProfiles.slice(0, 5)) {
        notifications.push({
          profile_id: profile.id,
          title: '작업 일지 승인 요청',
          message: '오늘의 작업 일지를 검토해 주세요.',
          type: 'info',
          is_read: Math.random() > 0.5
        })
      }

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifError) throw notifError
      console.log(`✅ Created ${notifications.length} notifications\n`)
    }

    console.log('🎉 All seed data created successfully!')
    console.log('\n📊 Summary:')
    console.log('- Organizations: 3')
    console.log('- Sites: 4 (강남 A, 송파 B, 송파 C, 방배 D)')
    console.log('- Test users: 6')
    console.log('- Attendance records: ~90')
    console.log('- Daily reports: ~20')
    console.log('- Notifications: ~5')
    
    console.log('\n✨ You can now test with real database data!')
    console.log('No more hardcoded test data needed.')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

// Run the seed function
seedCompleteData()