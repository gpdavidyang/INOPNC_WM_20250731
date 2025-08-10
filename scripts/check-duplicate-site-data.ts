import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkDuplicateSiteData() {
  console.log('🔍 중복 현장 연결 데이터 확인\n');
  
  // 관리자로 로그인
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'admin@inopnc.com',
    password: 'password123'
  });
  
  // 중복 현장들 ID
  const duplicateSites = {
    '강남 A현장': [
      '55386936-56b0-465e-bcc2-8313db735ca9',
      '26043e14-8175-4e8b-930c-07dcffe1c84f', 
      '00000000-0000-0000-0000-000000000101',
      'a26e7fd4-50f0-4554-bb1b-f512267282bb'
    ],
    '서초 B현장': [
      '07df7e5b-168e-48be-950c-023777c96808',
      'db77a967-342c-4db5-aa81-4bcabf6a4206',
      '09787a3a-97d0-460f-89c3-7241091626ef',
      'b0b6623a-da3e-4ef3-93e5-aabe639c5d61'
    ],
    '송파 C현장': [
      'bb0db4b9-deba-4b52-8184-ffe75b3e4aa8',
      'c85946ad-8cdc-4ab8-8062-ce0f5d1e7ba9',
      'e868f6f1-cbc7-4af9-86db-a3aa83ab31c2'
    ]
  };
  
  const safeToDelte: string[] = [];
  const hasData: string[] = [];
  
  for (const [siteName, siteIds] of Object.entries(duplicateSites)) {
    console.log(`\n📋 ${siteName} 데이터 확인:`);
    console.log('-'.repeat(40));
    
    for (const siteId of siteIds) {
      console.log(`\n🏗️ Site ID: ${siteId.substring(0, 8)}...`);
      
      // 작업일지 확인
      const { count: reportCount } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);
      
      // 출근기록 확인
      const { count: attendanceCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);
        
      // 사용자 배정 확인
      const { count: assignmentCount } = await supabase
        .from('site_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);
        
      // 문서 확인
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);
      
      console.log(`   📊 작업일지: ${reportCount || 0}건`);
      console.log(`   👥 출근기록: ${attendanceCount || 0}건`);
      console.log(`   🔗 사용자배정: ${assignmentCount || 0}건`);
      console.log(`   📄 문서: ${docCount || 0}건`);
      
      const totalData = (reportCount || 0) + (attendanceCount || 0) + (assignmentCount || 0) + (docCount || 0);
      
      if (totalData === 0) {
        console.log(`   ✅ 삭제 안전: 연결된 데이터 없음`);
        safeToDelte.push(siteId);
      } else {
        console.log(`   ⚠️  삭제 주의: 총 ${totalData}개 데이터 연결됨`);
        hasData.push(siteId);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 삭제 안전성 요약:');
  console.log(`✅ 안전하게 삭제 가능: ${safeToDelte.length}개`);
  console.log(`⚠️  데이터 연결됨: ${hasData.length}개`);
  
  console.log('\n🗑️  삭제 가능한 현장들:');
  safeToDelte.forEach((siteId, index) => {
    console.log(`   ${index + 1}. ${siteId}`);
  });
}

checkDuplicateSiteData().catch(console.error);