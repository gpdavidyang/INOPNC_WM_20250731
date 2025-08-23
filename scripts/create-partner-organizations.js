const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPartnerOrganizations() {
  try {
    console.log('🚀 파트너사 조직 생성 시작...');

    // 파트너사 조직 데이터 (branch_office 타입 사용)
    const partnerOrganizations = [
      {
        name: '대한건설',
        type: 'branch_office',
        description: '대한건설 - 건설 시공 전문 파트너사',
        address: '서울특별시 강남구 테헤란로 123',
        phone: '02-555-1234',
        is_active: true
      },
      {
        name: '삼성중공업',
        type: 'branch_office',
        description: '삼성중공업 - 중공업 및 플랜트 전문',
        address: '서울특별시 송파구 올림픽로 35',
        phone: '02-555-5678',
        is_active: true
      },
      {
        name: '현대엔지니어링',
        type: 'branch_office',
        description: '현대엔지니어링 - 엔지니어링 솔루션 제공',
        address: '서울특별시 서초구 반포대로 58',
        phone: '02-555-9012',
        is_active: true
      },
      {
        name: 'SK건설',
        type: 'branch_office',
        description: 'SK건설 - 인프라 및 건축 전문',
        address: '서울특별시 종로구 종로 26',
        phone: '02-555-3456',
        is_active: true
      },
      {
        name: 'LG엔지니어링',
        type: 'branch_office',
        description: 'LG엔지니어링 - 스마트 건설 솔루션',
        address: '서울특별시 영등포구 여의대로 128',
        phone: '02-555-7890',
        is_active: false  // 비활성 상태로 설정
      },
      {
        name: '포스코건설',
        type: 'branch_office',
        description: '포스코건설 - 철강 구조물 전문',
        address: '경상북도 포항시 남구 대송로 180',
        phone: '054-220-0114',
        is_active: true
      },
      {
        name: 'GS건설',
        type: 'branch_office',
        description: 'GS건설 - 종합 건설 서비스',
        address: '서울특별시 강남구 논현로 508',
        phone: '02-555-4567',
        is_active: false  // 비활성 상태로 설정
      },
      {
        name: '대림산업',
        type: 'branch_office',
        description: '대림산업 - 건설 및 석유화학 플랜트',
        address: '서울특별시 종로구 통일로 266',
        phone: '02-2011-8000',
        is_active: true
      },
      {
        name: '롯데건설',
        type: 'branch_office',
        description: '롯데건설 - 주거 및 상업시설 전문',
        address: '서울특별시 서초구 잠원로14길 29',
        phone: '02-3480-9000',
        is_active: true
      },
      {
        name: '두산건설',
        type: 'branch_office',
        description: '두산건설 - 중장비 및 건설 엔지니어링',
        address: '서울특별시 강남구 언주로 726',
        phone: '02-3398-8114',
        is_active: true
      }
    ];

    // organizations 테이블에 파트너사 추가
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .insert(partnerOrganizations)
      .select();

    if (orgError) {
      console.error('❌ 조직 생성 오류:', orgError);
      return;
    }

    console.log(`✅ ${orgs.length}개 파트너사 조직 생성 완료`);
    
    console.log('\n📋 생성된 파트너사 목록:');
    orgs.forEach(org => {
      console.log(`  - ${org.name} (${org.is_active ? '활성' : '비활성'})`);
      console.log(`    주소: ${org.address}`);
      console.log(`    전화: ${org.phone}`);
    });

    // 파트너사 담당자 사용자 생성
    console.log('\n👥 파트너사 담당자 프로필 생성 중...');
    
    const partnerUsers = [
      {
        email: 'kim.daehan@partner.com',
        name: '김대한',
        phone: '010-1234-5678',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '대한건설')?.id,
        status: 'active'
      },
      {
        email: 'lee.samsung@partner.com',
        name: '이삼성',
        phone: '010-2345-6789',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '삼성중공업')?.id,
        status: 'active'
      },
      {
        email: 'park.hyundai@partner.com',
        name: '박현대',
        phone: '010-3456-7890',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '현대엔지니어링')?.id,
        status: 'active'
      },
      {
        email: 'choi.sk@partner.com',
        name: '최에스',
        phone: '010-4567-8901',
        role: 'partner',
        organization_id: orgs.find(o => o.name === 'SK건설')?.id,
        status: 'active'
      },
      {
        email: 'koo.lg@partner.com',
        name: '구엘지',
        phone: '010-5678-9012',
        role: 'partner',
        organization_id: orgs.find(o => o.name === 'LG엔지니어링')?.id,
        status: 'pending'
      },
      {
        email: 'choi.posco@partner.com',
        name: '최포스',
        phone: '010-6789-0123',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '포스코건설')?.id,
        status: 'active'
      },
      {
        email: 'jung.lotte@partner.com',
        name: '정롯데',
        phone: '010-7890-1234',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '롯데건설')?.id,
        status: 'active'
      },
      {
        email: 'kim.doosan@partner.com',
        name: '김두산',
        phone: '010-8901-2345',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '두산건설')?.id,
        status: 'active'
      }
    ];

    // Auth 사용자 생성 (이메일/패스워드)
    let createdUsers = 0;
    let updatedUsers = 0;
    
    for (const user of partnerUsers) {
      try {
        // Auth 사용자 생성
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'partner123!',
          email_confirm: true
        });

        if (authError) {
          // 이미 존재하는 경우 해당 사용자 찾기
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === user.email);
          
          if (existingUser) {
            // 프로필 업데이트
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: existingUser.id,
                ...user,
                updated_at: new Date().toISOString()
              });
            
            if (!profileError) {
              updatedUsers++;
              console.log(`  ✅ 프로필 업데이트: ${user.name} (${user.email})`);
            }
          }
        } else if (authUser?.user) {
          // 새 사용자 프로필 생성
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authUser.user.id,
              ...user,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (!profileError) {
            createdUsers++;
            console.log(`  ✅ 파트너 담당자 생성: ${user.name} (${user.email})`);
          }
        }
      } catch (error) {
        console.error(`  ⚠️ 사용자 처리 중 오류 ${user.email}:`, error.message);
      }
    }

    console.log(`\n📊 결과 요약:`);
    console.log(`  - 생성된 조직: ${orgs.length}개`);
    console.log(`  - 생성된 사용자: ${createdUsers}명`);
    console.log(`  - 업데이트된 사용자: ${updatedUsers}명`);

    console.log('\n=================================');
    console.log('✨ 파트너사 데이터 생성 완료!');
    console.log('=================================');
    console.log('\n🔑 파트너 담당자 로그인 정보:');
    console.log('  이메일: [위 목록 참조]');
    console.log('  패스워드: partner123!');
    console.log('\n💡 시스템 관리자 페이지에서 "파트너사 관리" 메뉴를 확인하세요.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 환경 변수 확인
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경 변수를 설정해주세요:');
  console.error('NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"');
  console.error('SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

createPartnerOrganizations();