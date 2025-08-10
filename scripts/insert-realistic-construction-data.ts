#!/usr/bin/env tsx

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertRealisticConstructionData() {
  console.log('🏗️ 현실적인 건설 데이터 삽입 시작...\n');
  
  try {
    // 1. Update existing users with realistic Korean names
    console.log('👥 사용자 프로필 업데이트...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role');
    
    if (profilesError) throw profilesError;
    
    // Update existing users with realistic Korean names
    const profileUpdates = [
      { email: 'worker@inopnc.com', full_name: '김철수', phone: '010-1234-5678' },
      { email: 'manager@inopnc.com', full_name: '이현수', phone: '010-2345-6789' },
      { email: 'admin@inopnc.com', full_name: '박관리', phone: '010-3456-7890' },
      { email: 'customer@inopnc.com', full_name: '최고객', phone: '010-4567-8901' },
      { email: 'production@inopnc.com', full_name: '유현석', phone: '010-5678-9012' }
    ];
    
    for (const update of profileUpdates) {
      const profile = profiles?.find(p => p.email === update.email);
      if (profile) {
        await supabase
          .from('profiles')
          .update({
            full_name: update.full_name,
            phone: update.phone
          })
          .eq('email', update.email);
        console.log(`   ✅ ${update.email} → ${update.full_name}`);
      }
    }
    
    // 2. Get all active sites for assignments
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active');
    
    if (sitesError) throw sitesError;
    console.log(`\n🏗️ 활성 현장: ${sites?.length}개`);
    
    // 3. Create realistic site assignments
    console.log('\n📋 현장 배정 생성...');
    
    const assignments = [];
    const workers = profiles?.filter(p => ['worker', 'site_manager'].includes(p.role)) || [];
    
    // Assign workers to multiple sites
    for (const worker of workers) {
      // Each worker gets assigned to 3-5 sites randomly
      const numAssignments = Math.floor(Math.random() * 3) + 3;
      const assignedSites = sites?.sort(() => 0.5 - Math.random()).slice(0, numAssignments) || [];
      
      for (const site of assignedSites) {
        assignments.push({
          site_id: site.id,
          user_id: worker.id,
          assigned_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          role: worker.role === 'site_manager' ? 'site_manager' : 'worker',
          is_active: true
        });
      }
    }
    
    if (assignments.length > 0) {
      const { error: assignmentError } = await supabase
        .from('site_assignments')
        .upsert(assignments, { onConflict: 'site_id,user_id' });
      
      if (assignmentError) {
        console.log('⚠️ 일부 배정 실패 (중복 가능성):', assignmentError.message);
      } else {
        console.log(`   ✅ ${assignments.length}개 현장 배정 완료`);
      }
    }
    
    // 4. Create realistic attendance records
    console.log('\n📅 출근 기록 생성...');
    
    const attendanceRecords = [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    
    for (const worker of workers) {
      for (const date of last7Days) {
        // 80% chance of attendance
        if (Math.random() > 0.2) {
          const workerSites = assignments.filter(a => a.user_id === worker.id);
          if (workerSites.length > 0) {
            const randomSite = workerSites[Math.floor(Math.random() * workerSites.length)];
            
            // Realistic work patterns
            const workPattern = Math.random();
            let labor_hours, work_hours, overtime_hours = 0;
            
            if (workPattern < 0.75) {
              // Normal work day
              labor_hours = 1.0;
              work_hours = 8;
            } else if (workPattern < 0.85) {
              // Overtime
              labor_hours = 1.25;
              work_hours = 8;
              overtime_hours = 2;
            } else {
              // Half day
              labor_hours = 0.5;
              work_hours = 4;
            }
            
            attendanceRecords.push({
              user_id: worker.id,
              site_id: randomSite.site_id,
              work_date: date,
              check_in_time: '08:00:00',
              check_out_time: work_hours === 8 ? '17:00:00' : (work_hours === 10 ? '19:00:00' : '12:00:00'),
              work_hours,
              overtime_hours,
              labor_hours,
              status: 'present'
            });
          }
        }
      }
    }
    
    if (attendanceRecords.length > 0) {
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .upsert(attendanceRecords, { onConflict: 'user_id,work_date' });
      
      if (attendanceError) {
        console.log('⚠️ 일부 출근기록 실패:', attendanceError.message);
      } else {
        console.log(`   ✅ ${attendanceRecords.length}개 출근 기록 생성`);
      }
    }
    
    // 5. Create realistic daily reports
    console.log('\n📝 작업일지 생성...');
    
    const dailyReports = [];
    const memberTypes = ['슬라브', '기둥', '벽체', '보', '계단', '발코니'];
    const processTypes = ['타설', '양생', '균열검사', '면처리', '배근', '결속', '거푸집'];
    const workLocations = ['지하1층', '1층', '2층', '3층', '4층', '옥상', 'B동', 'C동'];
    
    for (let i = 0; i < 15; i++) {
      const randomSite = sites?.[Math.floor(Math.random() * sites.length)];
      const randomWorker = workers[Math.floor(Math.random() * workers.length)];
      const workDate = last7Days[Math.floor(Math.random() * last7Days.length)];
      
      // Count actual workers assigned to this site
      const siteWorkers = assignments.filter(a => a.site_id === randomSite?.id && a.is_active);
      
      dailyReports.push({
        site_id: randomSite?.id,
        work_date: workDate,
        member_name: memberTypes[Math.floor(Math.random() * memberTypes.length)],
        process_type: processTypes[Math.floor(Math.random() * processTypes.length)],
        work_location: workLocations[Math.floor(Math.random() * workLocations.length)],
        total_workers: siteWorkers.length || Math.floor(Math.random() * 5) + 3,
        npc1000_incoming: Math.floor(Math.random() * 100) + 50,
        npc1000_used: Math.floor(Math.random() * 80) + 20,
        npc1000_remaining: Math.floor(Math.random() * 50) + 10,
        status: Math.random() > 0.3 ? 'submitted' : 'draft',
        created_by: randomWorker.id
      });
    }
    
    if (dailyReports.length > 0) {
      const { error: reportsError } = await supabase
        .from('daily_reports')
        .upsert(dailyReports, { onConflict: 'site_id,work_date' });
      
      if (reportsError) {
        console.log('⚠️ 일부 작업일지 실패:', reportsError.message);
      } else {
        console.log(`   ✅ ${dailyReports.length}개 작업일지 생성`);
      }
    }
    
    console.log('\n✨ 현실적인 건설 데이터 삽입 완료!');
    console.log('💡 이제 UI에서 실제 한국식 이름과 현장 정보를 확인할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

if (require.main === module) {
  insertRealisticConstructionData();
}

export { insertRealisticConstructionData };