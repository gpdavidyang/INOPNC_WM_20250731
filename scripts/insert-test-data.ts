#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Supabase 연결 설정
const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

console.log('🔑 Using Supabase URL:', supabaseUrl)
console.log('🔑 Service key length:', supabaseServiceKey.length)

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
    console.log('📊 기존 조직 정보 사용...')
    const organizationId = '1bf6a752-29a5-4f0f-a191-7aa39ac1f18c'  // 기존 INOPNC 본사 ID
    console.log('✅ 조직 정보 확인 완료')

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
        organization_id: '00000000-0000-0000-0000-000000000001',
        site_manager_name: '김현장',
        site_manager_phone: '010-1234-5678',
        safety_manager_name: '이안전',
        safety_manager_phone: '010-2345-6789',
        accommodation_info: '현장 내 컨테이너 숙소 10실',
        work_hours: '08:00-17:00 (점심시간: 12:00-13:00)',
        safety_rules: '안전모, 안전화 착용 필수\n출입 시 체크인 필수\n작업 전 안전 교육 이수',
        emergency_contact: '응급상황: 119, 현장 응급실: 010-9999-1234',
        project_type: '주상복합',
        total_budget: 15000000000,
        latitude: 37.5012743,
        longitude: 127.0396597
      },
      {
        id: '00000000-0000-0000-0000-000000000102',
        name: '송파 B현장',
        address: '서울시 송파구 올림픽로 789',
        description: '송파구 아파트 단지 리모델링 프로젝트',
        start_date: '2024-11-15',
        end_date: '2025-06-30',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        site_manager_name: '박현장',
        site_manager_phone: '010-3456-7890',
        safety_manager_name: '정안전',
        safety_manager_phone: '010-4567-8901',
        accommodation_info: '인근 원룸 제공 (월세 지원)',
        work_hours: '07:30-16:30 (점심시간: 12:00-13:00)',
        safety_rules: '리모델링 작업 시 방진마스크 착용 필수\n소음 발생 시간 제한: 08:00-18:00\n주민 민원 발생 시 즉시 보고',
        emergency_contact: '응급상황: 119, 현장 책임자: 010-9999-5678',
        project_type: '리모델링',
        total_budget: 8500000000,
        latitude: 37.5145157,
        longitude: 127.1066434
      },
      {
        id: '00000000-0000-0000-0000-000000000103',
        name: '서초 C현장',
        address: '서울시 서초구 반포대로 321',
        description: '서초구 오피스텔 신축 공사',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        site_manager_name: '최현장',
        site_manager_phone: '010-5678-9012',
        safety_manager_name: '한안전',
        safety_manager_phone: '010-6789-0123',
        accommodation_info: '현장 사무실 내 휴게실 운영',
        work_hours: '08:00-18:00 (점심시간: 12:00-13:00, 저녁시간: 18:00-19:00)',
        safety_rules: '고소 작업 시 안전벨트 착용 필수\n크레인 작업 시 반경 10m 내 출입금지\n매일 아침 안전 점검 회의 참석',
        emergency_contact: '응급상황: 119, 현장 의무실: 010-9999-9012',
        project_type: '오피스텔',
        total_budget: 22000000000,
        latitude: 37.4979515,
        longitude: 127.0276368
      },
      {
        id: '00000000-0000-0000-0000-000000000104',
        name: '방배 D현장',
        address: '서울시 서초구 방배로 159',
        description: '방배동 단독주택 신축 공사',
        start_date: '2024-10-01',
        end_date: '2025-04-30',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        site_manager_name: '윤현장',
        site_manager_phone: '010-7890-1234',
        safety_manager_name: '장안전',
        safety_manager_phone: '010-8901-2345',
        accommodation_info: '인근 고시원 연계 (교통비 지원)',
        work_hours: '08:30-17:30 (점심시간: 12:00-13:00)',
        safety_rules: '주택가 내 작업으로 소음 최소화\n자재 반입 시 주민 통행로 확보\n작업장 정리정돈 철저',
        emergency_contact: '응급상황: 119, 현장 연락처: 010-9999-7890',
        project_type: '단독주택',
        total_budget: 3500000000,
        latitude: 37.4814602,
        longitude: 127.0094221
      }
    ]

    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .upsert(sites)
      .select()
      
    if (siteError) throw siteError
    console.log('✅ 현장 정보 삽입 완료:', siteData?.length, '개 현장')

    // 3. 작업자 프로필 삽입
    console.log('👷 작업자 프로필 삽입 중...')
    const profiles = [
      {
        id: '00000000-0000-0000-0000-000000000201',
        email: 'worker1@inopnc.com',
        full_name: '김작업',
        role: 'worker',
        phone: '010-1111-1111',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        hire_date: '2024-08-01',
        department: '건설팀',
        position: '일반작업자',
        emergency_contact: '010-1111-9999',
        skills: ['콘크리트', '철근작업', '비계설치'],
        certifications: ['건설기계조종사면허', '용접기능사'],
        hourly_rate: 25000
      },
      {
        id: '00000000-0000-0000-0000-000000000202',
        email: 'worker2@inopnc.com',
        full_name: '이기능',
        role: 'worker',
        phone: '010-2222-2222',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        hire_date: '2024-07-15',
        department: '건설팀',
        position: '기능작업자',
        emergency_contact: '010-2222-9999',
        skills: ['전기공사', '배관작업', '타일작업'],
        certifications: ['전기기능사', '배관기능사'],
        hourly_rate: 30000
      },
      {
        id: '00000000-0000-0000-0000-000000000203',
        email: 'foreman@inopnc.com',
        full_name: '박반장',
        role: 'site_manager',
        phone: '010-3333-3333',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        hire_date: '2024-06-01',
        department: '건설팀',
        position: '현장반장',
        emergency_contact: '010-3333-9999',
        skills: ['현장관리', '안전관리', '품질관리'],
        certifications: ['건설안전기사', '건설기술자'],
        hourly_rate: 40000
      },
      {
        id: '00000000-0000-0000-0000-000000000204',
        email: 'manager@inopnc.com',
        full_name: '최관리',
        role: 'admin',
        phone: '010-4444-4444',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        hire_date: '2024-05-01',
        department: '관리팀',
        position: '현장소장',
        emergency_contact: '010-4444-9999',
        skills: ['프로젝트관리', '인사관리', '예산관리'],
        certifications: ['건축사', '건설기술자', 'PMP'],
        hourly_rate: 50000
      },
      {
        id: '00000000-0000-0000-0000-000000000205',
        email: 'safety@inopnc.com',
        full_name: '안안전',
        role: 'site_manager',
        phone: '010-5555-5555',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        hire_date: '2024-07-01',
        department: '안전팀',
        position: '안전관리자',
        emergency_contact: '010-5555-9999',
        skills: ['안전관리', '위험성평가', '안전교육'],
        certifications: ['건설안전기사', '산업안전지도사'],
        hourly_rate: 35000
      },
      {
        id: '00000000-0000-0000-0000-000000000206',
        email: 'newbie@inopnc.com',
        full_name: '신신입',
        role: 'worker',
        phone: '010-6666-6666',
        status: 'active',
        organization_id: '00000000-0000-0000-0000-000000000001',
        hire_date: '2025-01-01',
        department: '건설팀',
        position: '신입작업자',
        emergency_contact: '010-6666-9999',
        skills: ['기본작업'],
        certifications: ['건설기초안전이수증'],
        hourly_rate: 22000
      }
    ]

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(profiles)
      .select()
      
    if (profileError) throw profileError
    console.log('✅ 작업자 프로필 삽입 완료:', profileData?.length, '명')

    // 4. 작업일지 먼저 삽입 (출근 기록이 daily_report_id를 참조하므로)
    console.log('📝 작업일지 삽입 중...')
    const dailyReports = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const reportDate = new Date(today)
      reportDate.setDate(today.getDate() - i)
      
      // 주말 제외
      if (reportDate.getDay() === 0 || reportDate.getDay() === 6) continue
      
      for (const site of sites) {
        const weather = ['맑음', '흐림', '비', '눈'][Math.floor(Math.random() * 4)]
        const tempHigh = Math.floor(Math.random() * 15) + 10  // 10-25도
        const tempLow = tempHigh - Math.floor(Math.random() * 10) - 5  // 최고기온보다 5-15도 낮음
        
        const workDescriptions = [
          '콘크리트 타설 작업 진행',
          '철근 배근 작업 완료',
          '비계 설치 및 점검',
          '내부 마감 작업 진행',
          '외벽 도장 작업',
          '전기 배선 작업',
          '배관 설치 작업',
          '타일 부착 작업',
          '안전 점검 및 정리',
          '자재 반입 및 정리'
        ]
        
        dailyReports.push({
          id: `report-${site.id.slice(-3)}-${i.toString().padStart(2, '0')}`,
          site_id: site.id,
          report_date: reportDate.toISOString().split('T')[0],
          weather,
          temperature_high: tempHigh,
          temperature_low: tempLow,
          notes: workDescriptions[Math.floor(Math.random() * workDescriptions.length)],
          status: Math.random() < 0.8 ? 'submitted' : 'draft',
          created_by: profiles[Math.floor(Math.random() * profiles.length)].id,
          submitted_by: Math.random() < 0.8 ? profiles.find(p => p.role === 'site_manager')?.id : null,
          submitted_at: Math.random() < 0.8 ? reportDate.toISOString() : null
        })
      }
    }

    const { data: reportsData, error: reportsError } = await supabase
      .from('daily_reports')
      .upsert(dailyReports)
      .select()
      
    if (reportsError) throw reportsError
    console.log('✅ 작업일지 삽입 완료:', reportsData?.length, '건')

    // 5. 출근 기록 삽입 (daily_report_id 기반)
    console.log('📅 출근 기록 삽입 중...')
    const attendanceRecords = []
    
    // 각 daily_report에 대해 출근 기록 생성
    for (const report of reportsData || []) {
      // 각 작업자별로 80% 확률로 출근
      for (const profile of profiles) {
        if (Math.random() < 0.8) {
          const checkInTime = `${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`
          const checkOutTime = `${17 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`
          
          const startHour = parseInt(checkInTime.split(':')[0])
          const endHour = parseInt(checkOutTime.split(':')[0])
          const workedHours = endHour - startHour
          
          attendanceRecords.push({
            id: `attend-${report.id.slice(-6)}-${profile.id.slice(-3)}`,
            daily_report_id: report.id,
            worker_id: profile.id,
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            overtime_hours: Math.max(0, workedHours - 8),
            work_type: ['일반작업', '기능작업', '안전관리', '현장관리'][Math.floor(Math.random() * 4)],
            notes: Math.random() < 0.1 ? '연장근무' : null,
            created_by: profile.id
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
    console.log(`- 조직: 1개`)
    console.log(`- 현장: ${sites.length}개`) 
    console.log(`- 작업자: ${profiles.length}명`)
    console.log(`- 작업일지: ${reportsData?.length || 0}건`)
    console.log(`- 출근기록: ${attendanceRecords.length}건`)
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

insertTestData()