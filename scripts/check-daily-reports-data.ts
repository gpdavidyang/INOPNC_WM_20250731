const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDailyReportsData() {
  console.log('🔍 작업일지 데이터 현황 확인\n');
  
  try {
    // Sign in as manager
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('❌ 로그인 실패:', authError.message);
      return;
    }
    
    console.log('✅ 로그인 성공: manager@inopnc.com');
    
    // Get daily reports
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        total_workers,
        status,
        created_at,
        site_id,
        sites(name)
      `)
      .order('work_date', { ascending: false })
      .limit(10);
    
    if (reportsError) {
      console.error('❌ 작업일지 조회 실패:', reportsError);
      return;
    }
    
    console.log('📊 작업일지 데이터 현황:');
    console.log('총 기록 수:', reports?.length || 0);
    
    if (reports && reports.length > 0) {
      console.log('\n📋 최근 작업일지 목록:');
      reports.forEach((report, index) => {
        console.log(`  ${index + 1}. [${report.work_date}] ${report.member_name} - ${report.process_type}`);
        console.log(`     현장: ${report.sites?.name || '미지정'}, 상태: ${report.status}, 작업자: ${report.total_workers || 0}명`);
      });
    } else {
      console.log('⚠️ 작업일지 데이터가 없습니다.');
    }
    
    // Get sites data for reference
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, status')
      .eq('status', 'active')
      .order('name');
    
    if (!sitesError && sites) {
      console.log('\n🏗️ 활성 현장 목록:');
      sites.forEach((site, index) => {
        console.log(`  ${index + 1}. ${site.name} (ID: ${site.id.substring(0, 8)}...)`);
      });
    }
    
  } catch (error) {
    console.error('💥 오류 발생:', error.message);
  }
}

checkDailyReportsData();