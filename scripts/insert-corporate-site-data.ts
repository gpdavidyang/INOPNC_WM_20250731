const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertCorporateSiteData() {
  console.log('🏭 대기업 현장 데이터 생성 시작...\n');
  
  try {
    // 대기업 현장 정보 조회
    const corporateSites = [
      {
        name: 'LG에너지솔루션 오창공장',
        id: 'c27f6468-0947-4a3c-9bcc-5d31ef5b67b0',
        company: 'LG에너지솔루션',
        type: '배터리 제조'
      },
      {
        name: 'SK하이닉스 이천 M16',
        id: '5c8da58c-7c00-4244-abee-68f04d288d1a',
        company: 'SK하이닉스',
        type: '반도체 제조'
      },
      {
        name: '삼성전자 평택캠퍼스 P3',
        id: '7160ea44-b7f6-43d1-a4a2-a3905d5da9d2',
        company: '삼성전자',
        type: '반도체 제조'
      },
      {
        name: '포스코 광양제철소 고로 개수',
        id: '1e9e2484-86c2-487d-9d73-59aaa5046818',
        company: '포스코',
        type: '철강 제조'
      },
      {
        name: '현대자동차 울산공장 증축',
        id: '258dec0d-7911-4ccb-9a9f-6d149a04d8bd',
        company: '현대자동차',
        type: '자동차 제조'
      }
    ];

    // 기존 사용자 정보 조회 (작업자, 현장관리자)
    const { data: existingUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('role', ['worker', 'site_manager']);

    if (usersError) throw usersError;

    console.log('👥 기존 사용자 목록:');
    existingUsers?.forEach(user => {
      console.log(`   - ${user.full_name} (${user.email}) - ${user.role}`);
    });

    // 각 대기업 현장별로 데이터 생성
    for (const site of corporateSites) {
      console.log(`\n🏗️ ${site.name} 데이터 생성...`);
      
      // 1. 사이트 배정 (기존 사용자들을 현장에 배정)
      const siteAssignments = existingUsers?.slice(0, 3).map(user => ({
        user_id: user.id,
        site_id: site.id,
        assigned_date: new Date().toISOString().split('T')[0],
        is_active: true
      }));

      if (siteAssignments && siteAssignments.length > 0) {
        const { error: assignmentError } = await supabase
          .from('site_assignments')
          .upsert(siteAssignments, { onConflict: 'user_id,site_id' });
        
        if (assignmentError) {
          console.error(`   ❌ 사이트 배정 오류: ${assignmentError.message}`);
        } else {
          console.log(`   ✅ 사이트 배정 완료: ${siteAssignments.length}명`);
        }
      }

      // 2. 작업일지 생성 (최근 2주간)
      const dailyReports = [];
      const today = new Date();
      
      for (let i = 0; i < 14; i++) {
        const workDate = new Date(today);
        workDate.setDate(today.getDate() - i);
        const dateStr = workDate.toISOString().split('T')[0];
        
        // 주말 제외 (토요일=6, 일요일=0)
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;
        
        const processes = {
          'LG에너지솔루션': ['배터리셀 조립', '품질검사', '포장작업'],
          'SK하이닉스': ['웨이퍼 가공', '패키징', '테스트'],
          '삼성전자': ['반도체 식각', '증착공정', '검사'],
          '포스코': ['고로 정비', '내화물 설치', '안전점검'],
          '현대자동차': ['건축공사', '설비설치', '배관작업']
        }[site.company] || ['일반 작업'];

        const randomProcess = processes[Math.floor(Math.random() * processes.length)];
        const workerNames = ['김철수', '이영희', '박민수', '정수연', '최동호'];
        const randomWorker = workerNames[Math.floor(Math.random() * workerNames.length)];
        
        dailyReports.push({
          site_id: site.id,
          work_date: dateStr,
          member_name: randomWorker,
          process_type: randomProcess,
          total_workers: Math.floor(Math.random() * 8) + 3, // 3-10명
          issues: Math.random() > 0.7 ? '경미한 지연 발생' : null,
          status: ['draft', 'submitted'][Math.floor(Math.random() * 2)],
          created_by: existingUsers?.[0]?.id || null
        });
      }

      if (dailyReports.length > 0) {
        const { error: reportsError } = await supabase
          .from('daily_reports')
          .insert(dailyReports);
        
        if (reportsError) {
          console.error(`   ❌ 작업일지 생성 오류: ${reportsError.message}`);
        } else {
          console.log(`   ✅ 작업일지 생성 완료: ${dailyReports.length}건`);
        }
      }

      // 3. 출근 기록 생성
      const attendanceRecords = [];
      
      for (let i = 0; i < 10; i++) {
        const workDate = new Date(today);
        workDate.setDate(today.getDate() - i);
        const dateStr = workDate.toISOString().split('T')[0];
        
        // 주말 제외
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;
        
        // 배정된 사용자들의 출근 기록 생성
        siteAssignments?.forEach(assignment => {
          const workHours = Math.random() > 0.1 ? 8 + Math.random() * 2 : 0; // 90% 출근
          const laborHours = workHours / 8; // 1.0 공수 = 8시간
          
          if (workHours > 0) {
            attendanceRecords.push({
              user_id: assignment.user_id,
              site_id: site.id,
              work_date: dateStr,
              check_in_time: '08:00:00',
              check_out_time: workHours >= 8 ? '17:00:00' : '13:00:00',
              status: 'present',
              work_hours: Math.round(workHours * 10) / 10,
              overtime_hours: workHours > 8 ? Math.round((workHours - 8) * 10) / 10 : 0,
              labor_hours: Math.round(laborHours * 10) / 10,
              notes: `${site.company} 정상 출근`,
              created_at: new Date().toISOString()
            });
          }
        });
      }

      if (attendanceRecords.length > 0) {
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .upsert(attendanceRecords, { 
            onConflict: 'user_id,work_date',
            ignoreDuplicates: false 
          });
        
        if (attendanceError) {
          console.error(`   ❌ 출근 기록 생성 오류: ${attendanceError.message}`);
        } else {
          console.log(`   ✅ 출근 기록 생성 완료: ${attendanceRecords.length}건`);
        }
      }

      // 4. 알림 생성 (현장별 공지사항)
      const notifications = existingUsers?.slice(0, 2).map(user => ({
        user_id: user.id,
        type: 'info',
        title: `${site.company} 현장 배정 안내`,
        message: `${site.name}에 배정되셨습니다. 현장 안전수칙을 준수해 주시기 바랍니다.`,
        is_read: Math.random() > 0.5,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));

      if (notifications && notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notifError) {
          console.error(`   ❌ 알림 생성 오류: ${notifError.message}`);
        } else {
          console.log(`   ✅ 알림 생성 완료: ${notifications.length}건`);
        }
      }
    }

    console.log('\n🎉 대기업 현장 데이터 생성 완료!');
    console.log('\n📊 생성된 데이터 요약:');
    console.log('   - 현장: 5개 (LG, SK, 삼성, 포스코, 현대)');
    console.log('   - 사이트 배정: 각 현장당 3명');
    console.log('   - 작업일지: 각 현장당 약 10건 (평일만)');
    console.log('   - 출근기록: 각 현장당 약 30건');
    console.log('   - 알림: 각 현장당 2건');

  } catch (error) {
    console.error('❌ 전체 오류:', error.message);
  }
}

insertCorporateSiteData();