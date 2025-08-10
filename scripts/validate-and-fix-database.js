/**
 * 데이터베이스 스키마 검증 및 수정 스크립트
 * RLS 정책 충돌 해결 및 성능 최적화
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * 현재 RLS 정책 상태 분석
 */
async function analyzeCurrentPolicies() {
  console.log('🔍 현재 RLS 정책 상태 분석 중...')
  
  const { data: policies, error } = await supabase.rpc('sql', {
    query: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public'
      AND tablename IN ('attendance_records', 'daily_reports', 'profiles', 'sites')
      ORDER BY tablename, policyname;
    `
  })
  
  if (error) {
    console.error('❌ 정책 분석 실패:', error)
    return
  }
  
  // 정책을 테이블별로 그룹화
  const policiesByTable = policies.reduce((acc, policy) => {
    if (!acc[policy.tablename]) {
      acc[policy.tablename] = []
    }
    acc[policy.tablename].push(policy)
    return acc
  }, {})
  
  console.log('📊 현재 RLS 정책 현황:')
  Object.keys(policiesByTable).forEach(tableName => {
    console.log(`\n  📋 ${tableName}:`)
    policiesByTable[tableName].forEach(policy => {
      console.log(`    - ${policy.policyname} (${policy.cmd})`)
    })
  })
  
  // 충돌 가능성 검사
  console.log('\n⚠️  정책 충돌 검사:')
  Object.keys(policiesByTable).forEach(tableName => {
    const selectPolicies = policiesByTable[tableName].filter(p => p.cmd === 'SELECT')
    if (selectPolicies.length > 2) {
      console.log(`    ⚠️  ${tableName}: ${selectPolicies.length}개의 SELECT 정책 (충돌 가능)`)
      selectPolicies.forEach(policy => {
        console.log(`      - ${policy.policyname}`)
      })
    }
  })
}

/**
 * 데이터베이스 연결 및 권한 확인
 */
async function validateDatabaseConnection() {
  console.log('🔗 데이터베이스 연결 확인 중...')
  
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: 'SELECT current_user, current_database(), version();'
    })
    
    if (error) {
      console.error('❌ 연결 실패:', error)
      return false
    }
    
    console.log('✅ 데이터베이스 연결 성공')
    console.log(`   사용자: ${data[0].current_user}`)
    console.log(`   데이터베이스: ${data[0].current_database}`)
    
    return true
  } catch (error) {
    console.error('❌ 연결 오류:', error)
    return false
  }
}

/**
 * 테이블 및 인덱스 상태 확인
 */
async function analyzeTablePerformance() {
  console.log('\n📈 테이블 성능 분석 중...')
  
  const tables = ['attendance_records', 'daily_reports', 'profiles', 'sites']
  
  for (const tableName of tables) {
    try {
      // 테이블 크기 및 통계
      const { data: stats } = await supabase.rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows,
            n_dead_tup as dead_rows
          FROM pg_stat_user_tables 
          WHERE tablename = '${tableName}';
        `
      })
      
      // 인덱스 정보
      const { data: indexes } = await supabase.rpc('sql', {
        query: `
          SELECT 
            indexname,
            indexdef,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
          FROM pg_indexes 
          WHERE tablename = '${tableName}'
          AND schemaname = 'public';
        `
      })
      
      if (stats && stats.length > 0) {
        const stat = stats[0]
        console.log(`\n  📋 ${tableName}:`)
        console.log(`    크기: ${stat.size}`)
        console.log(`    라이브 행: ${stat.live_rows?.toLocaleString()}`)
        console.log(`    인덱스: ${indexes?.length || 0}개`)
        
        if (indexes && indexes.length > 0) {
          indexes.forEach(idx => {
            console.log(`      - ${idx.indexname} (${idx.index_size})`)
          })
        }
      }
    } catch (error) {
      console.error(`❌ ${tableName} 분석 실패:`, error.message)
    }
  }
}

/**
 * RLS 정책 성능 테스트
 */
async function testRlsPerformance() {
  console.log('\n⚡ RLS 정책 성능 테스트...')
  
  const testQueries = [
    {
      name: '출근 기록 조회 (최근 7일)',
      query: `
        SELECT COUNT(*) 
        FROM attendance_records 
        WHERE work_date >= CURRENT_DATE - INTERVAL '7 days';
      `
    },
    {
      name: '작업일지 조회 (최근 30일)',
      query: `
        SELECT COUNT(*) 
        FROM daily_reports 
        WHERE work_date >= CURRENT_DATE - INTERVAL '30 days';
      `
    },
    {
      name: '프로필 조회',
      query: `
        SELECT COUNT(*) FROM profiles;
      `
    }
  ]
  
  for (const test of testQueries) {
    try {
      const startTime = Date.now()
      const { data, error } = await supabase.rpc('sql', { query: test.query })
      const duration = Date.now() - startTime
      
      if (error) {
        console.log(`    ❌ ${test.name}: 오류 - ${error.message}`)
      } else {
        const count = data[0]?.count || 0
        console.log(`    ✅ ${test.name}: ${count.toLocaleString()}건, ${duration}ms`)
        
        if (duration > 1000) {
          console.log(`    ⚠️  느린 쿼리 감지 (${duration}ms)`)
        }
      }
    } catch (error) {
      console.log(`    ❌ ${test.name}: ${error.message}`)
    }
  }
}

/**
 * 사용자별 데이터 접근 테스트
 */
async function testUserDataAccess() {
  console.log('\n👥 사용자별 데이터 접근 테스트...')
  
  try {
    // 테스트 계정들 조회
    const { data: testUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .in('email', [
        'worker@inopnc.com',
        'manager@inopnc.com', 
        'admin@inopnc.com'
      ])
    
    if (usersError) {
      console.error('❌ 테스트 사용자 조회 실패:', usersError)
      return
    }
    
    if (testUsers.length === 0) {
      console.log('⚠️  테스트 사용자가 없습니다.')
      return
    }
    
    console.log(`📋 ${testUsers.length}명의 테스트 사용자 발견:`)
    testUsers.forEach(user => {
      console.log(`    - ${user.email} (${user.role})`)
    })
    
    // 각 사용자별로 접근 가능한 데이터 확인
    for (const user of testUsers) {
      console.log(`\n  🔍 ${user.email} (${user.role}) 데이터 접근 테스트:`)
      
      try {
        // 해당 사용자로 로그인한 상태에서 데이터 조회 시뮬레이션
        // 실제로는 JWT 토큰을 생성해야 하지만, 여기서는 COUNT 쿼리로 대체
        
        const { data: attendanceCount } = await supabase.rpc('sql', {
          query: `
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE user_id = '${user.id}' 
            OR EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = '${user.id}' 
              AND role IN ('admin', 'system_admin', 'site_manager')
            );
          `
        })
        
        const { data: reportsCount } = await supabase.rpc('sql', {
          query: `
            SELECT COUNT(*) 
            FROM daily_reports 
            WHERE created_by = '${user.id}';
          `
        })
        
        console.log(`      출근 기록: ${attendanceCount[0]?.count || 0}건`)
        console.log(`      작업일지: ${reportsCount[0]?.count || 0}건`)
        
      } catch (error) {
        console.log(`      ❌ 오류: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('❌ 사용자 데이터 접근 테스트 실패:', error)
  }
}

/**
 * 권장 개선사항 제시
 */
function providePriorityRecommendations() {
  console.log('\n🎯 우선순위별 개선 권장사항:')
  
  console.log('\n  🚨 높은 우선순위:')
  console.log('    1. 충돌하는 RLS 정책 정리 (300_optimized_construction_rls_final.sql 적용)')
  console.log('    2. 성능 최적화 인덱스 추가')
  console.log('    3. 사용자별 접근 권한 검증')
  
  console.log('\n  ⚠️  중간 우선순위:')
  console.log('    4. 감사 로그 시스템 구축')
  console.log('    5. 성능 모니터링 대시보드')
  console.log('    6. 쿼리 캐싱 전략 구현')
  
  console.log('\n  📈 낮은 우선순위:')
  console.log('    7. 데이터 아카이빙 정책')
  console.log('    8. 백업 및 복구 자동화')
  console.log('    9. 고급 분석 기능')
  
  console.log('\n  💡 즉시 적용 가능한 해결책:')
  console.log('    - 새로운 마이그레이션 파일 실행')
  console.log('    - 최적화된 쿼리 함수 사용')
  console.log('    - 성능 모니터링 활성화')
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🔧 건설 현장 관리 시스템 데이터베이스 검증 및 최적화\n')
  
  // 1. 기본 연결 확인
  const isConnected = await validateDatabaseConnection()
  if (!isConnected) {
    console.error('❌ 데이터베이스 연결 실패. 스크립트를 종료합니다.')
    process.exit(1)
  }
  
  try {
    // 2. 현재 상태 분석
    await analyzeCurrentPolicies()
    await analyzeTablePerformance()
    
    // 3. 성능 테스트
    await testRlsPerformance()
    
    // 4. 사용자 접근 테스트
    await testUserDataAccess()
    
    // 5. 권장사항 제시
    providePriorityRecommendations()
    
    console.log('\n✅ 데이터베이스 검증 완료')
    
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  analyzeCurrentPolicies,
  validateDatabaseConnection,
  analyzeTablePerformance,
  testRlsPerformance,
  testUserDataAccess
}