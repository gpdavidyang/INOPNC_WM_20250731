import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key로 RLS 우회
)

async function insertAttendanceSamples() {
  console.log('📊 출근 샘플 데이터 삽입 시작...\n')
  
  try {
    // 1. 사용자와 현장 정보 가져오기
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('email', ['worker@inopnc.com', 'manager@inopnc.com', 'admin@inopnc.com'])
    
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3)
    
    if (!profiles || !sites || profiles.length === 0 || sites.length === 0) {
      console.error('❌ 사용자 또는 현장 정보가 없습니다')
      return
    }
    
    console.log('👥 사용자:', profiles.map(p => p.email))
    console.log('🏗️ 현장:', sites.map(s => s.name))
    
    // 2. 2025년 8월 출근 데이터 생성
    const attendanceRecords = []
    const today = new Date()
    const currentYear = 2025
    const currentMonth = 7 // August (0-indexed)
    
    // 각 사용자마다 8월 데이터 생성
    for (const profile of profiles) {
      // 8월 1일부터 오늘까지
      for (let day = 1; day <= today.getDate(); day++) {
        // 주말 제외 (간단히 토/일 제외)
        const date = new Date(currentYear, currentMonth, day)
        const dayOfWeek = date.getDay()
        
        if (dayOfWeek === 0 || dayOfWeek === 6) continue // 주말 스킵
        
        // 랜덤하게 현장 선택
        const site = sites[Math.floor(Math.random() * sites.length)]
        
        // 출근 시간 랜덤 (8:00 ~ 9:00)
        const checkInHour = 8
        const checkInMinute = Math.floor(Math.random() * 60)
        
        // 퇴근 시간 랜덤 (17:00 ~ 19:00)
        const checkOutHour = 17 + Math.floor(Math.random() * 3)
        const checkOutMinute = Math.floor(Math.random() * 60)
        
        // 근무 시간 계산
        const workHours = (checkOutHour - checkInHour) + (checkOutMinute - checkInMinute) / 60
        const overtimeHours = Math.max(0, workHours - 8)
        const laborHours = workHours / 8 // 공수 계산
        
        attendanceRecords.push({
          user_id: profile.id,
          site_id: site.id,
          work_date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          check_in_time: `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}:00`,
          check_out_time: `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}:00`,
          work_hours: Number(workHours.toFixed(2)),
          overtime_hours: Number(overtimeHours.toFixed(2)),
          labor_hours: Number(laborHours.toFixed(2)),
          status: 'present',
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
    
    console.log(`\n📝 생성할 출근 기록: ${attendanceRecords.length}개`)
    
    // 3. 기존 데이터 확인
    const { data: existingRecords } = await supabase
      .from('attendance_records')
      .select('user_id, work_date')
      .gte('work_date', '2025-08-01')
      .lte('work_date', '2025-08-31')
    
    console.log(`기존 8월 출근 기록: ${existingRecords?.length || 0}개`)
    
    // 4. 중복 제거
    const newRecords = attendanceRecords.filter(record => {
      return !existingRecords?.some(existing => 
        existing.user_id === record.user_id && 
        existing.work_date === record.work_date
      )
    })
    
    console.log(`중복 제거 후: ${newRecords.length}개`)
    
    if (newRecords.length === 0) {
      console.log('✅ 이미 충분한 출근 데이터가 있습니다')
      return
    }
    
    // 5. 데이터 삽입
    const { data: inserted, error } = await supabase
      .from('attendance_records')
      .insert(newRecords)
      .select()
    
    if (error) {
      console.error('❌ 삽입 오류:', error)
    } else {
      console.log(`✅ ${inserted?.length || 0}개의 출근 기록 삽입 완료!`)
      
      // 요약 출력
      const summary = {}
      for (const record of newRecords) {
        const userEmail = profiles.find(p => p.id === record.user_id)?.email || 'unknown'
        if (!summary[userEmail]) {
          summary[userEmail] = 0
        }
        summary[userEmail]++
      }
      
      console.log('\n📊 사용자별 삽입 요약:')
      Object.entries(summary).forEach(([email, count]) => {
        console.log(`  - ${email}: ${count}개`)
      })
    }
    
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error)
  }
}

insertAttendanceSamples()