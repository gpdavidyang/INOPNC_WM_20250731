const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function prepareRequiredDocumentsSystem() {
  console.log('🔍 필수제출서류함 시스템 준비 중...');
  console.log('');
  
  try {
    // Step 1: Add essential columns to documents table (minimal version)
    console.log('1️⃣ documents 테이블에 필수 컬럼 추가 시도...');
    
    // Test if document_category exists
    const { data: testDoc, error: testError } = await supabase
      .from('documents')
      .select('document_category')
      .limit(1);
    
    if (testError && testError.message.includes('column') && testError.message.includes('does not exist')) {
      console.log('⚠️ document_category 컬럼이 존재하지 않습니다.');
      console.log('   Supabase Dashboard에서 다음 SQL을 실행해야 합니다:');
      console.log('');
      console.log('   ALTER TABLE documents');
      console.log('   ADD COLUMN IF NOT EXISTS document_category VARCHAR(50) DEFAULT \'general\',');
      console.log('   ADD COLUMN IF NOT EXISTS requirement_id UUID,'); 
      console.log('   ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id),');
      console.log('   ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),');
      console.log('   ADD COLUMN IF NOT EXISTS review_date TIMESTAMP WITH TIME ZONE,');
      console.log('   ADD COLUMN IF NOT EXISTS review_notes TEXT,');
      console.log('   ADD COLUMN IF NOT EXISTS expiry_date DATE;');
      console.log('');
    } else {
      console.log('✅ document_category 컬럼이 이미 존재합니다.');
    }
    
    // Step 2: Create some test documents for demonstration
    console.log('2️⃣ 테스트용 필수 서류 문서 생성...');
    
    // Get admin user
    const { data: admin } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'admin@inopnc.com')
      .single();
    
    // Get a worker user for testing
    const { data: worker } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', 'worker@inopnc.com')
      .single();
    
    if (admin && worker) {
      // Create test required documents
      const testDocuments = [
        {
          title: '안전교육이수증 - ' + worker.full_name,
          description: '건설현장 안전교육 이수증명서',
          document_type: 'safety_certificate',
          file_name: 'safety_certificate_' + worker.full_name + '.pdf',
          file_url: 'https://example.com/test_safety_cert.pdf',
          file_size: 1024000, // 1MB
          mime_type: 'application/pdf',
          folder_path: '/required-documents',
          owner_id: admin.id,
          is_public: false,
          document_category: 'required',
          submitted_by: worker.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          title: '건강진단서 - ' + worker.full_name,
          description: '건설업 종사자 건강진단서',
          document_type: 'health_certificate', 
          file_name: 'health_certificate_' + worker.full_name + '.pdf',
          file_url: 'https://example.com/test_health_cert.pdf',
          file_size: 856000, // 856KB
          mime_type: 'application/pdf',
          folder_path: '/required-documents',
          owner_id: admin.id,
          is_public: false,
          document_category: 'required',
          submitted_by: worker.id,
          status: 'approved',
          reviewed_by: admin.id,
          review_date: new Date().toISOString(),
          review_notes: '검토 완료, 승인',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updated_at: new Date().toISOString()
        }
      ];
      
      for (const doc of testDocuments) {
        try {
          const { data, error } = await supabase
            .from('documents')
            .insert([doc])
            .select();
            
          if (error) {
            console.log('⚠️ 테스트 문서 생성 실패 (컬럼 없음):', error.message);
          } else {
            console.log('✅ 테스트 문서 생성됨:', doc.title);
          }
        } catch (err) {
          console.log('⚠️ 테스트 문서 생성 중 오류:', err.message);
        }
      }
    }
    
    console.log('');
    console.log('📋 준비 완료 상태:');
    console.log('   • React 컴포넌트: ✅ 완성');
    console.log('   • 업로드 모달: ✅ RequiredDocumentUploadModal.tsx');
    console.log('   • 상세보기 모달: ✅ RequiredDocumentDetailModal.tsx');
    console.log('   • 메인 관리 화면: ✅ RequiredDocumentsManagement.tsx');
    console.log('   • 데이터베이스 마이그레이션: ⚠️ 수동 적용 필요');
    console.log('');
    console.log('🎯 완전한 테스트를 위한 단계:');
    console.log('   1. Supabase Dashboard → SQL Editor 에서');
    console.log('   2. 파일 내용: supabase/migrations/922_create_required_documents_system.sql');
    console.log('   3. 전체 SQL 복사하여 실행');
    console.log('   4. http://localhost:3009/dashboard/admin/documents/required 테스트');
    console.log('');
    console.log('🚀 현재 접근 방법:');
    console.log('   • URL: http://localhost:3009/auth/login');
    console.log('   • 로그인: admin@inopnc.com / password123');
    console.log('   • 이동: 관리자 대시보드 → 문서함 관리 → 필수 제출 서류 관리');
    
  } catch (error) {
    console.error('❌ 시스템 준비 중 오류:', error.message);
  }
}

prepareRequiredDocumentsSystem();