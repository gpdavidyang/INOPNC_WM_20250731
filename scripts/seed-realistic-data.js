#!/usr/bin/env node

/**
 * 현실적인 건설 현장 데이터 시딩 스크립트
 * Usage: node scripts/seed-realistic-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 현실적인 작업자 데이터
const WORKERS = [
  { id: '22222222-2222-2222-2222-222222222222', email: 'kim.worker@inopnc.com', full_name: '김철수', phone: '010-1111-2222', role: 'worker' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'lee.worker@inopnc.com', full_name: '이영호', phone: '010-2222-3333', role: 'worker' },
  { id: '44444444-4444-4444-4444-444444444444', email: 'park.worker@inopnc.com', full_name: '박민수', phone: '010-3333-4444', role: 'worker' },
  { id: '55555555-5555-5555-5555-555555555555', email: 'choi.worker@inopnc.com', full_name: '최성훈', phone: '010-4444-5555', role: 'worker' },
  { id: '66666666-6666-6666-6666-666666666666', email: 'jung.worker@inopnc.com', full_name: '정대현', phone: '010-5555-6666', role: 'worker' },
  { id: '77777777-7777-7777-7777-777777777777', email: 'han.worker@inopnc.com', full_name: '한지민', phone: '010-6666-7777', role: 'worker' },
  { id: '88888888-8888-8888-8888-888888888888', email: 'song.worker@inopnc.com', full_name: '송준호', phone: '010-7777-8888', role: 'worker' },
  { id: '99999999-9999-9999-9999-999999999999', email: 'yoo.manager@inopnc.com', full_name: '유현석', phone: '010-8888-9999', role: 'site_manager' },
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', email: 'lim.manager@inopnc.com', full_name: '임재현', phone: '010-9999-0000', role: 'site_manager' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', email: 'jang.manager@inopnc.com', full_name: '장혜진', phone: '010-0000-1111', role: 'site_manager' }
];

// 현장별 작업자 배정
const SITE_ASSIGNMENTS = [
  // 강남 A현장 (김철수, 이영호, 박민수 + 유현석 관리자)
  { siteName: '강남 A현장', workerIds: ['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'], managerId: '99999999-9999-9999-9999-999999999999' },
  // 송파 B현장 (최성훈, 정대현 + 임재현 관리자)
  { siteName: '송파 B현장', workerIds: ['55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666'], managerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
  // 송파 C현장 (한지민, 송준호 + 장혜진 관리자)
  { siteName: '송파 C현장', workerIds: ['77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888'], managerId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }
];

async function seedRealisticData() {
  console.log('🚀 현실적인 건설 현장 데이터 시딩 시작...');
  
  try {
    // 1. 프로필 데이터 생성/업데이트
    console.log('👥 작업자 프로필 생성 중...');
    
    for (const worker of WORKERS) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          ...worker,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        console.warn(`⚠️  프로필 생성 실패 (${worker.full_name}):`, error.message);
      } else {
        console.log(`✅ ${worker.full_name} 프로필 생성 완료`);
      }
    }

    // 2. 현장 정보 조회
    console.log('🏗️  현장 정보 조회 중...');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .in('name', ['강남 A현장', '송파 B현장', '송파 C현장']);

    if (sitesError) {
      throw new Error(`현장 정보 조회 실패: ${sitesError.message}`);
    }

    if (!sites || sites.length === 0) {
      throw new Error('현장 정보가 없습니다. 먼저 현장 데이터를 생성해주세요.');
    }

    console.log(`📍 ${sites.length}개 현장 발견:`, sites.map(s => s.name).join(', '));

    // 3. 현장 배정
    console.log('📋 현장 배정 중...');
    
    for (const assignment of SITE_ASSIGNMENTS) {
      const site = sites.find(s => s.name === assignment.siteName);
      if (!site) {
        console.warn(`⚠️  현장을 찾을 수 없음: ${assignment.siteName}`);
        continue;
      }

      // 작업자들 배정
      for (const workerId of assignment.workerIds) {
        const { data, error } = await supabase
          .from('site_assignments')
          .upsert({
            site_id: site.id,
            user_id: workerId,
            assigned_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30일 전
            role: 'worker',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'site_id,user_id'
          });

        if (error) {
          console.warn(`⚠️  작업자 배정 실패 (${workerId} -> ${assignment.siteName}):`, error.message);
        }
      }

      // 관리자 배정
      const { data, error } = await supabase
        .from('site_assignments')
        .upsert({
          site_id: site.id,
          user_id: assignment.managerId,
          assigned_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          role: 'site_manager',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'site_id,user_id'
        });

      if (error) {
        console.warn(`⚠️  관리자 배정 실패 (${assignment.managerId} -> ${assignment.siteName}):`, error.message);
      } else {
        console.log(`✅ ${assignment.siteName} 팀 구성 완료 (작업자 ${assignment.workerIds.length}명 + 관리자 1명)`);
      }
    }

    // 4. 출근 기록 생성 (최근 30일)
    console.log('⏰ 출근 기록 생성 중...');
    
    for (const assignment of SITE_ASSIGNMENTS) {
      const site = sites.find(s => s.name === assignment.siteName);
      if (!site) continue;

      const allWorkers = [...assignment.workerIds, assignment.managerId];
      
      for (const workerId of allWorkers) {
        let recordsCreated = 0;
        
        for (let i = 0; i < 30; i++) {
          const workDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          
          // 주말 제외
          if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;
          
          // 현실적인 근무 패턴
          const randomValue = Math.random();
          let laborHours, status, notes, checkInTime, checkOutTime;
          
          if (randomValue < 0.1) { // 10% 반일
            laborHours = 0.5;
            status = 'half_day';
            notes = '반일 근무';
            checkInTime = '08:00:00';
            checkOutTime = '12:00:00';
          } else if (randomValue < 0.2) { // 10% 연장
            laborHours = 1.25;
            status = 'present';
            notes = '연장 근무';
            checkInTime = '08:00:00';
            checkOutTime = '18:00:00';
          } else { // 80% 정상
            laborHours = 1.0;
            status = 'present';
            notes = '정상 근무';
            checkInTime = '08:00:00';
            checkOutTime = '17:00:00';
          }

          const { data, error } = await supabase
            .from('attendance_records')
            .upsert({
              user_id: workerId,
              site_id: site.id,
              work_date: workDate.toISOString().split('T')[0],
              check_in_time: checkInTime,
              check_out_time: checkOutTime,
              status: status,
              labor_hours: laborHours,
              work_hours: laborHours * 8,
              notes: notes,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,work_date'
            });

          if (!error) {
            recordsCreated++;
          }
        }
        
        const worker = WORKERS.find(w => w.id === workerId);
        console.log(`  📅 ${worker?.full_name || workerId}: ${recordsCreated}일 출근 기록 생성`);
      }
    }

    // 5. 작업일지 생성 (최근 15일)
    console.log('📝 작업일지 생성 중...');
    
    const memberNames = ['슬라브', '기둥', '벽체', '보'];
    const processTypes = ['균열', '면', '타설', '양생', '배근', '결속', '거푸집설치', '해체'];
    
    for (const assignment of SITE_ASSIGNMENTS) {
      const site = sites.find(s => s.name === assignment.siteName);
      if (!site) continue;

      let reportsCreated = 0;
      
      for (let i = 0; i < 15; i++) {
        const workDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        
        // 주말 제외
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;
        
        const memberName = memberNames[Math.floor(Math.random() * memberNames.length)];
        const processType = processTypes[Math.floor(Math.random() * processTypes.length)];
        const totalWorkers = assignment.workerIds.length;
        
        // NPC1000 데이터 (타설/양생 시에만)
        const hasNpcData = processType === '타설' || processType === '양생';
        const npcIncoming = hasNpcData ? Math.floor(Math.random() * 50 + 10) : 0;
        const npcUsed = hasNpcData ? Math.floor(Math.random() * 30 + 5) : 0;
        const npcRemaining = hasNpcData ? Math.floor(Math.random() * 20 + 5) : 0;
        
        // 가끔 이슈 발생
        const issues = Math.random() < 0.2 ? 
          ['날씨로 인한 작업 지연', '자재 배송 지연', '장비 점검 필요', '안전 점검 실시'][Math.floor(Math.random() * 4)] : 
          null;

        const { data, error } = await supabase
          .from('daily_reports')
          .upsert({
            site_id: site.id,
            work_date: workDate.toISOString().split('T')[0],
            member_name: memberName,
            process_type: processType,
            total_workers: totalWorkers,
            npc1000_incoming: npcIncoming || null,
            npc1000_used: npcUsed || null,
            npc1000_remaining: npcRemaining || null,
            issues: issues,
            status: 'submitted',
            created_by: assignment.managerId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'site_id,work_date,member_name,process_type'
          });

        if (!error) {
          reportsCreated++;
        }
      }
      
      console.log(`  📋 ${assignment.siteName}: ${reportsCreated}개 작업일지 생성`);
    }

    // 6. 알림 생성
    console.log('🔔 알림 생성 중...');
    
    const notifications = [];
    
    // 작업자들에게 작업 지시 알림
    for (const worker of WORKERS.filter(w => w.role === 'worker')) {
      notifications.push({
        user_id: worker.id,
        title: '새로운 작업 지시',
        message: '오늘 작업 일지를 작성해주세요.',
        type: 'info',
        is_read: Math.random() < 0.7, // 70% 확률로 읽음
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // 관리자들에게 검토 알림
    for (const manager of WORKERS.filter(w => w.role === 'site_manager')) {
      notifications.push({
        user_id: manager.id,
        title: '작업 일지 검토',
        message: '새로운 작업 일지가 제출되었습니다.',
        type: 'warning',
        is_read: Math.random() < 0.5, // 50% 확률로 읽음
        created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .upsert(notifications);

    if (notifError) {
      console.warn('⚠️  알림 생성 실패:', notifError.message);
    } else {
      console.log(`✅ ${notifications.length}개 알림 생성 완료`);
    }

    // 7. 결과 요약
    console.log('\n📊 데이터 시딩 결과 요약');
    console.log('='.repeat(50));
    
    // 프로필 카운트
    const { data: profileCount } = await supabase
      .from('profiles')
      .select('role', { count: 'exact' })
      .in('id', WORKERS.map(w => w.id));

    console.log(`👥 프로필: ${WORKERS.length}명 (작업자 ${WORKERS.filter(w => w.role === 'worker').length}명, 관리자 ${WORKERS.filter(w => w.role === 'site_manager').length}명)`);

    // 현장 배정 카운트
    const { data: assignmentCount } = await supabase
      .from('site_assignments')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    console.log(`📋 현장 배정: ${assignmentCount?.length || 0}건`);

    // 출근 기록 카운트 (최근 30일)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: attendanceCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact' })
      .gte('work_date', thirtyDaysAgo);

    console.log(`⏰ 출근 기록: ${attendanceCount?.length || 0}건 (최근 30일)`);

    // 작업일지 카운트 (최근 15일)
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: reportCount } = await supabase
      .from('daily_reports')
      .select('*', { count: 'exact' })
      .gte('work_date', fifteenDaysAgo);

    console.log(`📝 작업일지: ${reportCount?.length || 0}건 (최근 15일)`);
    
    console.log('\n🎉 현실적인 건설 현장 데이터 시딩 완료!');
    console.log('\n📱 이제 모바일 앱에서 실제 작업자 이름과 데이터를 확인할 수 있습니다:');
    console.log('   • 작업자: 김철수, 이영호, 박민수, 최성훈, 정대현, 한지민, 송준호');
    console.log('   • 관리자: 유현석, 임재현, 장혜진');
    console.log('   • 현장: 강남 A현장, 송파 B현장, 송파 C현장');
    
  } catch (error) {
    console.error('❌ 데이터 시딩 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  seedRealisticData();
}