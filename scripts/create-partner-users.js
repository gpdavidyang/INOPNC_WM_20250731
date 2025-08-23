const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPartnerUsers() {
  console.log('👥 파트너사 담당자 생성 시작...');
  
  try {
    // 파트너사 조회
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('type', 'branch_office');

    if (orgError) {
      console.error('❌ 파트너사 조회 실패:', orgError);
      return;
    }

    console.log(`📊 ${organizations.length}개 파트너사에 담당자 생성 중...`);

    const partnerUsers = [];
    
    // 각 파트너사별 담당자 정의
    const companyUsers = {
      '대한건설(주)': [
        { name: '김민수', position: '대표이사', department: '경영관리' },
        { name: '이지훈', position: '부장', department: '현장관리팀' }
      ],
      '서울전기공사': [
        { name: '박서연', position: '대표이사', department: '경영관리' },
        { name: '최하은', position: '과장', department: '공사팀' }
      ],
      '한국배관시스템': [
        { name: '정준호', position: '대표이사', department: '경영관리' }
      ],
      '그린인테리어': [
        { name: '강수진', position: '대표이사', department: '경영관리' },
        { name: '조영호', position: '팀장', department: '디자인팀' }
      ],
      '안전건설산업': [
        { name: '윤미경', position: '대표이사', department: '경영관리' }
      ],
      '미래철골공업': [
        { name: '장성민', position: '대표이사', department: '경영관리' },
        { name: '임은주', position: '차장', department: '생산관리팀' }
      ],
      '동양방수기술': [
        { name: '김재현', position: '대표이사', department: '경영관리' }
      ],
      '현대타일시공': [
        { name: '이수빈', position: '대표이사', department: '경영관리' },
        { name: '박동현', position: '과장', department: '시공팀' }
      ]
    };
    
    for (const org of organizations) {
      const users = companyUsers[org.name] || [
        { name: getRandomKoreanName(), position: '대표이사', department: '경영관리' }
      ];
      
      users.forEach((user, index) => {
        const emailPrefix = getEmailPrefix(org.name);
        const email = `${emailPrefix}${index + 1}@partner.com`;
        
        partnerUsers.push({
          email: email,
          full_name: user.name,
          phone: generatePhoneNumber(),
          role: 'partner',
          organization_id: org.id,
          job_title: user.position,  // position 대신 job_title 사용
          company: org.name,  // 회사명 추가
          status: 'active'
        });
      });
    }

    // 파트너 사용자 계정 생성
    let successCount = 0;
    let failCount = 0;
    
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
          // 이미 존재하는 경우 프로필만 업데이트
          if (authError.message.includes('already registered')) {
            console.log(`⚠️ ${user.email} 이미 존재 - 프로필 업데이트 시도`);
            
            // 기존 사용자 찾기
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === user.email);
            
            if (existingUser) {
              // 프로필 업데이트
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: existingUser.id,
                  email: user.email,
                  full_name: user.full_name,
                  phone: user.phone,
                  role: user.role,
                  organization_id: user.organization_id,
                  job_title: user.job_title,
                  company: user.company,
                  status: user.status
                });
              
              if (!profileError) {
                console.log(`✅ ${user.full_name} (${user.email}) - 프로필 업데이트 완료`);
                successCount++;
              }
            }
          } else {
            console.log(`❌ ${user.email} Auth 생성 실패:`, authError.message);
            failCount++;
          }
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
            job_title: user.job_title,
            company: user.company,
            status: user.status
          });

        if (profileError) {
          console.log(`⚠️ ${user.email} 프로필 생성 실패:`, profileError.message);
          failCount++;
        } else {
          console.log(`✅ ${user.full_name} (${user.email}) - ${user.company} ${user.job_title}`);
          successCount++;
        }

      } catch (error) {
        console.error(`❌ ${user.email} 처리 중 오류:`, error.message);
        failCount++;
      }
    }

    // 최종 통계
    console.log('\n📊 생성 완료 통계:');
    console.log(`  - 생성 시도: ${partnerUsers.length}명`);
    console.log(`  - 성공: ${successCount}명`);
    console.log(`  - 실패: ${failCount}명`);
    
    const { count: partnerProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'partner');

    console.log(`  - 전체 파트너 담당자: ${partnerProfiles}명`);
    
    console.log('\n✨ 파트너 담당자 생성 완료!');
    console.log('\n💡 파트너 담당자 로그인 정보:');
    console.log('   예시) daehan1@partner.com / partner123!');
    console.log('   예시) seoul-electric1@partner.com / partner123!');
    
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
  
  // 기타 파트너사 처리
  return nameMap[companyName] || companyName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10);
}

// 실행
createPartnerUsers();