const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function implementForeignKeyConstraints() {
  console.log('🔧 FK 제약조건 및 데이터 검증 규칙 구현 시작...');
  console.log('='.repeat(60));
  
  try {
    // 1. 기존 FK 제약조건 확인
    console.log('\n1️⃣ 기존 FK 제약조건 확인...');
    
    const { data: existingConstraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name, constraint_type')
      .eq('constraint_type', 'FOREIGN KEY')
      .eq('table_schema', 'public');
    
    if (constraintError) {
      console.log('❌ 제약조건 확인 오류:', constraintError.message);
    } else {
      console.log('✅ 기존 FK 제약조건:', existingConstraints?.length || 0, '개');
      existingConstraints?.forEach(constraint => {
        console.log('  -', constraint.constraint_name, '(', constraint.table_name, ')');
      });
    }
    
    // 2. 간단한 FK 제약조건 추가 시도
    console.log('\n2️⃣ FK 제약조건 추가 시도...');
    
    const simpleConstraints = [
      {
        name: 'fk_site_assignments_user',
        sql: 'ALTER TABLE site_assignments ADD CONSTRAINT fk_site_assignments_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE'
      },
      {
        name: 'fk_site_assignments_site', 
        sql: 'ALTER TABLE site_assignments ADD CONSTRAINT fk_site_assignments_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE'
      },
      {
        name: 'fk_daily_reports_site',
        sql: 'ALTER TABLE daily_reports ADD CONSTRAINT fk_daily_reports_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE'
      },
      {
        name: 'fk_daily_reports_creator',
        sql: 'ALTER TABLE daily_reports ADD CONSTRAINT fk_daily_reports_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE'
      }
    ];
    
    for (const constraint of simpleConstraints) {
      console.log('  ⏳ 추가 중:', constraint.name);
      
      const { error } = await supabase.rpc('exec_sql', { sql: constraint.sql });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log('    ✅ 이미 존재');
        } else if (error.message.includes('violates foreign key constraint')) {
          console.log('    ❌ 데이터 무결성 위반 - 정리 필요');
        } else {
          console.log('    ❌ 오류:', error.message);
        }
      } else {
        console.log('    ✅ 성공');
      }
    }
    
    // 3. 현재 orphaned records 재확인
    console.log('\n3️⃣ Orphaned Records 재확인...');
    
    // site_assignments에서 잘못된 user_id 찾기
    const { data: invalidUsers, error: invalidUsersError } = await supabase
      .from('site_assignments')
      .select('user_id')
      .not('user_id', 'in', '(SELECT id FROM profiles)');
    
    if (invalidUsersError) {
      console.log('❌ Invalid users 확인 오류:', invalidUsersError.message);
    } else {
      console.log('📋 site_assignments의 유효하지 않은 user_id:', invalidUsers?.length || 0, '개');
    }
    
    // daily_reports에서 잘못된 created_by 찾기
    const { data: invalidCreators, error: invalidCreatorsError } = await supabase
      .from('daily_reports')
      .select('id, created_by')
      .not('created_by', 'in', '(SELECT id FROM profiles)');
    
    if (invalidCreatorsError) {
      console.log('❌ Invalid creators 확인 오류:', invalidCreatorsError.message);
    } else {
      console.log('📋 daily_reports의 유효하지 않은 created_by:', invalidCreators?.length || 0, '개');
    }
    
    // 4. 간단한 무결성 검증 쿼리 실행
    console.log('\n4️⃣ 데이터 무결성 검증...');
    
    const checks = [
      {
        name: 'profiles without auth users',
        query: `SELECT COUNT(*) FROM profiles WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = profiles.id)`
      },
      {
        name: 'site_assignments with invalid user_id',
        query: `SELECT COUNT(*) FROM site_assignments WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = site_assignments.user_id)`
      },
      {
        name: 'daily_reports with invalid created_by',
        query: `SELECT COUNT(*) FROM daily_reports WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = daily_reports.created_by)`
      }
    ];
    
    for (const check of checks) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: check.query });
        
        if (error) {
          console.log('❌', check.name + ':', error.message);
        } else {
          console.log('✅', check.name + ':', data || 'Query executed');
        }
      } catch (err) {
        console.log('❌', check.name + ':', err.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 FK 제약조건 구현 시도 완료');
    console.log('📝 다음 단계: 발견된 문제들을 개별적으로 해결 필요');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 전체 프로세스 오류:', error.message);
  }
}

implementForeignKeyConstraints();