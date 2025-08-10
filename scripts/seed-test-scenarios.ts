#!/usr/bin/env tsx
/**
 * Test scenario data for edge cases and specific testing needs
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestScenarios() {
  console.log('🧪 Creating test scenarios for edge cases...\n')

  try {
    // Scenario 1: Worker with perfect attendance
    console.log('📍 Scenario 1: Perfect attendance worker')
    const { data: perfectWorker } = await supabase
      .from('profiles')
      .upsert({
        email: 'perfect.worker@test.com',
        full_name: '김완벽',
        role: 'worker',
        phone: '010-1111-1111',
        is_verified: true
      }, { onConflict: 'email' })
      .select()
      .single()

    if (perfectWorker) {
      const { data: site } = await supabase
        .from('sites')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single()

      if (site) {
        const attendance = []
        for (let i = 0; i < 30; i++) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          if (date.getDay() !== 0 && date.getDay() !== 6) {
            attendance.push({
              profile_id: perfectWorker.id,
              site_id: site.id,
              work_date: date.toISOString().split('T')[0],
              check_in_time: '08:00:00',
              check_out_time: '17:00:00',
              status: 'present',
              labor_hours: 1.0,
              notes: '정상 근무'
            })
          }
        }
        await supabase.from('attendance_records').upsert(attendance, { onConflict: 'profile_id,work_date' })
      }
    }
    console.log('✅ Perfect attendance worker created\n')

    // Scenario 2: Worker with irregular hours
    console.log('📍 Scenario 2: Irregular hours worker')
    const { data: irregularWorker } = await supabase
      .from('profiles')
      .upsert({
        email: 'irregular.worker@test.com',
        full_name: '박불규칙',
        role: 'worker',
        phone: '010-2222-2222',
        is_verified: true
      }, { onConflict: 'email' })
      .select()
      .single()

    if (irregularWorker) {
      const { data: sites } = await supabase
        .from('sites')
        .select('id')
        .eq('status', 'active')
        .limit(3)

      if (sites && sites.length > 0) {
        const attendance = []
        const laborHoursPattern = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 0, 0.5, 1.0, 1.5]
        
        for (let i = 0; i < 30; i++) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const laborHours = laborHoursPattern[i % laborHoursPattern.length]
          
          if (laborHours > 0) {
            attendance.push({
              profile_id: irregularWorker.id,
              site_id: sites[i % sites.length].id,
              work_date: date.toISOString().split('T')[0],
              check_in_time: '08:00:00',
              check_out_time: `${8 + laborHours * 8}:00:00`,
              status: laborHours >= 1 ? 'present' : 'half_day',
              labor_hours: laborHours,
              notes: laborHours > 1 ? '야근' : laborHours < 1 ? '조퇴' : '정상'
            })
          }
        }
        await supabase.from('attendance_records').upsert(attendance, { onConflict: 'profile_id,work_date' })
      }
    }
    console.log('✅ Irregular hours worker created\n')

    // Scenario 3: Site with weather issues
    console.log('📍 Scenario 3: Site with weather delays')
    const { data: weatherSite } = await supabase
      .from('sites')
      .upsert({
        name: '우천지연 현장',
        code: 'RAIN-TEST-001',
        address: '서울시 강남구 우천로 123',
        description: '우천으로 자주 지연되는 현장',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2025-12-31',
        work_process: '외부 마감공사',
        manager_name: '김우천'
      }, { onConflict: 'code' })
      .select()
      .single()

    if (weatherSite) {
      const { data: manager } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'site_manager')
        .limit(1)
        .single()

      if (manager) {
        const reports = []
        for (let i = 0; i < 20; i++) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const isRainy = i % 3 === 0
          
          reports.push({
            site_id: weatherSite.id,
            work_date: date.toISOString().split('T')[0],
            created_by: manager.id,
            weather: isRainy ? '비' : '맑음',
            temperature: 20,
            humidity: isRainy ? 85 : 60,
            worker_count: isRainy ? 5 : 25,
            work_content: isRainy ? '우천으로 실내 작업만 진행' : '정상 작업 진행',
            safety_matters: isRainy ? '미끄럼 주의, 우비 착용 필수' : '안전모 착용',
            issues: isRainy ? '우천으로 외부 작업 중단' : null,
            tomorrow_plan: '날씨에 따라 작업 조정',
            status: 'approved'
          })
        }
        await supabase.from('daily_reports').upsert(reports, { onConflict: 'site_id,work_date' })
      }
    }
    console.log('✅ Weather-affected site created\n')

    // Scenario 4: Multiple role user (for permission testing)
    console.log('📍 Scenario 4: Multi-role test users')
    const roles = ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
    
    for (const role of roles) {
      await supabase
        .from('profiles')
        .upsert({
          email: `test.${role}@test.com`,
          full_name: `테스트 ${role}`,
          role: role,
          phone: `010-${role === 'worker' ? '1111' : role === 'site_manager' ? '2222' : '3333'}-0000`,
          is_verified: true
        }, { onConflict: 'email' })
    }
    console.log('✅ Multi-role test users created\n')

    // Scenario 5: Site with critical materials shortage
    console.log('📍 Scenario 5: Material shortage scenario')
    const { data: shortageSite } = await supabase
      .from('sites')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single()

    if (shortageSite) {
      // Create critical materials with low inventory
      const criticalMaterials = [
        { name: '철근 SD400 D25 (부족)', code: 'CRIT-001', category: '철근', unit: 'TON', min_stock: 100 },
        { name: '레미콘 30-27-150 (긴급)', code: 'CRIT-002', category: '레미콘', unit: 'M3', min_stock: 50 },
        { name: '시멘트 특수 (품절)', code: 'CRIT-003', category: '시멘트', unit: 'BAG', min_stock: 200 }
      ]

      const { data: materials } = await supabase
        .from('materials')
        .upsert(criticalMaterials, { onConflict: 'code' })
        .select()

      if (materials) {
        const inventory = materials.map(mat => ({
          site_id: shortageSite.id,
          material_id: mat.id,
          quantity: 5, // Very low quantity
          reserved_quantity: 3,
          location: '긴급 창고',
          last_updated: new Date().toISOString()
        }))

        await supabase
          .from('material_inventory')
          .upsert(inventory, { onConflict: 'site_id,material_id' })
      }

      // Create urgent notifications
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['site_manager', 'admin'])
        .limit(5)

      if (managers) {
        const notifications = managers.map(m => ({
          profile_id: m.id,
          title: '🚨 긴급: 자재 부족',
          message: '철근 재고가 최소 수량 이하입니다. 즉시 발주가 필요합니다.',
          type: 'error',
          is_read: false
        }))

        await supabase.from('notifications').insert(notifications)
      }
    }
    console.log('✅ Material shortage scenario created\n')

    // Scenario 6: Completed project with full history
    console.log('📍 Scenario 6: Completed project with history')
    const { data: completedSite } = await supabase
      .from('sites')
      .upsert({
        name: '완료된 프로젝트',
        code: 'COMPLETED-001',
        address: '서울시 서초구 완료로 999',
        description: '성공적으로 완료된 프로젝트',
        status: 'completed',
        start_date: '2023-01-01',
        end_date: '2024-06-30',
        work_process: '준공 완료',
        manager_name: '김성공'
      }, { onConflict: 'code' })
      .select()
      .single()

    if (completedSite) {
      // Create completion documents
      const { data: uploader } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()

      if (uploader) {
        const completionDocs = [
          { title: '준공 검사 확인서', type: '준공서류', status: 'approved' },
          { title: '최종 품질 시험 성적서', type: '품질서류', status: 'approved' },
          { title: '준공 도면', type: '도면', status: 'approved' },
          { title: '하자 보수 계획서', type: '유지보수', status: 'approved' }
        ]

        const documents = completionDocs.map(doc => ({
          ...doc,
          file_url: `https://example.com/completed/${doc.type}.pdf`,
          file_size: 5000000,
          uploaded_by: uploader.id,
          site_id: completedSite.id,
          description: `${completedSite.name} ${doc.title}`,
          version: 'FINAL'
        }))

        await supabase.from('documents').upsert(documents, { onConflict: 'title,site_id' })
      }
    }
    console.log('✅ Completed project created\n')

    // Scenario 7: High overtime site (for payroll testing)
    console.log('📍 Scenario 7: High overtime site')
    const { data: overtimeWorker } = await supabase
      .from('profiles')
      .upsert({
        email: 'overtime.king@test.com',
        full_name: '최야근',
        role: 'worker',
        phone: '010-9999-9999',
        is_verified: true
      }, { onConflict: 'email' })
      .select()
      .single()

    if (overtimeWorker) {
      const { data: site } = await supabase
        .from('sites')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single()

      if (site) {
        const attendance = []
        for (let i = 0; i < 30; i++) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          if (date.getDay() !== 0) { // Work even on Saturdays
            attendance.push({
              profile_id: overtimeWorker.id,
              site_id: site.id,
              work_date: date.toISOString().split('T')[0],
              check_in_time: '07:00:00',
              check_out_time: '22:00:00',
              status: 'present',
              labor_hours: 1.875, // 15 hours = 1.875 공수
              notes: '긴급 공사 야근'
            })
          }
        }
        await supabase.from('attendance_records').upsert(attendance, { onConflict: 'profile_id,work_date' })
      }
    }
    console.log('✅ High overtime worker created\n')

    console.log('🎯 All test scenarios created successfully!')
    console.log('\n📋 Test Scenarios Available:')
    console.log('   1. Perfect attendance: perfect.worker@test.com')
    console.log('   2. Irregular hours: irregular.worker@test.com')
    console.log('   3. Weather-affected site: 우천지연 현장')
    console.log('   4. Role testing: test.{role}@test.com')
    console.log('   5. Material shortage alerts')
    console.log('   6. Completed project: 완료된 프로젝트')
    console.log('   7. High overtime: overtime.king@test.com')
    console.log('\n✨ Use these scenarios to test edge cases and specific features!')

  } catch (error) {
    console.error('❌ Error creating test scenarios:', error)
    process.exit(1)
  }
}

// Run the function
seedTestScenarios()