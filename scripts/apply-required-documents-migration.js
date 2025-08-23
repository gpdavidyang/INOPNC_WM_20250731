const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🔧 필수제출서류 시스템 마이그레이션 적용 중...\n');
  
  try {
    // 마이그레이션 파일 읽기
    const migrationSQL = fs.readFileSync('./supabase/migrations/922_create_required_documents_system.sql', 'utf8');
    
    // SQL 문을 개별 statement로 분리 (세미콜론 기준)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));
    
    console.log(`📝 총 ${statements.length}개의 SQL 문 실행 예정\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 각 statement 실행
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // DO 블록이나 CREATE 문 등 처리
      if (statement.includes('CREATE TABLE') || 
          statement.includes('CREATE INDEX') || 
          statement.includes('CREATE POLICY') ||
          statement.includes('CREATE TRIGGER') ||
          statement.includes('CREATE FUNCTION') ||
          statement.includes('CREATE VIEW') ||
          statement.includes('ALTER TABLE') ||
          statement.includes('INSERT INTO') ||
          statement.includes('DO $$')) {
        
        try {
          // Supabase RPC를 통해 SQL 실행
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';'
          });
          
          if (error) {
            // 이미 존재하는 객체는 무시
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key')) {
              console.log(`⚠️ [${i+1}/${statements.length}] 이미 존재: ${statement.substring(0, 50)}...`);
            } else {
              console.error(`❌ [${i+1}/${statements.length}] 오류:`, error.message);
              errorCount++;
            }
          } else {
            console.log(`✅ [${i+1}/${statements.length}] 성공: ${statement.substring(0, 50)}...`);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ [${i+1}/${statements.length}] 실행 오류:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n📊 마이그레이션 실행 결과:');
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);
    
    // 테이블 존재 확인
    console.log('\n🔍 생성된 테이블 확인 중...');
    
    const tables = [
      'document_requirements',
      'user_document_submissions', 
      'document_submission_reminders'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: 존재하지 않음`);
      } else {
        console.log(`   ✅ ${table}: 생성됨`);
      }
    }
    
    console.log('\n✅ 마이그레이션 적용 완료!');
    console.log('📝 이제 scripts/create-required-documents-data.js를 실행하여 테스트 데이터를 생성할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 마이그레이션 적용 실패:', error.message);
  }
}

// exec_sql 함수가 없을 경우를 대비한 대체 방법
async function createExecSqlFunction() {
  const createFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  try {
    // 직접 SQL 실행은 불가능하므로, 개별 테이블 생성으로 대체
    console.log('⚠️ exec_sql 함수를 사용할 수 없습니다. 개별 테이블 생성을 시도합니다...\n');
    
    // 1. document_requirements 테이블 생성 시도
    const { error: reqError } = await supabase
      .from('document_requirements')
      .select('*')
      .limit(1);
    
    if (reqError && reqError.code === '42P01') {
      console.log('❌ document_requirements 테이블이 존재하지 않습니다.');
      console.log('📝 Supabase Dashboard에서 직접 마이그레이션을 실행해주세요:');
      console.log('   1. Supabase Dashboard > SQL Editor 접속');
      console.log('   2. supabase/migrations/922_create_required_documents_system.sql 내용 복사');
      console.log('   3. SQL Editor에 붙여넣기 후 실행');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('오류:', error);
    return false;
  }
}

// 메인 실행
async function main() {
  // exec_sql 함수 확인
  const { error: checkError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  
  if (checkError) {
    console.log('⚠️ exec_sql 함수가 없습니다.');
    const canContinue = await createExecSqlFunction();
    if (!canContinue) {
      return;
    }
  }
  
  await applyMigration();
}

main();