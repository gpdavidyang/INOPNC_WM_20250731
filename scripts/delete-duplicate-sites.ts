import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteDuplicateSites() {
  console.log('🗑️ 중복 현장 삭제 시작\n');
  
  // 삭제 안전한 현장들 (연결된 데이터가 없는 것들)
  const sitesToDelete = [
    { id: '00000000-0000-0000-0000-000000000101', name: '강남 A현장' },
    { id: 'a26e7fd4-50f0-4554-bb1b-f512267282bb', name: '강남 A현장' },
    { id: '07df7e5b-168e-48be-950c-023777c96808', name: '서초 B현장' },
    { id: 'bb0db4b9-deba-4b52-8184-ffe75b3e4aa8', name: '송파 C현장' }
  ];
  
  let deletedCount = 0;
  let failedCount = 0;
  
  for (const site of sitesToDelete) {
    console.log(`🔄 삭제 중: ${site.name} (${site.id.substring(0, 8)}...)`);
    
    try {
      // 삭제 전 마지막 확인 - 연결된 데이터 체크
      const { count: totalData } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site.id);
      
      const { count: attendanceData } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site.id);
      
      const { count: assignmentData } = await supabase
        .from('site_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site.id);
      
      const totalConnected = (totalData || 0) + (attendanceData || 0) + (assignmentData || 0);
      
      if (totalConnected > 0) {
        console.log(`   ⚠️  건너뜀: ${totalConnected}개 데이터 연결됨`);
        failedCount++;
        continue;
      }
      
      // 현장 삭제 실행
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', site.id);
      
      if (error) {
        console.log(`   ❌ 삭제 실패: ${error.message}`);
        failedCount++;
      } else {
        console.log(`   ✅ 삭제 완료`);
        deletedCount++;
      }
      
    } catch (error) {
      console.log(`   💥 오류 발생: ${error}`);
      failedCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 삭제 결과:');
  console.log(`✅ 성공적으로 삭제: ${deletedCount}개`);
  console.log(`❌ 삭제 실패: ${failedCount}개`);
  console.log(`📋 총 처리: ${sitesToDelete.length}개`);
  
  if (deletedCount > 0) {
    console.log('\n🎉 중복 현장 정리가 완료되었습니다!');
    console.log('💡 UI에서 현장 목록이 깔끔하게 정리될 것입니다.');
  }
}

deleteDuplicateSites().catch(console.error);