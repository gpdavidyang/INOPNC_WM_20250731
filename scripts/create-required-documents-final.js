const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRequiredDocuments() {
  console.log('🚀 필수제출서류 데이터 생성 (최종 버전)...\n');
  
  try {
    // 1. 기존 사용자 조회
    console.log('1️⃣ 사용자 데이터 확인...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['worker', 'site_manager', 'partner'])
      .order('created_at');
    
    if (usersError) {
      console.error('❌ 사용자 조회 오류:', usersError);
      return;
    }
    
    console.log(`✅ ${users.length}명의 사용자 확인됨`);
    
    // 2. 필수서류 종류 정의
    const documentTypes = [
      { name: '안전교육이수증', type: 'safety_certificate', description: '건설현장 안전교육 이수증명서', roles: ['worker'] },
      { name: '건강진단서', type: 'health_certificate', description: '건설업 종사자 건강진단서', roles: ['worker'] },
      { name: '보험증서', type: 'insurance_certificate', description: '산재보험 및 고용보험 가입증명서', roles: ['worker'] },
      { name: '신분증 사본', type: 'id_copy', description: '주민등록증 또는 운전면허증 사본', roles: ['worker'] },
      { name: '자격증', type: 'license', description: '해당 업무 관련 자격증', roles: ['worker', 'site_manager'] },
      { name: '근로계약서', type: 'employment_contract', description: '정식 근로계약서', roles: ['worker'] },
      { name: '통장사본', type: 'bank_account', description: '급여 입금용 통장 사본', roles: ['worker'] },
      { name: '사업자등록증', type: 'business_license', description: '사업자등록증 사본', roles: ['partner'] },
      { name: '법인등기부등본', type: 'corporate_register', description: '법인등기부등본', roles: ['partner'] }
    ];
    
    // 3. 각 사용자별로 필수서류 문서 생성
    console.log('\n2️⃣ 사용자별 필수제출서류 생성 중...');
    
    let createdCount = 0;
    let errorCount = 0;
    const createdDocuments = [];
    
    for (const user of users) {
      console.log(`\n👤 ${user.full_name || user.email} (${user.role})`);
      
      // 해당 역할에 맞는 문서 종류 필터링
      const userDocTypes = documentTypes.filter(doc => 
        doc.roles.includes(user.role)
      );
      
      for (const docType of userDocTypes) {
        // 랜덤 상태 설정
        const statuses = ['pending', 'approved', 'rejected'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        // 랜덤 날짜 생성 (최근 30일 내)
        const randomDays = Math.floor(Math.random() * 30);
        const submittedDate = new Date();
        submittedDate.setDate(submittedDate.getDate() - randomDays);
        
        const documentData = {
          title: `${docType.name} - ${user.full_name || user.email}`,
          description: `${user.full_name || user.email}님이 제출한 ${docType.description}`,
          file_url: `https://example.com/documents/${user.id}/${docType.type}.pdf`,
          file_name: `${docType.type}_${user.id}.pdf`,
          file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB ~ 5MB
          document_type: docType.type,
          document_category: 'required',
          status: randomStatus,
          created_by: user.id,
          site_id: user.site_id,
          created_at: submittedDate.toISOString(),
          // metadata를 JSON 문자열로 저장
          metadata: JSON.stringify({
            document_type: docType.type,
            document_name: docType.name,
            user_role: user.role,
            user_name: user.full_name || user.email,
            submitted_date: submittedDate.toISOString(),
            status: randomStatus
          })
        };
        
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single();
        
        if (docError) {
          console.error(`   ❌ ${docType.name}: ${docError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ ${docType.name}: ${randomStatus}`);
          createdCount++;
          createdDocuments.push(document);
        }
      }
    }
    
    // 4. 통계 출력
    console.log('\n3️⃣ 생성 결과 통계');
    console.log(`   ✅ 성공: ${createdCount}개 문서`);
    console.log(`   ❌ 실패: ${errorCount}개`);
    
    // 5. 생성된 필수제출서류 확인
    console.log('\n4️⃣ 생성된 필수제출서류 확인');
    
    const { data: requiredDocs, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('document_category', 'required')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('❌ 문서 조회 오류:', fetchError);
    } else {
      console.log(`\n📊 최근 생성된 필수제출서류 (총 ${requiredDocs?.length || 0}개):`);
      
      for (const doc of requiredDocs || []) {
        // metadata 파싱
        let metadata = {};
        try {
          metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
        } catch (e) {
          metadata = {};
        }
        
        console.log(`   - ${doc.title}`);
        console.log(`     상태: ${doc.status}`);
        console.log(`     크기: ${Math.round(doc.file_size / 1024)}KB`);
        console.log(`     제출일: ${new Date(doc.created_at).toLocaleDateString()}`);
      }
    }
    
    // 6. 상태별 통계
    console.log('\n5️⃣ 상태별 통계');
    
    const { data: allRequiredDocs } = await supabase
      .from('documents')
      .select('status')
      .eq('document_category', 'required');
    
    if (allRequiredDocs) {
      const statusCount = allRequiredDocs.reduce((acc, doc) => {
        const status = doc.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   📈 문서 상태 분포:');
      Object.entries(statusCount).forEach(([status, count]) => {
        const statusName = status === 'approved' ? '승인됨' :
                         status === 'pending' ? '검토중' :
                         status === 'rejected' ? '반려됨' : status;
        console.log(`      - ${statusName}: ${count}개`);
      });
      
      const total = allRequiredDocs.length;
      const approved = statusCount.approved || 0;
      const compliance = total > 0 ? Math.round((approved / total) * 100) : 0;
      
      console.log(`\n   📊 전체 준수율: ${compliance}% (${approved}/${total})`);
    }
    
    // 7. 사용자별 제출 현황
    console.log('\n6️⃣ 사용자별 필수서류 제출 현황');
    
    for (const user of users.slice(0, 5)) { // 처음 5명만 표시
      const { data: userDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('document_category', 'required')
        .eq('created_by', user.id);
      
      if (userDocs && userDocs.length > 0) {
        const approvedCount = userDocs.filter(d => d.status === 'approved').length;
        const pendingCount = userDocs.filter(d => d.status === 'pending').length;
        const rejectedCount = userDocs.filter(d => d.status === 'rejected').length;
        
        console.log(`   👤 ${user.full_name || user.email} (${user.role})`);
        console.log(`      - 전체: ${userDocs.length}개`);
        console.log(`      - 승인: ${approvedCount}개`);
        console.log(`      - 검토중: ${pendingCount}개`);
        console.log(`      - 반려: ${rejectedCount}개`);
        console.log(`      - 준수율: ${Math.round((approvedCount / userDocs.length) * 100)}%`);
      }
    }
    
    console.log('\n✅ 필수제출서류 데이터 생성 완료!');
    console.log('📌 관리자 화면에서 확인: http://localhost:3000/dashboard/admin/documents/required');
    console.log('💡 작업자별 제출 현황과 승인/반려 기능을 확인할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행
createRequiredDocuments();