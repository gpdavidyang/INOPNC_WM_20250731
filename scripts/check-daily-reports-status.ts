const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDailyReportsData() {
  console.log('📊 작업일지 데이터베이스 현황 확인\n');
  
  try {
    // 관리자로 로그인
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'admin@inopnc.com',
      password: 'password123'
    });
    
    console.log('✅ 로그인 성공: admin@inopnc.com');
    
    // 전체 작업일지 수
    const { count: totalCount } = await supabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true });
    
    console.log('📝 전체 작업일지 수:', totalCount || 0, '건\n');
    
    // 최근 10개 작업일지 조회
    const { data: recentReports, error } = await supabase
      .from('daily_reports')
      .select('id, work_date, member_name, process_type, status, total_workers, sites(name), created_by')
      .order('work_date', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ 오류:', error.message);
      return;
    }
    
    console.log('📋 최근 작업일지 10건:');
    console.log('='.repeat(70));
    
    if (recentReports && recentReports.length > 0) {
      recentReports.forEach((report, index) => {
        console.log(`${index + 1}. ${report.work_date} - ${report.process_type}`);
        console.log(`   👷 작업자: ${report.member_name} (${report.total_workers || 0}명)`);
        console.log(`   🏗️ 현장: ${report.sites?.name || '현장 정보 없음'}`);
        console.log(`   📋 상태: ${report.status}`);
        console.log(`   ✏️ 작성자 ID: ${report.created_by || '정보 없음'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ 작업일지가 없습니다.');
    }
    
    // 상태별 통계
    const { data: statusStats, error: statsError } = await supabase
      .from('daily_reports')
      .select('status')
      .order('status');
    
    if (statsError) {
      console.error('통계 오류:', statsError.message);
    } else if (statusStats) {
      const statusCounts = {};
      statusStats.forEach(report => {
        statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
      });
      
      console.log('📊 상태별 통계:');
      console.log('='.repeat(30));
      Object.entries(statusCounts).forEach(([status, count]) => {
        const statusName = {
          'draft': '임시저장',
          'submitted': '제출완료', 
          'approved': '승인완료'
        }[status] || status;
        console.log(`   ${statusName}: ${count}건`);
      });
    }
    
    // 최근 7일간 통계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    const { count: recentCount } = await supabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true })
      .gte('work_date', sevenDaysAgoStr);
    
    console.log(`\n📅 최근 7일간 작업일지: ${recentCount || 0}건`);
    
    // 현장별 통계
    const { data: siteStats, error: siteStatsError } = await supabase
      .from('daily_reports')
      .select('site_id, sites(name)')
      .order('site_id');
    
    if (siteStatsError) {
      console.error('현장 통계 오류:', siteStatsError.message);
    } else if (siteStats) {
      const siteCounts = {};
      siteStats.forEach(report => {
        const siteName = report.sites?.name || '현장 정보 없음';
        siteCounts[siteName] = (siteCounts[siteName] || 0) + 1;
      });
      
      console.log('\n🏗️ 현장별 통계:');
      console.log('='.repeat(30));
      Object.entries(siteCounts).forEach(([siteName, count]) => {
        console.log(`   ${siteName}: ${count}건`);
      });
    }
    
  } catch (error) {
    console.error('❌ 전체 오류:', error.message);
  }
}

checkDailyReportsData();