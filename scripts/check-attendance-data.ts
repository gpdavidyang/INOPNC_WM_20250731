const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkAttendanceData() {
  console.log('📊 출근 데이터 분석 시작...\n');
  
  // Sign in as manager
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  });
  
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  console.log('✅ 로그인 성공: manager@inopnc.com');
  console.log('User ID:', authData.user?.id);
  
  // 1. 전체 출근 기록 확인
  const { data: allRecords, error: allError } = await supabase
    .from('attendance_records')
    .select('id, work_date, user_id, site_id, work_hours, labor_hours')
    .order('work_date', { ascending: false });
  
  console.log('\n📅 전체 출근 기록:');
  if (allError) {
    console.error('Error:', allError);
  } else {
    console.log('총 기록 수:', allRecords?.length || 0);
    if (allRecords && allRecords.length > 0) {
      console.log('날짜 범위:', allRecords[allRecords.length - 1].work_date, '~', allRecords[0].work_date);
      
      // 날짜별 분포
      const dateDistribution: any = {};
      allRecords.forEach(r => {
        const month = r.work_date.substring(0, 7);
        dateDistribution[month] = (dateDistribution[month] || 0) + 1;
      });
      console.log('월별 분포:', dateDistribution);
    }
  }
  
  // 2. Manager의 출근 기록 확인 (2025년 8월)
  const currentMonth = new Date();
  const selectedYear = currentMonth.getFullYear();
  const selectedMonth = currentMonth.getMonth() + 1;
  const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
  
  console.log('\n🔍 Manager 출근 기록 조회 (2025년 8월):');
  console.log('조회 범위:', startDate, '~', endDate);
  
  const { data: managerRecords, error: managerError } = await supabase
    .from('attendance_records')
    .select(`
      id,
      work_date,
      check_in_time,
      check_out_time,
      status,
      work_hours,
      overtime_hours,
      labor_hours,
      notes,
      site_id,
      sites(name)
    `)
    .eq('user_id', authData.user?.id)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: false });
  
  if (managerError) {
    console.error('❌ Error:', managerError);
  } else {
    console.log('✅ 조회 성공!');
    console.log('찾은 기록 수:', managerRecords?.length || 0);
    if (managerRecords && managerRecords.length > 0) {
      console.log('\n최근 3개 기록:');
      managerRecords.slice(0, 3).forEach((r: any) => {
        console.log(`  - ${r.work_date}: ${r.work_hours}시간 (${r.labor_hours}공수) - ${r.sites?.name}`);
      });
    } else {
      console.log('⚠️ 2025년 8월 데이터가 없습니다!');
    }
  }
  
  // 3. 전체 사용자별 출근 기록 요약
  console.log('\n👥 사용자별 출근 기록 요약:');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name');
  
  if (profiles) {
    for (const profile of profiles) {
      const { count, error } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);
      
      if (!error) {
        console.log(`  - ${profile.email}: ${count || 0}건`);
      }
    }
  }
  
  // 4. 실제 날짜 확인
  console.log('\n📆 현재 날짜 정보:');
  console.log('오늘:', new Date().toISOString().split('T')[0]);
  console.log('조회 시작일:', startDate);
  console.log('조회 종료일:', endDate);
}

checkAttendanceData();