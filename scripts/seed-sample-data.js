// 샘플 데이터 생성 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  console.log('🌱 샘플 데이터 생성 중...\n')

  try {
    // 1. 현장 데이터 생성
    console.log('1. 현장 데이터 생성')
    console.log('=' .repeat(50))
    
    const sites = [
      {
        name: '강남 A현장',
        address: '서울시 강남구 테헤란로 456',
        description: '오피스텔 건설 현장',
        work_process: '슬라브 타설',
        work_section: '지하 1층',
        component_name: '기둥 C1-C5 구간',
        manager_name: '김현장',
        construction_manager_phone: '010-1234-5678',
        safety_manager_name: '박안전',
        safety_manager_phone: '010-2345-6789',
        accommodation_name: '강남 숙소',
        accommodation_address: '서울시 강남구 역삼로 123',
        status: 'active',
        start_date: '2024-01-15',
        end_date: '2025-12-31'
      },
      {
        name: '서초 B현장',
        address: '서울시 서초구 서초대로 789',
        description: '아파트 건설 현장',
        work_process: '철근 배근',
        work_section: '지상 3층',
        component_name: '보 B10-B15 구간',
        manager_name: '이현장',
        construction_manager_phone: '010-3456-7890',
        safety_manager_name: '최안전',
        safety_manager_phone: '010-4567-8901',
        accommodation_name: '서초 숙소',
        accommodation_address: '서울시 서초구 반포대로 456',
        status: 'active',
        start_date: '2024-03-01',
        end_date: '2026-02-28'
      },
      {
        name: '송파 C현장',
        address: '서울시 송파구 올림픽로 321',
        description: '상업시설 건설 현장',
        work_process: '마감',
        work_section: 'B동 5층',
        component_name: '내벽 마감재',
        manager_name: '정현장',
        construction_manager_phone: '010-5678-9012',
        safety_manager_name: '한안전',
        safety_manager_phone: '010-6789-0123',
        accommodation_name: '송파 숙소',
        accommodation_address: '서울시 송파구 잠실로 789',
        status: 'active',
        start_date: '2024-06-01',
        end_date: '2025-05-31'
      },
      {
        name: '완료된 D현장',
        address: '서울시 마포구 월드컵로 654',
        description: '완료된 프로젝트',
        work_process: '준공',
        work_section: '전체',
        component_name: '최종 점검',
        manager_name: '완현장',
        construction_manager_phone: '010-7890-1234',
        safety_manager_name: '종안전',
        safety_manager_phone: '010-8901-2345',
        status: 'completed',
        start_date: '2023-01-01',
        end_date: '2024-06-30'
      }
    ]

    const { data: createdSites, error: sitesError } = await supabase
      .from('sites')
      .insert(sites)
      .select()

    if (sitesError) {
      console.error('현장 생성 에러:', sitesError)
      return
    }

    console.log(`✅ ${createdSites.length}개 현장 생성 완료`)
    createdSites.forEach(site => {
      console.log(`  - ${site.name} (ID: ${site.id})`)
    })

    // 2. 사용자 현장 배정
    console.log('\n2. 사용자 현장 배정')
    console.log('=' .repeat(50))
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role')

    if (!profiles || profiles.length === 0) {
      console.log('❌ 사용자 프로필을 찾을 수 없습니다.')
      return
    }

    // 현재 날짜 기준으로 배정
    const today = new Date().toISOString().split('T')[0]
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const oneMonthAgoString = oneMonthAgo.toISOString().split('T')[0]

    const assignments = []
    
    // 각 사용자를 적절한 현장에 배정
    profiles.forEach((profile, index) => {
      const siteIndex = index % createdSites.length
      const site = createdSites[siteIndex]
      
      let role = 'worker'
      if (profile.role === 'site_manager' || profile.role === 'admin') {
        role = 'site_manager'
      } else if (profile.role === 'customer_manager') {
        role = 'supervisor'
      }

      // 현재 활성 배정
      assignments.push({
        user_id: profile.id,
        site_id: site.id,
        assigned_date: today,
        is_active: true,
        role: role
      })

      // 과거 이력 추가 (일부 사용자에게만)
      if (index % 2 === 0 && createdSites.length > 1) {
        const pastSiteIndex = (index + 1) % createdSites.length
        const pastSite = createdSites[pastSiteIndex]
        
        assignments.push({
          user_id: profile.id,
          site_id: pastSite.id,
          assigned_date: oneMonthAgoString,
          unassigned_date: today,
          is_active: false,
          role: role
        })
      }
    })

    const { data: createdAssignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .insert(assignments)
      .select()

    if (assignmentsError) {
      console.error('현장 배정 에러:', assignmentsError)
      return
    }

    console.log(`✅ ${createdAssignments.length}개 현장 배정 완료`)

    // 3. 작업일지 생성 (최근 30일)
    console.log('\n3. 작업일지 생성')
    console.log('=' .repeat(50))

    const dailyReports = []
    const memberNames = ['슬라브', '거더', '기둥', '보', '벽체']
    const processTypes = ['균열', '면', '마감', '배근', '타설']
    
    // 최근 30일간 데이터 생성
    for (let i = 0; i < 30; i++) {
      const workDate = new Date()
      workDate.setDate(workDate.getDate() - i)
      const workDateString = workDate.toISOString().split('T')[0]
      
      // 주말은 건너뛰기
      if (workDate.getDay() === 0 || workDate.getDay() === 6) continue
      
      // 각 현장에 대해 작업일지 생성 (확률적으로)
      createdSites.slice(0, 3).forEach(site => { // 활성 현장만
        if (Math.random() > 0.3) { // 70% 확률로 작업일지 생성
          const workerProfile = profiles.find(p => p.role === 'worker')
          
          dailyReports.push({
            site_id: site.id,
            work_date: workDateString,
            member_name: memberNames[Math.floor(Math.random() * memberNames.length)],
            process_type: processTypes[Math.floor(Math.random() * processTypes.length)],
            total_workers: Math.floor(Math.random() * 20) + 5, // 5-25명
            npc1000_incoming: Math.floor(Math.random() * 100) + 50,
            npc1000_used: Math.floor(Math.random() * 80) + 20,
            npc1000_remaining: Math.floor(Math.random() * 50) + 10,
            issues: Math.random() > 0.7 ? '특이사항 없음' : null,
            status: Math.random() > 0.2 ? 'submitted' : 'draft',
            created_by: workerProfile?.id || profiles[0].id,
            submitted_by: workerProfile?.id || profiles[0].id
          })
        }
      })
    }

    if (dailyReports.length > 0) {
      const { data: createdReports, error: reportsError } = await supabase
        .from('daily_reports')
        .insert(dailyReports)
        .select()

      if (reportsError) {
        console.error('작업일지 생성 에러:', reportsError)
        return
      }

      console.log(`✅ ${createdReports.length}개 작업일지 생성 완료`)
    }

    // 4. 출근 기록 생성 (최근 14일)
    console.log('\n4. 출근 기록 생성')
    console.log('=' .repeat(50))

    const attendanceRecords = []
    
    for (let i = 0; i < 14; i++) {
      const workDate = new Date()
      workDate.setDate(workDate.getDate() - i)
      const workDateString = workDate.toISOString().split('T')[0]
      
      // 주말은 건너뛰기
      if (workDate.getDay() === 0 || workDate.getDay() === 6) continue
      
      // 각 활성 배정에 대해 출근 기록 생성
      const activeAssignments = createdAssignments.filter(a => a.is_active)
      
      activeAssignments.forEach(assignment => {
        if (Math.random() > 0.1) { // 90% 출근률
          const checkInHour = 7 + Math.floor(Math.random() * 2) // 7-8시
          const workHours = 8 + Math.random() * 2 // 8-10시간
          const checkOutHour = checkInHour + Math.floor(workHours)
          
          attendanceRecords.push({
            user_id: assignment.user_id,
            site_id: assignment.site_id,
            work_date: workDateString,
            check_in_time: `${String(checkInHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
            check_out_time: `${String(Math.min(checkOutHour, 23)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
            work_hours: Math.round(workHours * 10) / 10,
            overtime_hours: Math.max(0, workHours - 8),
            status: 'present'
          })
        }
      })
    }

    if (attendanceRecords.length > 0) {
      const { data: createdAttendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .insert(attendanceRecords)
        .select()

      if (attendanceError) {
        console.error('출근 기록 생성 에러:', attendanceError)
        return
      }

      console.log(`✅ ${createdAttendance.length}개 출근 기록 생성 완료`)
    }

    console.log('\n🎉 모든 샘플 데이터 생성 완료!')
    console.log(`- 현장: ${createdSites.length}개`)
    console.log(`- 현장 배정: ${createdAssignments.length}개`) 
    console.log(`- 작업일지: ${dailyReports.length}개`)
    console.log(`- 출근 기록: ${attendanceRecords.length}개`)

  } catch (error) {
    console.error('에러:', error)
  }
}

seedData()