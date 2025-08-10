const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyRealisticData() {
  console.log('🔍 현실적인 데이터 검증 중...\n');
  
  try {
    // 1. 업데이트된 사용자 확인
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, phone')
      .order('role, full_name');

    if (profileError) {
      console.error('❌ 사용자 조회 실패:', profileError.message);
      return;
    }

    console.log('👥 업데이트된 사용자 목록:');
    profiles.forEach(profile => {
      console.log(`   - ${profile.full_name} (${profile.role}) [${profile.email}] ${profile.phone || ''}`);
    });

    // 2. 최근 출근 기록 확인 (최근 7일)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: recentAttendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select(`
        work_date, 
        check_in_time, 
        check_out_time, 
        labor_hours, 
        status,
        notes,
        profiles!inner(full_name)
      `)
      .gte('work_date', sevenDaysAgo)
      .order('work_date DESC, profiles.full_name')
      .limit(10);

    if (attendanceError) {
      console.error('❌ 출근 기록 조회 실패:', attendanceError.message);
    } else {
      console.log(`\n⏰ 최근 출근 기록 (${recentAttendance.length}건):`);
      recentAttendance.forEach(record => {
        console.log(`   - ${record.profiles.full_name}: ${record.work_date} ${record.check_in_time}-${record.check_out_time} (${record.labor_hours}공수) ${record.notes || ''}`);
      });
    }

    // 3. 최근 작업일지 확인 (최근 7일)
    const { data: recentReports, error: reportError } = await supabase
      .from('daily_reports')
      .select(`
        work_date,
        member_name,
        process_type,
        total_workers,
        npc1000_incoming,
        npc1000_used,
        npc1000_remaining,
        issues,
        sites!inner(name),
        profiles!inner(full_name)
      `)
      .gte('work_date', sevenDaysAgo)
      .order('work_date DESC')
      .limit(10);

    if (reportError) {
      console.error('❌ 작업일지 조회 실패:', reportError.message);
    } else {
      console.log(`\n📝 최근 작업일지 (${recentReports.length}건):`);
      recentReports.forEach(report => {
        const npcInfo = report.npc1000_used ? ` (NPC자재: ${report.npc1000_used}/${report.npc1000_incoming})` : '';
        const issues = report.issues ? ` [이슈: ${report.issues}]` : '';
        console.log(`   - ${report.sites.name}: ${report.work_date} ${report.member_name} ${report.process_type} (작업자 ${report.total_workers}명)${npcInfo}${issues}`);
      });
    }

    // 4. 현장 배정 현황
    const { data: assignments, error: assignmentError } = await supabase
      .from('site_assignments')
      .select(`
        assigned_date,
        role,
        is_active,
        sites!inner(name),
        profiles!inner(full_name, role)
      `)
      .eq('is_active', true)
      .order('sites.name, profiles.role');

    if (assignmentError) {
      console.error('❌ 현장 배정 조회 실패:', assignmentError.message);
    } else {
      console.log(`\n📋 현장 배정 현황 (${assignments.length}건):`);
      
      // 현장별로 그룹화
      const siteGroups = assignments.reduce((acc, assignment) => {
        const siteName = assignment.sites.name;
        if (!acc[siteName]) {
          acc[siteName] = [];
        }
        acc[siteName].push(assignment);
        return acc;
      }, {});

      Object.entries(siteGroups).forEach(([siteName, assignments]) => {
        console.log(`   🏗️ ${siteName}:`);
        assignments.forEach(assignment => {
          console.log(`      - ${assignment.profiles.full_name} (${assignment.profiles.role}) [${assignment.assigned_date}부터]`);
        });
      });
    }

    // 5. 데이터 통계
    console.log('\n📊 데이터 통계:');
    
    const stats = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact' }),
      supabase.from('sites').select('*', { count: 'exact' }).eq('status', 'active'),
      supabase.from('site_assignments').select('*', { count: 'exact' }).eq('is_active', true),
      supabase.from('attendance_records').select('*', { count: 'exact' }).gte('work_date', sevenDaysAgo),
      supabase.from('daily_reports').select('*', { count: 'exact' }).gte('work_date', sevenDaysAgo)
    ]);

    console.log(`   - 총 사용자: ${stats[0].count}명`);
    console.log(`   - 활성 현장: ${stats[1].count}개`);
    console.log(`   - 현장 배정: ${stats[2].count}건`);
    console.log(`   - 최근 출근 기록: ${stats[3].count}건 (최근 7일)`);
    console.log(`   - 최근 작업일지: ${stats[4].count}건 (최근 7일)`);

    console.log('\n🎉 현실적인 데이터 검증 완료!');
    console.log('\n📱 이제 모바일 앱에서 다음을 확인할 수 있습니다:');
    console.log('   • 현실적인 한국어 작업자 이름 (김철수, 유현석 등)');
    console.log('   • 실제 출근 패턴 (정상, 반일, 연장근무)');  
    console.log('   • 건설 공정에 맞는 작업일지 (슬라브 타설, 기둥 배근 등)');
    console.log('   • NPC-1000 자재 사용량 데이터');
    console.log('   • 현장별 작업자 배정 현황');

  } catch (error) {
    console.error('❌ 검증 실패:', error);
  }
}

verifyRealisticData();