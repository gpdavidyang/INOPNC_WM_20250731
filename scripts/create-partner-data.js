const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPartnerData() {
  try {
    console.log('🚀 파트너사 데이터 생성 시작...');

    // 1. 파트너사 조직 생성
    const partnerOrganizations = [
      {
        name: '대한건설',
        type: 'partner',
        status: 'active',
        address: '서울특별시 강남구 테헤란로 123',
        phone: '02-555-1234',
        email: 'contact@daehan.co.kr',
        business_number: '123-45-67890',
        representative: '김대한'
      },
      {
        name: '삼성중공업',
        type: 'partner',
        status: 'active',
        address: '서울특별시 송파구 올림픽로 35',
        phone: '02-555-5678',
        email: 'info@samsung-heavy.co.kr',
        business_number: '234-56-78901',
        representative: '이삼성'
      },
      {
        name: '현대엔지니어링',
        type: 'partner',
        status: 'active',
        address: '서울특별시 서초구 반포대로 58',
        phone: '02-555-9012',
        email: 'partner@hyundai-eng.co.kr',
        business_number: '345-67-89012',
        representative: '박현대'
      },
      {
        name: 'SK건설',
        type: 'partner',
        status: 'active',
        address: '서울특별시 종로구 종로 26',
        phone: '02-555-3456',
        email: 'contact@sk-const.co.kr',
        business_number: '456-78-90123',
        representative: '최에스'
      },
      {
        name: 'LG엔지니어링',
        type: 'partner',
        status: 'pending',
        address: '서울특별시 영등포구 여의대로 128',
        phone: '02-555-7890',
        email: 'info@lg-eng.co.kr',
        business_number: '567-89-01234',
        representative: '구엘지'
      },
      {
        name: '포스코건설',
        type: 'partner',
        status: 'active',
        address: '경상북도 포항시 남구 대송로 180',
        phone: '054-220-0114',
        email: 'partner@posco-enc.com',
        business_number: '678-90-12345',
        representative: '최포스'
      },
      {
        name: 'GS건설',
        type: 'partner',
        status: 'inactive',
        address: '서울특별시 강남구 논현로 508',
        phone: '02-555-4567',
        email: 'contact@gs-const.co.kr',
        business_number: '789-01-23456',
        representative: '허지에스'
      },
      {
        name: '대림산업',
        type: 'partner',
        status: 'active',
        address: '서울특별시 종로구 통일로 266',
        phone: '02-2011-8000',
        email: 'info@daelim.co.kr',
        business_number: '890-12-34567',
        representative: '이대림'
      }
    ];

    // organizations 테이블에 파트너사 추가 (business_number 제거)
    const partnerOrgsSimple = partnerOrganizations.map(org => ({
      name: org.name,
      type: org.type,
      status: org.status,
      address: org.address,
      phone: org.phone,
      email: org.email
    }));

    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .upsert(partnerOrgsSimple, { onConflict: 'name' })
      .select();

    if (orgError) {
      console.error('❌ 조직 생성 오류:', orgError);
      return;
    }

    console.log(`✅ ${orgs.length}개 파트너사 조직 생성 완료`);

    // 2. 파트너사 담당자 프로필 생성
    const partnerUsers = [
      {
        email: 'kim.daehan@daehan.co.kr',
        name: '김대한',
        phone: '010-1234-5678',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '대한건설')?.id,
        status: 'active'
      },
      {
        email: 'lee.samsung@samsung-heavy.co.kr',
        name: '이삼성',
        phone: '010-2345-6789',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '삼성중공업')?.id,
        status: 'active'
      },
      {
        email: 'park.hyundai@hyundai-eng.co.kr',
        name: '박현대',
        phone: '010-3456-7890',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '현대엔지니어링')?.id,
        status: 'active'
      },
      {
        email: 'choi.sk@sk-const.co.kr',
        name: '최에스',
        phone: '010-4567-8901',
        role: 'partner',
        organization_id: orgs.find(o => o.name === 'SK건설')?.id,
        status: 'active'
      },
      {
        email: 'gu.lg@lg-eng.co.kr',
        name: '구엘지',
        phone: '010-5678-9012',
        role: 'partner',
        organization_id: orgs.find(o => o.name === 'LG엔지니어링')?.id,
        status: 'pending'
      },
      {
        email: 'choi.posco@posco-enc.com',
        name: '최포스',
        phone: '010-6789-0123',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '포스코건설')?.id,
        status: 'active'
      },
      {
        email: 'heo.gs@gs-const.co.kr',
        name: '허지에스',
        phone: '010-7890-1234',
        role: 'partner',
        organization_id: orgs.find(o => o.name === 'GS건설')?.id,
        status: 'inactive'
      },
      {
        email: 'lee.daelim@daelim.co.kr',
        name: '이대림',
        phone: '010-8901-2345',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '대림산업')?.id,
        status: 'active'
      },
      // 추가 담당자들
      {
        email: 'jung.daehan@daehan.co.kr',
        name: '정대한',
        phone: '010-1111-2222',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '대한건설')?.id,
        status: 'active'
      },
      {
        email: 'kim.samsung@samsung-heavy.co.kr',
        name: '김삼성',
        phone: '010-3333-4444',
        role: 'partner',
        organization_id: orgs.find(o => o.name === '삼성중공업')?.id,
        status: 'active'
      }
    ];

    // Auth 사용자 생성 (이메일/패스워드)
    for (const user of partnerUsers) {
      try {
        // Auth 사용자 생성
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'partner123!',
          email_confirm: true
        });

        if (authError) {
          console.log(`⚠️ Auth 사용자 ${user.email} 이미 존재하거나 생성 실패:`, authError.message);
          
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
            
            if (profileError) {
              console.error(`❌ 프로필 업데이트 실패 ${user.email}:`, profileError);
            } else {
              console.log(`✅ 프로필 업데이트 완료: ${user.name}`);
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

          if (profileError) {
            console.error(`❌ 프로필 생성 실패 ${user.email}:`, profileError);
          } else {
            console.log(`✅ 파트너 담당자 생성 완료: ${user.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ 사용자 생성 중 오류 ${user.email}:`, error);
      }
    }

    // 3. 파트너사와 현장 연결 (site_partners 테이블 생성 필요시)
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(3);

    if (sites && sites.length > 0) {
      const sitePartners = [];
      
      // 각 현장에 2-3개 파트너사 배정
      sites.forEach((site, index) => {
        const partnerSubset = orgs.slice(index * 2, (index * 2) + 3);
        partnerSubset.forEach(partner => {
          if (partner) {
            sitePartners.push({
              site_id: site.id,
              partner_id: partner.id,
              status: 'active',
              contract_start: new Date(2024, 0, 1).toISOString(),
              contract_end: new Date(2025, 11, 31).toISOString()
            });
          }
        });
      });

      // site_partners 테이블이 있다면 데이터 삽입
      try {
        const { error: spError } = await supabase
          .from('site_partners')
          .upsert(sitePartners);
        
        if (spError) {
          console.log('ℹ️ site_partners 테이블이 없거나 접근 불가:', spError.message);
        } else {
          console.log(`✅ ${sitePartners.length}개 현장-파트너사 연결 완료`);
        }
      } catch (error) {
        console.log('ℹ️ 현장-파트너사 연결 스킵 (테이블 없음)');
      }
    }

    // 4. 파트너사 계약 정보 (contracts 테이블이 있다면)
    const contracts = orgs.map((org, index) => ({
      partner_id: org.id,
      contract_number: `INOP-2024-${String(index + 1).padStart(4, '0')}`,
      contract_type: ['construction', 'maintenance', 'supply', 'consulting'][index % 4],
      start_date: new Date(2024, index % 12, 1).toISOString(),
      end_date: new Date(2025, (index + 6) % 12, 28).toISOString(),
      contract_amount: (1000000000 + (index * 500000000)), // 10억 ~ 45억
      status: ['active', 'pending', 'completed'][index % 3],
      description: `${org.name} 연간 계약`
    }));

    try {
      const { error: contractError } = await supabase
        .from('contracts')
        .upsert(contracts);
      
      if (contractError) {
        console.log('ℹ️ contracts 테이블이 없거나 접근 불가:', contractError.message);
      } else {
        console.log(`✅ ${contracts.length}개 계약 정보 생성 완료`);
      }
    } catch (error) {
      console.log('ℹ️ 계약 정보 생성 스킵 (테이블 없음)');
    }

    console.log('\n=================================');
    console.log('✨ 파트너사 데이터 생성 완료!');
    console.log('=================================');
    console.log('\n📋 생성된 파트너사:');
    orgs.forEach(org => {
      console.log(`  - ${org.name} (${org.status})`);
    });
    console.log('\n🔑 파트너 담당자 로그인 정보:');
    console.log('  이메일: [위 목록 참조]');
    console.log('  패스워드: partner123!');
    
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

createPartnerData();