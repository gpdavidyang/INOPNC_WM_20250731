const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function finalTest() {
  console.log('🎯 최종 검증 - 출근현황 페이지 데이터 테스트\n');
  
  // manager@inopnc.com으로 로그인
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  });
  
  if (authError) {
    console.error('❌ 로그인 실패:', authError);
    return;
  }
  
  console.log('✅ 로그인 성공: manager@inopnc.com');
  console.log('   User ID:', authData.user?.id);
  
  // 프로필 정보 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user?.id)
    .single();
  
  console.log('👤 프로필 정보:');
  console.log('   이름:', profile?.full_name);
  console.log('   역할:', profile?.role);
  console.log('   사이트 ID:', profile?.site_id);
  
  // 출근 기록 조회 (서버 액션과 동일한 쿼리)
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      sites(id, name)
    `)
    .eq('user_id', authData.user?.id)
    .gte('work_date', '2025-08-01')
    .lte('work_date', '2025-08-31')
    .order('work_date', { ascending: true });
  
  if (error) {
    console.error('❌ 쿼리 에러:', error);
  } else {
    console.log('\n📊 2025년 8월 출근 기록:');
    console.log('   총 기록 수:', data?.length || 0, '건');
    
    if (data && data.length > 0) {
      console.log('\n   상세 기록:');
      data.forEach(record => {
        console.log(`   - ${record.work_date}: ${record.work_hours}시간 (${record.labor_hours}공수) - ${record.sites?.name || '현장 정보 없음'}`);
      });
      
      // 요약 정보
      const totalDays = data.filter(r => r.status === 'present' || !r.status).length;
      const totalHours = data.reduce((sum, r) => sum + (r.work_hours || 0), 0);
      const totalLaborHours = data.reduce((sum, r) => sum + (r.labor_hours || 0), 0);
      
      console.log('\n📈 요약:');
      console.log('   출근일수:', totalDays, '일');
      console.log('   총 근무시간:', totalHours.toFixed(2), '시간');
      console.log('   총 공수:', totalLaborHours.toFixed(2), '공수');
    }
  }
  
  console.log('\n✨ 테스트 완료!');
  console.log('💡 브라우저에서 http://localhost:3001/dashboard/attendance 확인하세요.');
}

finalTest();