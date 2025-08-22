const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 문서 타입별 풍성한 샘플 데이터
const documentTemplates = {
  personal: [
    { name: '개인작업계획서_2024.pdf', type: 'application/pdf', size: 2511420, category: '계획서' },
    { name: '작업일지_3월_개인메모.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 189744, category: '메모' },
    { name: '안전교육이수증_김파트너.pdf', type: 'application/pdf', size: 1204224, category: '교육자료' },
    { name: '현장사진_0322_개인기록.jpg', type: 'image/jpeg', size: 3456789, category: '사진' },
    { name: '품질검사체크리스트_개인용.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 678912, category: '체크리스트' },
    { name: '개인업무보고서_3월.pdf', type: 'application/pdf', size: 1876543, category: '보고서' },
    { name: '현장방문일정_개인.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 234567, category: '일정표' },
    { name: '작업사진첩_3월2주.pdf', type: 'application/pdf', size: 8765432, category: '사진첩' },
    { name: '개인안전점검표.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 345678, category: '점검표' },
    { name: '현장메모_긴급사항.txt', type: 'text/plain', size: 12345, category: '메모' },
    { name: '개인장비점검기록.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 456789, category: '점검기록' },
    { name: '월간업무일지_3월.pdf', type: 'application/pdf', size: 2345678, category: '업무일지' }
  ],
  shared: [
    { name: '안전관리계획서_v3.pdf', type: 'application/pdf', size: 4250176, category: '안전관리' },
    { name: '작업지시서_0322_최종.pdf', type: 'application/pdf', size: 1913408, category: '작업지시' },
    { name: '품질관리매뉴얼_2024.pdf', type: 'application/pdf', size: 5672864, category: '매뉴얼' },
    { name: '현장안전수칙_포스터.jpg', type: 'image/jpeg', size: 2345678, category: '안전자료' },
    { name: '작업일정표_3월.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 456789, category: '일정표' },
    { name: '현장관리기준서.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 789123, category: '기준서' },
    { name: '건설장비운용매뉴얼.pdf', type: 'application/pdf', size: 12345678, category: '매뉴얼' },
    { name: '현장교육자료_안전.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 8901234, category: '교육자료' },
    { name: '작업진도현황표.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 567890, category: '진도표' },
    { name: '현장회의록_3월1주.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 234567, category: '회의록' },
    { name: '환경관리계획서.pdf', type: 'application/pdf', size: 3456789, category: '환경관리' },
    { name: '현장점검체크리스트.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 345678, category: '점검표' },
    { name: '협력업체명단.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 123456, category: '업체명단' },
    { name: '월간현장보고서.pdf', type: 'application/pdf', size: 4567890, category: '현장보고서' },
    { name: '자재목록표_3월.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 678901, category: '자재목록' }
  ],
  billing: [
    { name: '견적서_강남A현장_2024Q1.pdf', type: 'application/pdf', size: 2936012, category: '견적서' },
    { name: '계약서_포스코광양_본계약.pdf', type: 'application/pdf', size: 6452595, category: '계약서' },
    { name: '시공계획서_삼성전자평택.pdf', type: 'application/pdf', size: 11122611, category: '시공계획' },
    { name: '전자세금계산서_2024_03.pdf', type: 'application/pdf', size: 533152, category: '세금계산서' },
    { name: '사진대지문서_3월_최종.pdf', type: 'application/pdf', size: 15897280, category: '사진대지' },
    { name: '작업완료확인서_3월3주.pdf', type: 'application/pdf', size: 1453434, category: '완료확인서' },
    { name: '진행도면_최종승인_v4.pdf', type: 'markup-document', size: 8815744, category: '도면' },
    { name: '기성청구서_2024_03.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 678901, category: '청구서' },
    { name: '검수완료보고서.pdf', type: 'application/pdf', size: 2345678, category: '검수보고서' },
    { name: '준공도서_표지.pdf', type: 'application/pdf', size: 4567890, category: '준공도서' },
    { name: '하도급대금지급확인서.pdf', type: 'application/pdf', size: 1234567, category: '지급확인서' },
    { name: '공사사진대지_월별모음.pdf', type: 'application/pdf', size: 23456789, category: '사진대지' },
    { name: '품질검사성적서.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 456789, category: '검사성적서' },
    { name: '공정표_간트차트.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 789012, category: '공정표' },
    { name: '자재구매명세서.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 345678, category: '구매명세서' },
    { name: '하도급계약서_철근공사.pdf', type: 'application/pdf', size: 2345678, category: '하도급계약' },
    { name: '기성검사신청서.pdf', type: 'application/pdf', size: 1234567, category: '검사신청서' },
    { name: '준공검사서류일체.pdf', type: 'application/pdf', size: 12345678, category: '준공검사' }
  ]
};

async function createPartnerDocuments() {
  try {
    console.log('🚀 파트너사 문서함 풍성한 데이터 생성 시작...');

    // 1. 파트너사 사용자 확인/생성
    console.log('👤 파트너사 사용자 확인/생성...');
    
    let { data: existingPartner } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'partner@inopnc.com')
      .single();

    let partnerId;
    if (!existingPartner) {
      // 파트너사 사용자 생성
      const { data: newPartner, error: partnerError } = await supabase
        .from('profiles')
        .insert({
          email: 'partner@inopnc.com',
          full_name: '김파트너',
          role: 'customer_manager',
          status: 'active',
          phone: '010-1234-5678'
        })
        .select()
        .single();

      if (partnerError) {
        console.error('파트너사 사용자 생성 오류:', partnerError);
        return;
      }
      
      partnerId = newPartner.id;
      console.log(`✅ 새 파트너사 사용자 생성: ${newPartner.full_name} (${partnerId})`);
    } else {
      partnerId = existingPartner.id;
      console.log(`✅ 기존 파트너사 사용자 사용: ${existingPartner.full_name} (${partnerId})`);
    }

    // 2. 현장 정보 확인
    console.log('🏢 현장 정보 확인...');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .limit(5);

    if (sitesError) {
      console.error('현장 조회 오류:', sitesError);
      return;
    }

    console.log(`✅ 현장 ${sites.length}개 확인됨`);

    // 3. 기존 파트너 문서 삭제 (재생성을 위해)
    console.log('🧹 기존 파트너 문서 정리...');
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('owner_id', partnerId);

    if (deleteError) {
      console.error('기존 문서 삭제 오류:', deleteError);
    }

    // 4. 문서 생성
    console.log('📄 새 문서들 생성 중...');
    
    let totalCreated = 0;
    const currentDate = new Date();

    // 각 문서 타입별로 생성
    for (const [docType, templates] of Object.entries(documentTemplates)) {
      console.log(`\n📂 ${docType} 문서 생성 중...`);
      
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const site = sites[i % sites.length]; // 현장을 순환하며 할당
        
        // 생성 날짜를 다양하게 설정 (지난 30일 내)
        const createdAt = new Date(currentDate);
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
        
        const document = {
          title: template.name,
          description: `${template.category} - ${site.name}에서 생성된 문서`,
          file_url: `/documents/${docType}/${template.name}`,
          file_name: template.name,
          file_size: template.size,
          mime_type: template.type,
          document_type: docType === 'personal' ? 'personal' : docType === 'shared' ? 'shared' : 'certificate',
          folder_path: `/${docType}`,
          owner_id: partnerId,
          is_public: docType !== 'personal',
          site_id: docType === 'personal' ? null : site.id,
          created_at: createdAt.toISOString(),
          updated_at: createdAt.toISOString()
        };

        const { data: newDoc, error: docError } = await supabase
          .from('documents')
          .insert(document)
          .select()
          .single();

        if (docError) {
          console.error(`문서 생성 오류 (${template.name}):`, docError);
        } else {
          totalCreated++;
          console.log(`  ✅ ${template.name} 생성됨 (${site.name})`);
        }
      }
    }

    console.log(`\n🎉 총 ${totalCreated}개 문서 생성 완료!`);
    
    // 5. 생성된 문서 확인
    console.log('\n📊 생성된 문서 분포:');
    
    const { data: personalDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('owner_id', partnerId)
      .eq('document_type', 'personal');
    
    const { data: sharedDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('owner_id', partnerId)
      .eq('document_type', 'shared');
    
    const { data: billingDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('owner_id', partnerId)
      .eq('document_type', 'billing');

    console.log(`  📁 내문서함: ${personalDocs?.length || 0}개`);
    console.log(`  📁 공유문서함: ${sharedDocs?.length || 0}개`);
    console.log(`  📁 기성청구함: ${billingDocs?.length || 0}개`);

    // 6. 현장별 작업일지 연동 데이터 생성
    console.log('\n📝 작업일지 연동 데이터 생성...');
    
    for (const site of sites.slice(0, 3)) { // 상위 3개 현장에만 생성
      const workDates = [];
      for (let i = 0; i < 10; i++) { // 각 현장당 10개 작업일지
        const workDate = new Date(currentDate);
        workDate.setDate(workDate.getDate() - i);
        workDates.push(workDate.toISOString().split('T')[0]);
      }

      for (const workDate of workDates) {
        const dailyReport = {
          work_date: workDate,
          member_name: '김파트너',
          work_description: `${site.name} 작업 진행 - 파트너사 협력 업무`,
          weather: ['맑음', '흐림', '비'][Math.floor(Math.random() * 3)],
          temperature: 20 + Math.floor(Math.random() * 15),
          site_id: site.id,
          status: 'completed',
          created_by: partnerId,
          work_hours: 8,
          overtime_hours: Math.floor(Math.random() * 3),
          notes: `파트너사 김파트너의 ${site.name} 현장 작업`,
          created_at: new Date(workDate).toISOString(),
          updated_at: new Date(workDate).toISOString()
        };

        const { error: reportError } = await supabase
          .from('daily_reports')
          .insert(dailyReport);

        if (!reportError) {
          console.log(`  ✅ 작업일지 생성: ${site.name} - ${workDate}`);
        }
      }
    }

    // 7. 현장 접근 권한 설정
    console.log('\n🔐 현장 접근 권한 설정...');
    
    for (const site of sites) {
      const { error: accessError } = await supabase
        .from('site_memberships')
        .upsert({
          site_id: site.id,
          user_id: partnerId,
          role: 'partner',
          status: 'active'
        });

      if (!accessError) {
        console.log(`  ✅ ${site.name} 접근 권한 설정`);
      }
    }

    console.log('\n✨ 파트너사 문서함 풍성한 데이터 생성 완료!');
    console.log(`파트너사 계정: partner@inopnc.com / password123`);
    console.log(`생성된 총 문서 수: ${totalCreated}개`);
    console.log(`연동된 현장 수: ${sites.length}개`);

  } catch (error) {
    console.error('스크립트 실행 오류:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ 환경 변수가 설정되지 않았습니다.');
    console.error('NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
    process.exit(1);
  }
  
  createPartnerDocuments();
}

module.exports = { createPartnerDocuments };