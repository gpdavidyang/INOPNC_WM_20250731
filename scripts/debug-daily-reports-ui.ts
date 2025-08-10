const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugDailyReportsUI() {
  console.log('🔍 작업일지 UI 디버깅\n');
  
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
    console.log('User ID:', authData.user?.id);
    
    // Test the exact query used in the component
    const filters = {
      start_date: '2025-07-01',
      end_date: '2025-08-31'
    };
    
    console.log('\n📊 컴포넌트와 동일한 쿼리 실행:');
    console.log('Filters:', filters);
    
    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        site:sites(id, name)
      `)
      .order('work_date', { ascending: false });
    
    if (filters.start_date) {
      query = query.gte('work_date', filters.start_date);
    }
    
    if (filters.end_date) {
      query = query.lte('work_date', filters.end_date);
    }
    
    const { data: reports, error: reportsError } = await query;
    
    if (reportsError) {
      console.error('❌ 작업일지 조회 실패:', reportsError);
      return;
    }
    
    console.log('\n✅ 작업일지 조회 성공!');
    console.log('총 기록 수:', reports?.length || 0);
    
    if (reports && reports.length > 0) {
      console.log('\n📋 처음 3개 기록 상세:');
      reports.slice(0, 3).forEach((report, index) => {
        console.log(`\n--- 기록 ${index + 1} ---`);
        console.log('ID:', report.id);
        console.log('작업일:', report.work_date);
        console.log('작업자:', report.member_name);
        console.log('작업유형:', report.process_type);
        console.log('총 작업자:', report.total_workers);
        console.log('상태:', report.status);
        console.log('현장:', report.site?.name || '미지정');
        console.log('생성일:', report.created_at);
      });
      
      // Test filtering with search term (as done in component)
      const searchTerm = '슬라브';
      const filteredReports = reports.filter(report => {
        const matchesSearch = 
          report.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.process_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (report.issues && report.issues.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      });
      
      console.log(`\n🔍 "${searchTerm}" 검색 결과:`, filteredReports.length, '건');
      
    } else {
      console.log('\n⚠️ 작업일지 데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('💥 오류 발생:', error.message);
  }
}

debugDailyReportsUI();