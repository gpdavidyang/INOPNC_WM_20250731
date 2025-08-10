const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSites() {
  console.log('🔍 현재 사이트 조회 중...');
  
  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, name, status')
    .order('name');

  if (error) {
    console.error('❌ 조회 실패:', error.message);
    return;
  }

  console.log(`✅ 총 ${sites.length}개 사이트 발견:`);
  sites.forEach(site => {
    console.log(`   - ${site.name} (${site.status}) [${site.id}]`);
  });

  // 프로필도 확인
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('role, full_name');

  if (profileError) {
    console.error('❌ 프로필 조회 실패:', profileError.message);
    return;
  }

  console.log(`\n👥 총 ${profiles.length}명 사용자:`);
  profiles.forEach(profile => {
    console.log(`   - ${profile.full_name} (${profile.role}) [${profile.email}]`);
  });
}

checkSites();