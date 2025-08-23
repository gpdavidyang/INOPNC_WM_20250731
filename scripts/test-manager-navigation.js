#!/usr/bin/env node

/**
 * 현장 관리자 네비게이션 수동 테스트 스크립트
 * manager@inopnc.com 계정의 네비게이션 요소를 확인합니다
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjtnpscnnsnvfsyvajku.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'
);

async function testManagerNavigation() {
  console.log('🧪 현장 관리자 네비게이션 테스트 시작\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. manager@inopnc.com 프로필 확인
    console.log('\n1️⃣ 현장 관리자 계정 정보 확인');
    console.log('-'.repeat(40));
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'manager@inopnc.com')
      .single();
    
    if (profileError) {
      console.error('❌ 프로필 조회 실패:', profileError);
      return;
    }
    
    if (!profile) {
      console.error('❌ manager@inopnc.com 계정을 찾을 수 없습니다');
      return;
    }
    
    console.log('✅ 계정 정보:');
    console.log('  • ID:', profile.id);
    console.log('  • 이메일:', profile.email);
    console.log('  • 이름:', profile.full_name);
    console.log('  • 역할:', profile.role);
    console.log('  • 상태:', profile.status);
    
    // 2. 사이트 할당 확인
    console.log('\n2️⃣ 할당된 현장 정보 확인');
    console.log('-'.repeat(40));
    
    const { data: siteAssignments, error: siteError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          id,
          name,
          address,
          status
        )
      `)
      .eq('user_id', profile.id)
      .is('unassigned_date', null);
    
    if (siteError) {
      console.log('⚠️ site_assignments 테이블 조회 실패, site_memberships 시도...');
      
      // site_memberships 테이블 시도
      const { data: siteMemberships, error: memberError } = await supabase
        .from('site_memberships')
        .select(`
          *,
          sites (
            id,
            name,
            address,
            status
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'active');
      
      if (memberError) {
        console.error('❌ 사이트 정보 조회 실패:', memberError);
      } else if (siteMemberships && siteMemberships.length > 0) {
        console.log('✅ 할당된 현장 (site_memberships):');
        siteMemberships.forEach(membership => {
          console.log(`  • ${membership.sites?.name || '알 수 없음'}`);
          console.log(`    - 주소: ${membership.sites?.address || 'N/A'}`);
          console.log(`    - 역할: ${membership.role}`);
          console.log(`    - 상태: ${membership.status}`);
        });
      } else {
        console.log('⚠️ 할당된 현장이 없습니다');
      }
    } else if (siteAssignments && siteAssignments.length > 0) {
      console.log('✅ 할당된 현장 (site_assignments):');
      siteAssignments.forEach(assignment => {
        console.log(`  • ${assignment.sites?.name || '알 수 없음'}`);
        console.log(`    - 주소: ${assignment.sites?.address || 'N/A'}`);
        console.log(`    - 역할: ${assignment.role}`);
        console.log(`    - 할당일: ${assignment.assigned_date}`);
      });
    } else {
      console.log('⚠️ 할당된 현장이 없습니다');
    }
    
    // 3. 네비게이션 메뉴 구조 확인
    console.log('\n3️⃣ 예상 네비게이션 메뉴 구조');
    console.log('-'.repeat(40));
    
    if (profile.role === 'site_manager') {
      console.log('✅ 현장 관리자 메뉴 (Desktop - 사이드바):');
      console.log('  • 홈 (/dashboard)');
      console.log('  • 출근현황 (/dashboard/attendance)');
      console.log('  • 작업일지 (/dashboard/daily-reports)');
      console.log('  • 현장정보 (/dashboard/site-info)');
      console.log('  • 문서함 (/dashboard/documents)');
      console.log('  • 자재관리 (/dashboard/materials)');
      console.log('  • 알림 (/dashboard/notifications)');
      console.log('  • 내정보 (/dashboard/profile)');
      console.log('  • 설정 (/dashboard/settings)');
      
      console.log('\n✅ 현장 관리자 메뉴 (Mobile - 하단바):');
      console.log('  • 홈 (홈 아이콘)');
      console.log('  • 출근현황 (달력 아이콘)');
      console.log('  • 작업일지 (문서 아이콘)');
      console.log('  • 문서함 (폴더 아이콘)');
      console.log('  • 내정보 (사용자 아이콘)');
    } else {
      console.log('⚠️ 역할이 site_manager가 아닙니다:', profile.role);
    }
    
    // 4. 접근 권한 확인
    console.log('\n4️⃣ 데이터 접근 권한 확인');
    console.log('-'.repeat(40));
    
    // 작업일지 접근 테스트
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('id, report_date, site_id')
      .eq('created_by', profile.id)
      .limit(3);
    
    if (reportsError) {
      console.log('❌ 작업일지 접근 실패:', reportsError.message);
    } else {
      console.log(`✅ 작업일지 접근 가능 (${reports?.length || 0}개 조회)`);
    }
    
    // 출근 기록 접근 테스트
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id, date, status')
      .eq('user_id', profile.id)
      .limit(3);
    
    if (attendanceError) {
      console.log('❌ 출근기록 접근 실패:', attendanceError.message);
    } else {
      console.log(`✅ 출근기록 접근 가능 (${attendance?.length || 0}개 조회)`);
    }
    
    // 문서 접근 테스트
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title')
      .limit(3);
    
    if (docsError) {
      console.log('❌ 문서함 접근 실패:', docsError.message);
    } else {
      console.log(`✅ 문서함 접근 가능 (${documents?.length || 0}개 조회)`);
    }
    
    // 5. 테스트 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(50));
    
    console.log('\n🌐 웹 브라우저 테스트 방법:');
    console.log('  1. http://localhost:3000/auth/login 접속');
    console.log('  2. manager@inopnc.com / password123 로그인');
    console.log('  3. 데스크톱 사이드바 메뉴 확인');
    console.log('  4. 브라우저 창 크기를 모바일로 줄여서 하단바 확인');
    console.log('  5. 각 메뉴 클릭하여 페이지 이동 확인');
    
    console.log('\n✅ 확인 사항:');
    console.log('  • 사이드바가 왼쪽에 고정되어 표시되는가?');
    console.log('  • 모바일에서 하단바가 표시되는가?');
    console.log('  • 햄버거 메뉴 버튼이 작동하는가?');
    console.log('  • 메뉴 클릭 시 올바른 페이지로 이동하는가?');
    console.log('  • 현재 페이지 메뉴가 활성 상태로 표시되는가?');
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error.message);
  }
}

// 스크립트 실행
testManagerNavigation().then(() => {
  console.log('\n✨ 테스트 스크립트 완료\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});