import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function debugAttendanceIssue() {
  console.log('🔍 출근현황 데이터 문제 디버깅 시작...\n')
  
  try {
    // 1. manager 계정으로 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ 인증 오류:', authError)
      return
    }
    
    console.log('✅ 로그인 성공:', authData.user?.email)
    console.log('User ID:', authData.user?.id)
    
    // 2. attendance_records 테이블 구조 확인
    console.log('\n📊 attendance_records 테이블 컬럼 확인:')
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('attendance_records')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ 테이블 조회 오류:', sampleError)
    } else if (sampleRecord && sampleRecord.length > 0) {
      console.log('컬럼 목록:', Object.keys(sampleRecord[0]))
      console.log('\n샘플 레코드:')
      console.log(sampleRecord[0])
    } else {
      console.log('⚠️ 테이블이 비어있습니다')
    }
    
    // 3. 컴포넌트에서 사용하는 정확한 쿼리 테스트
    console.log('\n📋 컴포넌트 쿼리 테스트:')
    const currentMonth = new Date()
    const selectedYear = currentMonth.getFullYear()
    const selectedMonth = currentMonth.getMonth() + 1
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
    
    console.log('날짜 범위:', startDate, '~', endDate)
    
    // attendance-tab.tsx의 정확한 쿼리 복제
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select(`
        id,
        work_date,
        check_in_time,
        check_out_time,
        status,
        work_hours,
        overtime_hours,
        notes,
        site_id,
        sites(name)
      `)
      .eq('user_id', authData.user?.id)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: false })
    
    if (attendanceError) {
      console.error('❌ 쿼리 오류:', attendanceError)
      console.error('오류 상세:', {
        message: attendanceError.message,
        details: attendanceError.details,
        hint: attendanceError.hint,
        code: attendanceError.code
      })
    } else {
      console.log('✅ 쿼리 성공!')
      console.log('레코드 수:', attendanceData?.length || 0)
      
      if (attendanceData && attendanceData.length > 0) {
        console.log('\n첫 번째 레코드:')
        console.log(attendanceData[0])
        
        // labor_hours 필드 확인 (컴포넌트에서 계산하는 필드)
        const transformedRecord = {
          ...attendanceData[0],
          labor_hours: attendanceData[0].work_hours ? attendanceData[0].work_hours / 8 : 0,
          site_name: attendanceData[0].sites?.name || ''
        }
        console.log('\n변환된 레코드 (컴포넌트 형식):')
        console.log(transformedRecord)
      }
    }
    
    // 4. 현장 목록 조회 테스트
    console.log('\n🏗️ 현장 목록 조회:')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, address')
      .eq('status', 'active')
      .order('name')
    
    if (sitesError) {
      console.error('❌ 현장 조회 오류:', sitesError)
    } else {
      console.log('✅ 현장 수:', sites?.length || 0)
      if (sites && sites.length > 0) {
        console.log('현장 목록:')
        sites.forEach(site => {
          console.log(`  - ${site.name} (ID: ${site.id})`)
        })
      }
    }
    
    // 5. 작업일지와 비교 - daily_reports 쿼리도 테스트
    console.log('\n📝 작업일지 쿼리 비교 테스트:')
    const { data: reportsData, error: reportsError } = await supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        issues,
        status,
        created_at,
        updated_at,
        site_id,
        created_by,
        sites!inner(
          id,
          name
        )
      `)
      .order('work_date', { ascending: false })
      .limit(5)
    
    if (reportsError) {
      console.error('❌ 작업일지 쿼리 오류:', reportsError)
    } else {
      console.log('✅ 작업일지 쿼리 성공!')
      console.log('레코드 수:', reportsData?.length || 0)
    }
    
    // 6. 브라우저에서 발생할 수 있는 문제 확인
    console.log('\n⚠️ 잠재적 문제 분석:')
    
    // work_hours가 null인 경우 체크
    if (attendanceData && attendanceData.length > 0) {
      const nullWorkHours = attendanceData.filter(r => r.work_hours === null || r.work_hours === undefined)
      if (nullWorkHours.length > 0) {
        console.log(`- work_hours가 null인 레코드: ${nullWorkHours.length}개`)
        console.log('  → 컴포넌트의 299번째 줄에서 0으로 처리됨')
      }
      
      // sites join이 실패한 경우 체크
      const noSites = attendanceData.filter(r => !r.sites)
      if (noSites.length > 0) {
        console.log(`- sites 정보가 없는 레코드: ${noSites.length}개`)
        console.log('  → 컴포넌트의 295번째 줄에서 빈 문자열로 처리됨')
      }
    }
    
    console.log('\n✨ 디버깅 완료!')
    
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error)
  } finally {
    await supabase.auth.signOut()
  }
}

debugAttendanceIssue()