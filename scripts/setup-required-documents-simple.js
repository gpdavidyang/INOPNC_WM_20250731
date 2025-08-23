const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupRequiredDocuments() {
  console.log('🚀 필수제출서류 시스템 간단 설정 시작...\n');
  
  try {
    // 1. 먼저 documents 테이블에 필수제출서류 관련 데이터 추가
    console.log('1️⃣ 필수제출서류 샘플 문서 생성 중...');
    
    // 기존 사용자 조회
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
    
    // 필수서류 종류 정의
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
    
    // 2. 각 사용자별로 필수서류 문서 생성
    console.log('\n2️⃣ 사용자별 필수제출서류 생성 중...');
    
    let createdCount = 0;
    let errorCount = 0;
    
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
          document_type: 'required_document',
          document_category: 'required',
          status: randomStatus,
          created_by: user.id,
          site_id: user.site_id,
          created_at: submittedDate.toISOString(),
          approval_status: randomStatus,
          metadata: {
            document_type: docType.type,
            document_name: docType.name,
            user_role: user.role,
            submitted_date: submittedDate.toISOString()
          }
        };
        
        // 승인된 경우 추가 정보
        if (randomStatus === 'approved') {
          documentData.approved_at = new Date(submittedDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
          
          // 만료일 설정 (일부 문서만)
          if (docType.type === 'safety_certificate' || docType.type === 'health_certificate') {
            const expiryDate = new Date(submittedDate);
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1년 후 만료
            documentData.expiry_date = expiryDate.toISOString().split('T')[0];
          }
        } else if (randomStatus === 'rejected') {
          documentData.rejected_at = new Date(submittedDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
          documentData.rejection_reason = '서류가 불명확합니다. 다시 제출해주세요.';
        }
        
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
        }
      }
    }
    
    // 3. 통계 출력
    console.log('\n3️⃣ 생성 결과 통계');
    console.log(`   ✅ 성공: ${createdCount}개 문서`);
    console.log(`   ❌ 실패: ${errorCount}개`);
    
    // 4. 생성된 필수제출서류 확인
    console.log('\n4️⃣ 생성된 필수제출서류 확인');
    
    const { data: requiredDocs, error: fetchError } = await supabase
      .from('documents')
      .select('*, profiles!created_by(full_name, email, role)')
      .eq('document_category', 'required')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('❌ 문서 조회 오류:', fetchError);
    } else {
      console.log(`\n📊 최근 생성된 필수제출서류 (총 ${requiredDocs?.length || 0}개):`);
      
      requiredDocs?.forEach(doc => {
        const userName = doc.profiles?.full_name || doc.profiles?.email || '알 수 없음';
        const role = doc.profiles?.role || 'unknown';
        console.log(`   - ${doc.title}`);
        console.log(`     제출자: ${userName} (${role})`);
        console.log(`     상태: ${doc.status || doc.approval_status}`);
        console.log(`     크기: ${Math.round(doc.file_size / 1024)}KB`);
        if (doc.expiry_date) {
          console.log(`     만료일: ${doc.expiry_date}`);
        }
      });
    }
    
    // 5. 상태별 통계
    console.log('\n5️⃣ 상태별 통계');
    
    const { data: statsData } = await supabase
      .from('documents')
      .select('status')
      .eq('document_category', 'required');
    
    if (statsData) {
      const statusCount = statsData.reduce((acc, doc) => {
        const status = doc.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   📈 문서 상태 분포:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count}개`);
      });
    }
    
    console.log('\n✅ 필수제출서류 샘플 데이터 생성 완료!');
    console.log('📌 관리자 화면에서 확인: http://localhost:3000/dashboard/admin/documents/required');
    console.log('💡 작업자별 제출 현황과 승인/반려 기능을 확인할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행
setupRequiredDocuments();