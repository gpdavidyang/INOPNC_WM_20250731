const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRequiredDocumentsData() {
  console.log('🚀 필수제출서류 테스트 데이터 생성 시작...\n');
  
  try {
    // 1. 기존 사용자 조회
    console.log('1️⃣ 기존 사용자 조회 중...');
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
    users.forEach(user => {
      console.log(`   - ${user.full_name || user.email} (${user.role})`);
    });
    
    // 2. 필수서류 요구사항 확인/생성
    console.log('\n2️⃣ 필수서류 요구사항 확인 중...');
    const { data: requirements, error: reqError } = await supabase
      .from('document_requirements')
      .select('*')
      .eq('is_active', true)
      .order('requirement_name');
    
    if (reqError) {
      console.error('❌ 요구사항 조회 오류:', reqError);
      
      // 테이블이 없으면 마이그레이션 실행 필요
      console.log('⚠️ document_requirements 테이블이 없을 수 있습니다.');
      console.log('📝 마이그레이션 실행이 필요합니다: supabase/migrations/922_create_required_documents_system.sql');
      return;
    }
    
    if (!requirements || requirements.length === 0) {
      console.log('⚠️ 필수서류 요구사항이 없습니다. 기본 데이터를 생성합니다...');
      
      const defaultRequirements = [
        {
          requirement_name: '안전교육이수증',
          document_type: 'safety_certificate', 
          description: '건설현장 안전교육 이수증명서',
          applicable_roles: ['worker'],
          expiry_days: 365,
          instructions: '최근 1년 내 이수한 안전교육증만 유효합니다.'
        },
        {
          requirement_name: '건강진단서',
          document_type: 'health_certificate',
          description: '건설업 종사자 건강진단서',
          applicable_roles: ['worker'],
          expiry_days: 365,
          instructions: '최근 1년 내 발급받은 건강진단서를 제출하세요.'
        },
        {
          requirement_name: '보험증서',
          document_type: 'insurance_certificate',
          description: '산재보험 및 고용보험 가입증명서',
          applicable_roles: ['worker'],
          expiry_days: 180,
          instructions: '현재 유효한 보험가입증명서를 제출하세요.'
        },
        {
          requirement_name: '신분증 사본',
          document_type: 'id_copy',
          description: '주민등록증 또는 운전면허증 사본',
          applicable_roles: ['worker'],
          expiry_days: null,
          instructions: '신분증 앞뒤면을 모두 스캔하여 제출하세요.'
        },
        {
          requirement_name: '자격증',
          document_type: 'license',
          description: '해당 업무 관련 자격증',
          applicable_roles: ['worker', 'site_manager'],
          expiry_days: null,
          instructions: '담당 업무에 필요한 자격증을 제출하세요.'
        },
        {
          requirement_name: '근로계약서',
          document_type: 'employment_contract',
          description: '정식 근로계약서',
          applicable_roles: ['worker'],
          expiry_days: null,
          instructions: '회사와 체결한 정식 근로계약서를 제출하세요.'
        },
        {
          requirement_name: '통장사본',
          document_type: 'bank_account',
          description: '급여 입금용 통장 사본',
          applicable_roles: ['worker'],
          expiry_days: null,
          instructions: '급여 입금을 위한 본인 명의 통장 사본을 제출하세요.'
        },
        {
          requirement_name: '사업자등록증',
          document_type: 'business_license',
          description: '사업자등록증 사본',
          applicable_roles: ['partner'],
          expiry_days: 365,
          instructions: '유효한 사업자등록증을 제출하세요.'
        },
        {
          requirement_name: '법인등기부등본',
          document_type: 'corporate_register',
          description: '법인등기부등본',
          applicable_roles: ['partner'],
          expiry_days: 90,
          instructions: '최근 3개월 이내 발급받은 등기부등본을 제출하세요.'
        }
      ];
      
      const { data: newRequirements, error: insertError } = await supabase
        .from('document_requirements')
        .insert(defaultRequirements)
        .select();
      
      if (insertError) {
        console.error('❌ 요구사항 생성 오류:', insertError);
        return;
      }
      
      console.log(`✅ ${newRequirements.length}개의 필수서류 요구사항 생성됨`);
    } else {
      console.log(`✅ ${requirements.length}개의 필수서류 요구사항 확인됨`);
      requirements.forEach(req => {
        console.log(`   - ${req.requirement_name} (${req.applicable_roles.join(', ')})`);
      });
    }
    
    // 3. 사용자별 제출 현황 생성/업데이트
    console.log('\n3️⃣ 사용자별 제출 현황 생성 중...');
    
    for (const user of users) {
      // 해당 사용자의 역할에 맞는 요구사항 찾기
      const userRequirements = requirements?.filter(req => 
        req.applicable_roles.includes(user.role)
      ) || [];
      
      if (userRequirements.length === 0) continue;
      
      console.log(`\n   👤 ${user.full_name || user.email} (${user.role})`);
      
      for (const req of userRequirements) {
        // 기존 제출 현황 확인
        const { data: existing } = await supabase
          .from('user_document_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('requirement_id', req.id)
          .single();
        
        if (!existing) {
          // 새로운 제출 현황 생성 (랜덤 상태)
          const statuses = ['not_submitted', 'submitted', 'approved', 'rejected'];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          let submissionData = {
            user_id: user.id,
            requirement_id: req.id,
            submission_status: randomStatus,
            created_at: new Date().toISOString()
          };
          
          // 상태에 따른 추가 데이터
          if (randomStatus === 'submitted') {
            submissionData.submitted_at = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
          } else if (randomStatus === 'approved') {
            const submittedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            submissionData.submitted_at = submittedDate.toISOString();
            submissionData.approved_at = new Date(submittedDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
            
            // 만료일 설정
            if (req.expiry_days) {
              const expiryDate = new Date(submittedDate);
              expiryDate.setDate(expiryDate.getDate() + req.expiry_days);
              submissionData.expiry_date = expiryDate.toISOString().split('T')[0];
            }
          } else if (randomStatus === 'rejected') {
            const submittedDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            submissionData.submitted_at = submittedDate.toISOString();
            submissionData.rejected_at = new Date(submittedDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
            submissionData.rejection_reason = '서류가 불명확합니다. 다시 제출해주세요.';
          }
          
          const { error: insertError } = await supabase
            .from('user_document_submissions')
            .insert(submissionData);
          
          if (insertError) {
            console.error(`      ❌ ${req.requirement_name}: 생성 실패 -`, insertError.message);
          } else {
            console.log(`      ✅ ${req.requirement_name}: ${randomStatus}`);
          }
        } else {
          console.log(`      ⚠️ ${req.requirement_name}: 이미 존재 (${existing.submission_status})`);
        }
      }
    }
    
    // 4. 샘플 문서 파일 생성 (승인된 제출에 대해)
    console.log('\n4️⃣ 샘플 문서 파일 생성 중...');
    
    const { data: approvedSubmissions } = await supabase
      .from('user_document_submissions')
      .select('*, profiles!user_id(full_name, email), document_requirements!requirement_id(requirement_name)')
      .eq('submission_status', 'approved')
      .is('document_id', null)
      .limit(10);
    
    if (approvedSubmissions && approvedSubmissions.length > 0) {
      for (const submission of approvedSubmissions) {
        const documentData = {
          title: `${submission.document_requirements.requirement_name} - ${submission.profiles.full_name || submission.profiles.email}`,
          description: `${submission.profiles.full_name}님이 제출한 ${submission.document_requirements.requirement_name}`,
          file_url: `https://example.com/documents/${submission.id}.pdf`,
          file_name: `${submission.document_requirements.requirement_name}_${submission.id}.pdf`,
          file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB ~ 5MB
          document_type: 'required_document',
          document_category: 'required',
          requirement_id: submission.requirement_id,
          submission_id: submission.id,
          submitted_by: submission.user_id,
          created_by: submission.user_id,
          status: 'approved',
          created_at: submission.submitted_at
        };
        
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single();
        
        if (!docError && document) {
          // 제출 현황에 문서 ID 업데이트
          await supabase
            .from('user_document_submissions')
            .update({ document_id: document.id })
            .eq('id', submission.id);
          
          console.log(`   ✅ 문서 생성: ${submission.document_requirements.requirement_name} (${submission.profiles.full_name})`);
        }
      }
    }
    
    // 5. 통계 출력
    console.log('\n5️⃣ 필수제출서류 통계');
    
    const { data: stats } = await supabase
      .from('user_document_submissions')
      .select('submission_status')
      .in('submission_status', ['not_submitted', 'submitted', 'approved', 'rejected', 'expired']);
    
    const statusCount = stats?.reduce((acc, curr) => {
      acc[curr.submission_status] = (acc[curr.submission_status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    console.log('\n📊 제출 현황 통계:');
    console.log(`   - 미제출: ${statusCount.not_submitted || 0}건`);
    console.log(`   - 제출됨: ${statusCount.submitted || 0}건`);
    console.log(`   - 승인됨: ${statusCount.approved || 0}건`);
    console.log(`   - 반려됨: ${statusCount.rejected || 0}건`);
    console.log(`   - 만료됨: ${statusCount.expired || 0}건`);
    
    // 6. 사용자별 준수율 확인
    console.log('\n📈 사용자별 서류 준수율:');
    
    const { data: compliance } = await supabase
      .from('user_document_compliance')
      .select('*')
      .order('compliance_rate', { ascending: false })
      .limit(5);
    
    if (compliance && compliance.length > 0) {
      compliance.forEach(user => {
        console.log(`   - ${user.full_name}: ${user.compliance_rate || 0}% (승인 ${user.approved_count}/${user.total_requirements})`);
      });
    }
    
    console.log('\n✅ 필수제출서류 테스트 데이터 생성 완료!');
    console.log('📌 관리자 화면에서 확인: /dashboard/admin/documents/required');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행
createRequiredDocumentsData();