const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 날짜 계산 헬퍼 함수
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 작업 내용 템플릿
const WORK_DESCRIPTIONS = [
  {
    title: '콘크리트 타설 작업',
    content: '기초 콘크리트 타설 및 양생 작업. 슬럼프 테스트 실시.',
    workers: 8
  },
  {
    title: '철근 배근 작업',
    content: '벽체 및 슬라브 철근 배근. 피복 두께 확인 및 결속 작업.',
    workers: 10
  },
  {
    title: '거푸집 설치',
    content: '벽체 거푸집 설치 및 수직/수평 정밀도 확인.',
    workers: 6
  },
  {
    title: '전기 배관 작업',
    content: '전기 배관 매립 및 박스 설치. 절연 저항 측정.',
    workers: 5
  },
  {
    title: '배관 설비 작업',
    content: '급수/배수 배관 설치 및 압력 테스트.',
    workers: 7
  },
  {
    title: '방수 작업',
    content: '지하층 외벽 방수 및 보호층 시공.',
    workers: 4
  },
  {
    title: '타일 시공',
    content: '화장실 및 주방 타일 시공. 줄눈 작업 포함.',
    workers: 5
  },
  {
    title: '도장 작업',
    content: '내부 벽체 도장 및 마감 작업.',
    workers: 6
  },
  {
    title: '단열재 시공',
    content: '외벽 단열재 부착 및 마감 몰탈 작업.',
    workers: 8
  },
  {
    title: '미장 작업',
    content: '내부 벽체 미장 및 평활도 작업.',
    workers: 7
  }
];

async function assignWorkerToSites() {
  try {
    console.log('🚀 작업자 현장 배정 데이터 생성 시작...\n');

    // 1. worker@inopnc.com 사용자 찾기
    const { data: workerUser } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', 'worker@inopnc.com')
      .single();

    if (!workerUser) {
      console.error('❌ worker@inopnc.com 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log(`👷 작업자 확인: ${workerUser.full_name} (${workerUser.email})\n`);

    // 2. 다른 작업자들도 조회 (팀 구성을 위해)
    const { data: otherWorkers } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['worker', 'site_manager'])
      .neq('id', workerUser.id)
      .limit(15);

    // 3. 활성 현장 조회
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name, address')
      .eq('status', 'active')
      .limit(3);

    if (!sites || sites.length === 0) {
      console.error('❌ 활성 현장이 없습니다.');
      return;
    }

    console.log(`🏗️ 현장 ${sites.length}개 발견:\n`);
    sites.forEach(site => {
      console.log(`  - ${site.name}: ${site.address}`);
    });
    console.log('');

    // 4. 날짜 범위 설정 (과거 2개월 ~ 앞으로 1개월)
    const today = new Date();
    const twoMonthsAgo = addDays(today, -60);
    const oneMonthLater = addDays(today, 30);

    // 5. site_assignments 테이블에 배정 데이터 추가
    console.log('📋 현장 배정 생성 중...\n');
    
    let assignmentCount = 0;
    for (const site of sites) {
      // 각 현장에 대해 기간별로 배정
      const assignmentPeriods = [
        {
          assigned_date: formatDate(addDays(today, -60)),
          unassigned_date: formatDate(addDays(today, -30)),
          is_active: false,
          description: '1차 공사 - 기초 및 골조 작업'
        },
        {
          assigned_date: formatDate(addDays(today, -29)),
          unassigned_date: formatDate(addDays(today, -5)),
          is_active: false,
          description: '2차 공사 - 설비 및 전기 작업'
        },
        {
          assigned_date: formatDate(addDays(today, -4)),
          unassigned_date: null,
          is_active: true,
          description: '3차 공사 - 마감 작업 진행중'
        }
      ];

      for (const period of assignmentPeriods) {
        // worker@inopnc.com 배정
        const { error: assignError } = await supabase
          .from('site_assignments')
          .upsert({
            user_id: workerUser.id,
            site_id: site.id,
            role: 'worker',
            assigned_date: period.assigned_date,
            unassigned_date: period.unassigned_date,
            is_active: period.is_active
          }, {
            onConflict: 'user_id,site_id',
            ignoreDuplicates: false
          });

        if (!assignError) {
          assignmentCount++;
          console.log(`✅ 배정 ${assignmentCount}: ${workerUser.full_name} → ${site.name} (${period.description})`);
        }

        // 다른 팀원들도 같은 현장에 배정 (팀 작업 시뮬레이션)
        if (otherWorkers && period.is_active) {
          for (const worker of otherWorkers.slice(0, 5)) {
            await supabase
              .from('site_assignments')
              .upsert({
                user_id: worker.id,
                site_id: site.id,
                role: worker.role,
                assigned_date: period.assigned_date,
                unassigned_date: period.unassigned_date,
                is_active: period.is_active
              }, {
                onConflict: 'user_id,site_id',
                ignoreDuplicates: false
              });
          }
        }
      }
    }

    // 6. 출근 기록 생성 (과거 2개월 ~ 오늘)
    console.log('\n⏰ 출근 기록 생성 중...\n');
    
    let attendanceCount = 0;
    const startDate = new Date(twoMonthsAgo);
    const endDate = new Date(today);
    
    // 현재 활성 현장 선택
    const currentSite = sites[0];
    
    for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
      const dayOfWeek = date.getDay();
      
      // 주말 제외 (토요일은 50% 확률로 근무)
      if (dayOfWeek === 0) continue; // 일요일 휴무
      if (dayOfWeek === 6 && Math.random() > 0.5) continue; // 토요일 50% 휴무
      
      // 공휴일 시뮬레이션 (5% 확률)
      if (Math.random() < 0.05) continue;
      
      // 출근 시간 랜덤 설정 (07:00 ~ 08:30)
      const checkInHour = 7 + Math.floor(Math.random() * 1.5);
      const checkInMinute = Math.floor(Math.random() * 60);
      const checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}`;
      
      // 퇴근 시간 랜덤 설정 (17:00 ~ 19:00)
      const checkOutHour = 17 + Math.floor(Math.random() * 2);
      const checkOutMinute = Math.floor(Math.random() * 60);
      const checkOutTime = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}`;
      
      // 공수 계산 (0.5, 1.0, 1.25, 1.5)
      const laborHours = [0.5, 1.0, 1.0, 1.0, 1.0, 1.25, 1.5][Math.floor(Math.random() * 7)];
      
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .upsert({
          user_id: workerUser.id,
          site_id: currentSite.id,
          work_date: formatDate(date),
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          labor_hours: laborHours,
          status: 'present'
        }, {
          onConflict: 'user_id,work_date',
          ignoreDuplicates: false
        });

      if (!attendanceError) {
        attendanceCount++;
        if (attendanceCount % 10 === 0) {
          console.log(`✅ 출근 기록 생성: ${attendanceCount}개`);
        }
      }
    }

    // 7. 작업일지 생성 (주요 날짜에 대해)
    console.log('\n📝 작업일지 생성 중...\n');
    
    let reportCount = 0;
    for (const site of sites) {
      // 최근 30일간 작업일지 생성
      for (let i = 0; i < 30; i++) {
        const reportDate = addDays(today, -i);
        const dayOfWeek = reportDate.getDay();
        
        // 주말 제외
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const workDetail = WORK_DESCRIPTIONS[Math.floor(Math.random() * WORK_DESCRIPTIONS.length)];
        
        const { error: reportError } = await supabase
          .from('daily_reports')
          .insert({
            site_id: site.id,
            work_date: formatDate(reportDate),
            work_content: `${workDetail.title}\n\n${workDetail.content}`,
            created_by: workerUser.id,
            status: i < 5 ? 'draft' : 'submitted',
            total_workers: workDetail.workers + Math.floor(Math.random() * 5),
            total_work_hours: workDetail.workers * 8
          });

        if (!reportError) {
          reportCount++;
          if (reportCount % 10 === 0) {
            console.log(`✅ 작업일지 생성: ${reportCount}개`);
          }
        }
      }
    }

    // 8. 미래 작업 계획 (앞으로 1개월)
    console.log('\n📅 미래 작업 계획 생성 중...\n');
    
    const futurePlans = [];
    for (let i = 1; i <= 30; i++) {
      const futureDate = addDays(today, i);
      const dayOfWeek = futureDate.getDay();
      
      // 주말 제외
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const workDetail = WORK_DESCRIPTIONS[Math.floor(Math.random() * WORK_DESCRIPTIONS.length)];
      futurePlans.push({
        date: formatDate(futureDate),
        site: sites[i % sites.length].name,
        work: workDetail.title,
        workers: workDetail.workers
      });
    }

    // 9. 알림 생성 (현장 배정 관련)
    console.log('\n🔔 알림 생성 중...\n');
    
    const notifications = [
      {
        title: '현장 배정 알림',
        message: `${sites[0].name} 현장에 배정되었습니다. 내일부터 출근해주세요.`,
        type: 'info'
      },
      {
        title: '작업 일정 변경',
        message: '내일 작업 시작 시간이 07:30으로 변경되었습니다.',
        type: 'warning'
      },
      {
        title: '안전 교육 안내',
        message: '이번 주 금요일 14:00 안전 교육이 예정되어 있습니다.',
        type: 'info'
      },
      {
        title: '작업일지 작성 요청',
        message: '어제 작업일지를 작성해 주세요.',
        type: 'warning'
      }
    ];

    for (const notif of notifications) {
      await supabase
        .from('notifications')
        .insert({
          user_id: workerUser.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          is_read: false
        });
    }

    // 10. 결과 요약
    console.log('\n✨ 작업자 현장 배정 데이터 생성 완료!\n');
    console.log('📊 생성된 데이터 요약:');
    console.log(`- 현장 배정: ${assignmentCount}개 (과거/현재/미래)`);
    console.log(`- 출근 기록: ${attendanceCount}개 (과거 2개월)`);
    console.log(`- 작업일지: ${reportCount}개`);
    console.log(`- 알림: ${notifications.length}개`);
    console.log(`- 미래 작업 계획: ${futurePlans.length}일\n`);
    
    console.log('📅 기간별 배정 현황:');
    console.log(`- 과거 (2개월 전 ~ 1개월 전): 1차 공사`);
    console.log(`- 과거 (1개월 전 ~ 5일 전): 2차 공사`);
    console.log(`- 현재 (4일 전 ~ 현재): 3차 공사 진행중`);
    console.log(`- 미래 (내일 ~ 1개월 후): 계획된 작업\n`);
    
    console.log('🎯 테스트 시나리오:');
    console.log('1. worker@inopnc.com으로 로그인');
    console.log('2. 출근 현황에서 과거 2개월 데이터 확인');
    console.log('3. 작업일지에서 작성된 보고서 확인');
    console.log('4. 현장 정보에서 배정된 현장 확인');
    console.log('5. 알림 확인');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
assignWorkerToSites();