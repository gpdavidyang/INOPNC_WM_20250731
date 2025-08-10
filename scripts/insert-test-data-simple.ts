#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Supabase 연결 설정
const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function insertTestData() {
  try {
    console.log('🚀 테스트 데이터 삽입을 시작합니다...')

    // 1. 기존 조직 정보 사용
    const organizationId = '1bf6a752-29a5-4f0f-a191-7aa39ac1f18c'  // 기존 INOPNC 본사 ID

    // 2. 현장 정보 삽입
    console.log('🏗️ 현장 정보 삽입 중...')
    const sites = [
      {
        id: '00000000-0000-0000-0000-000000000101',
        name: '강남 A현장',
        address: '서울시 강남구 테헤란로 456',
        description: '강남구 고급 주상복합 건설 프로젝트',
        start_date: '2024-12-01',
        end_date: '2025-08-31',
        status: 'active',
        organization_id: organizationId,
        manager_name: '김현장',
        construction_manager_phone: '010-1234-5678',
        safety_manager_name: '이안전',
        safety_manager_phone: '010-2345-6789',
        accommodation_name: '현장 내 컨테이너 숙소',
        accommodation_address: '현장 내 컨테이너 숙소 10실',
        work_process: '콘크리트 타설',
        work_section: '지하 1층',
        component_name: '벽체 A1-A5 구간'
      },
      {
        id: '00000000-0000-0000-0000-000000000102',
        name: '송파 B현장',
        address: '서울시 송파구 올림픽로 789',
        description: '송파구 아파트 단지 리모델링 프로젝트',
        start_date: '2024-11-15',
        end_date: '2025-06-30',
        status: 'active',
        organization_id: organizationId,
        manager_name: '박현장',
        construction_manager_phone: '010-3456-7890',
        safety_manager_name: '정안전',
        safety_manager_phone: '010-4567-8901',
        accommodation_name: '인근 원룸',
        accommodation_address: '인근 원룸 제공 (월세 지원)',
        work_process: '리모델링',
        work_section: '1-3층',
        component_name: '내부 마감재 교체'
      },
      {
        id: '00000000-0000-0000-0000-000000000103',
        name: '서초 C현장',
        address: '서울시 서초구 반포대로 321',
        description: '서초구 오피스텔 신축 공사',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        status: 'active',
        organization_id: organizationId,
        manager_name: '최현장',
        construction_manager_phone: '010-5678-9012',
        safety_manager_name: '한안전',
        safety_manager_phone: '010-6789-0123',
        accommodation_name: '현장 사무실 휴게실',
        accommodation_address: '현장 사무실 내 휴게실 운영',
        work_process: '철골 공사',
        work_section: '지상 1-15층',
        component_name: '기둥 C1-C20 구간'
      },
      {
        id: '00000000-0000-0000-0000-000000000104',
        name: '방배 D현장',
        address: '서울시 서초구 방배로 159',
        description: '방배동 단독주택 신축 공사',
        start_date: '2024-10-01',
        end_date: '2025-04-30',
        status: 'active',
        organization_id: organizationId,
        manager_name: '윤현장',
        construction_manager_phone: '010-7890-1234',
        safety_manager_name: '장안전',
        safety_manager_phone: '010-8901-2345',
        accommodation_name: '인근 고시원',
        accommodation_address: '인근 고시원 연계 (교통비 지원)',
        work_process: '기초 공사',
        work_section: '지하 1층',
        component_name: '기초 파일 P1-P10'
      }
    ]

    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .upsert(sites)
      .select()
      
    if (siteError) throw siteError
    console.log('✅ 현장 정보 삽입 완료:', siteData?.length, '개 현장')

    // 3. 기존 프로필 사용 (새 프로필은 Supabase Auth를 통해서만 생성 가능)
    console.log('👷 기존 작업자 프로필 확인 중...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10)
      
    if (profileError) throw profileError
    
    const profiles = profileData || []
    console.log('✅ 기존 작업자 프로필 확인 완료:', profiles.length, '명')
    
    // 만약 프로필이 없다면 기본 admin 프로필을 사용
    if (profiles.length === 0) {
      console.log('⚠️ 프로필이 없습니다. 기존 admin 프로필을 사용합니다.')
      profiles.push({
        id: 'b9341ed7-79fc-413d-a0fe-6e7fc7889f5f',
        full_name: 'Admin User',
        role: 'admin'
      })
    }

    // 4. 작업일지 삽입
    console.log('📝 작업일지 삽입 중...')
    const dailyReports = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const reportDate = new Date(today)
      reportDate.setDate(today.getDate() - i)
      
      // 주말 제외
      if (reportDate.getDay() === 0 || reportDate.getDay() === 6) continue
      
      for (const site of sites) {
        const processTypes = [
          '콘크리트 타설',
          '철근 배근',
          '비계 설치',
          '내부 마감',
          '외벽 도장',
          '전기 배선',
          '배관 설치',
          '타일 부착',
          '안전 점검',
          '자재 반입'
        ]
        
        const memberNames = [
          '김작업',
          '이기능', 
          '박반장',
          '최관리',
          '안안전',
          '신신입'
        ]
        
        const totalWorkers = Math.floor(Math.random() * 10) + 5  // 5-15명
        const npcIncoming = Math.floor(Math.random() * 100) + 50  // 50-150
        const npcUsed = Math.floor(Math.random() * npcIncoming * 0.8)  // 사용량
        const npcRemaining = npcIncoming - npcUsed  // 잔량
        
        dailyReports.push({
          site_id: site.id,
          work_date: reportDate.toISOString().split('T')[0],
          member_name: memberNames[Math.floor(Math.random() * memberNames.length)],
          process_type: processTypes[Math.floor(Math.random() * processTypes.length)],
          total_workers: totalWorkers,
          npc1000_incoming: npcIncoming,
          npc1000_used: npcUsed,
          npc1000_remaining: npcRemaining,
          issues: Math.random() < 0.3 ? '날씨로 인한 작업 지연' : null,
          status: Math.random() < 0.8 ? 'submitted' : 'draft',
          created_by: profiles[Math.floor(Math.random() * profiles.length)].id
        })
      }
    }

    const { data: reportsData, error: reportsError } = await supabase
      .from('daily_reports')
      .upsert(dailyReports)
      .select()
      
    if (reportsError) throw reportsError
    console.log('✅ 작업일지 삽입 완료:', reportsData?.length, '건')

    // 5. 출근 기록 삽입 (지난 30일간)
    console.log('📅 출근 기록 삽입 중...')
    const attendanceRecords = []
    
    // 지난 30일간의 출근 기록 생성
    for (let i = 0; i < 30; i++) {
      const workDate = new Date(today)
      workDate.setDate(today.getDate() - i)
      
      // 주말 제외
      if (workDate.getDay() === 0 || workDate.getDay() === 6) continue
      
      // 각 작업자별로 80% 확률로 출근
      for (const profile of profiles) {
        if (Math.random() < 0.8) {
          const checkInHour = 8 + Math.floor(Math.random() * 2)
          const checkInMinute = Math.floor(Math.random() * 60)
          const checkOutHour = 17 + Math.floor(Math.random() * 2)
          const checkOutMinute = Math.floor(Math.random() * 60)
          
          const checkInTime = `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}:00`
          const checkOutTime = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}:00`
          
          const workedHours = checkOutHour - checkInHour + (checkOutMinute - checkInMinute) / 60
          const siteId = sites[Math.floor(Math.random() * sites.length)].id
          
          attendanceRecords.push({
            user_id: profile.id,
            site_id: siteId,
            work_date: workDate.toISOString().split('T')[0],
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            work_hours: Math.round(workedHours * 100) / 100,
            overtime_hours: Math.max(0, Math.round((workedHours - 8) * 100) / 100),
            status: 'present',
            notes: Math.random() < 0.1 ? '연장근무' : null
          })
        }
      }
    }

    // 출근기록을 batch로 삽입 (500개씩)
    const batchSize = 500
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize)
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .upsert(batch)
        
      if (attendanceError) throw attendanceError
    }
    console.log('✅ 출근 기록 삽입 완료:', attendanceRecords.length, '건')

    console.log('🎉 모든 테스트 데이터 삽입이 완료되었습니다!')
    console.log('\n📊 삽입된 데이터 요약:')
    console.log(`- 현장: ${sites.length}개`) 
    console.log(`- 작업자: ${profiles.length}명`)
    console.log(`- 작업일지: ${reportsData?.length || 0}건`)
    console.log(`- 출근기록: ${attendanceRecords.length}건`)
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

insertTestData()