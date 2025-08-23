const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPartnerOrganizations() {
  console.log('🏢 파트너사 데이터 생성 시작...');
  
  try {
    // 파트너사 데이터
    const partnerOrganizations = [
      {
        name: '대한건설(주)',
        type: 'branch_office',
        description: '종합건설업체 - 토목, 건축 전문',
        address: '서울시 강남구 테헤란로 123 대한빌딩 15층',
        phone: '02-555-1234',
        is_active: true
      },
      {
        name: '서울전기공사',
        type: 'branch_office',
        description: '전기공사 전문업체 - 고압/저압 전기설비',
        address: '서울시 송파구 올림픽로 456',
        phone: '02-666-5678',
        is_active: true
      },
      {
        name: '한국배관시스템',
        type: 'branch_office',
        description: '기계설비 및 배관공사 전문',
        address: '경기도 성남시 분당구 판교로 789',
        phone: '031-777-9012',
        is_active: true
      },
      {
        name: '그린인테리어',
        type: 'branch_office',
        description: '친환경 인테리어 및 마감공사',
        address: '서울시 서초구 반포대로 321',
        phone: '02-888-3456',
        is_active: true
      },
      {
        name: '안전건설산업',
        type: 'branch_office',
        description: '건설 안전관리 및 시설물 유지보수',
        address: '인천시 연수구 송도대로 654',
        phone: '032-999-7890',
        is_active: true
      },
      {
        name: '미래철골공업',
        type: 'branch_office',
        description: '철골 제작 및 설치 전문',
        address: '경기도 화성시 동탄대로 987',
        phone: '031-222-4567',
        is_active: false
      },
      {
        name: '동양방수기술',
        type: 'branch_office',
        description: '방수 및 단열공사 전문업체',
        address: '서울시 구로구 디지털로 111',
        phone: '02-333-8901',
        is_active: true
      },
      {
        name: '현대타일시공',
        type: 'branch_office',
        description: '타일 및 석재 시공 전문',
        address: '경기도 용인시 수지구 포은대로 222',
        phone: '031-444-2345',
        is_active: true
      }
    ];

    console.log(`📝 ${partnerOrganizations.length}개 파트너사 생성 중...`);

    // 기존 파트너사 확인
    const { data: existingOrgs, error: checkError } = await supabase
      .from('organizations')
      .select('name')
      .eq('type', 'branch_office');

    if (checkError) {
      console.error('❌ 기존 데이터 확인 실패:', checkError);
      return;
    }

    const existingNames = existingOrgs?.map(org => org.name) || [];
    const newOrganizations = partnerOrganizations.filter(
      org => !existingNames.includes(org.name)
    );

    if (newOrganizations.length === 0) {
      console.log('ℹ️ 모든 파트너사가 이미 존재합니다.');
      return;
    }

    // 파트너사 생성
    const { data: createdOrgs, error: createError } = await supabase
      .from('organizations')
      .insert(newOrganizations)
      .select();

    if (createError) {
      console.error('❌ 파트너사 생성 실패:', createError);
      return;
    }

    console.log(`✅ ${createdOrgs.length}개 파트너사 생성 완료`);

    // 파트너사별 담당자 생성
    console.log('\n👥 파트너사 담당자 생성 중...');

    const partnerUsers = [];
    
    for (const org of createdOrgs) {
      // 각 파트너사마다 1-2명의 담당자 생성
      const userCount = Math.random() > 0.5 ? 2 : 1;
      
      for (let i = 0; i < userCount; i++) {
        const isMainContact = i === 0;
        const userName = getRandomKoreanName();
        // 회사명을 영문으로 변환
        const emailPrefix = getEmailPrefix(org.name);
        const email = `${emailPrefix}${i + 1}@partner.com`;
        
        partnerUsers.push({
          email: email,
          full_name: userName,
          phone: generatePhoneNumber(),
          role: 'partner',
          organization_id: org.id,
          department: isMainContact ? '대표' : '현장관리팀',
          position: isMainContact ? '대표이사' : '과장',
          status: 'active'
        });
      }
    }

    // 파트너 사용자 계정 생성
    for (const user of partnerUsers) {
      try {
        // Supabase Auth에 사용자 생성
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'partner123!',
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            phone: user.phone,
            role: user.role
          }
        });

        if (authError) {
          console.log(`⚠️ ${user.email} Auth 생성 실패 (이미 존재할 수 있음):`, authError.message);
          continue;
        }

        // 프로필 생성
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            role: user.role,
            organization_id: user.organization_id,
            department: user.department,
            position: user.position,
            status: user.status
          });

        if (profileError) {
          console.log(`⚠️ ${user.email} 프로필 생성 실패:`, profileError.message);
        } else {
          console.log(`✅ ${user.full_name} (${user.email}) - ${user.department} ${user.position}`);
        }

      } catch (error) {
        console.error(`❌ ${user.email} 처리 중 오류:`, error.message);
      }
    }

    // 최종 통계
    console.log('\n📊 생성 완료 통계:');
    const { count: totalOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .eq('type', 'branch_office');
    
    const { count: activeOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .eq('type', 'branch_office')
      .eq('is_active', true);

    const { count: partnerProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'partner');

    console.log(`  - 전체 파트너사: ${totalOrgs}개`);
    console.log(`  - 활성 파트너사: ${activeOrgs}개`);
    console.log(`  - 파트너 담당자: ${partnerProfiles}명`);
    
    console.log('\n✨ 파트너사 데이터 생성 완료!');
    console.log('💡 파트너 담당자 로그인 정보:');
    console.log('   - 이메일: [회사명]1@partner.com 또는 [회사명]2@partner.com');
    console.log('   - 비밀번호: partner123!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 한국인 이름 생성 함수
function getRandomKoreanName() {
  const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
  const firstNames = [
    '민수', '지훈', '서연', '하은', '준호', '수진', '영호', '미경', '성민', '은주',
    '재현', '수빈', '동현', '지영', '태웅', '혜진', '상우', '민지', '건우', '서현'
  ];
  
  return lastNames[Math.floor(Math.random() * lastNames.length)] + 
         firstNames[Math.floor(Math.random() * firstNames.length)];
}

// 전화번호 생성 함수
function generatePhoneNumber() {
  const prefix = ['010', '011', '016', '017', '018', '019'][Math.floor(Math.random() * 6)];
  const middle = Math.floor(Math.random() * 9000) + 1000;
  const last = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${middle}-${last}`;
}

// 회사명을 영문 이메일 prefix로 변환
function getEmailPrefix(companyName) {
  const nameMap = {
    '대한건설(주)': 'daehan',
    '서울전기공사': 'seoul-electric',
    '한국배관시스템': 'korea-piping',
    '그린인테리어': 'green-interior',
    '안전건설산업': 'safety-const',
    '미래철골공업': 'mirae-steel',
    '동양방수기술': 'dongyang-water',
    '현대타일시공': 'hyundai-tile'
  };
  
  return nameMap[companyName] || companyName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// 실행
createPartnerOrganizations();