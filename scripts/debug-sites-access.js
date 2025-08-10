const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugSitesAccess() {
  try {
    console.log('=== DEBUGGING SITES ACCESS ===\n')
    
    // 1. 모든 사이트 확인 (RLS 우회)
    console.log('1. ALL SITES IN DATABASE:')
    const { data: allSites, error: allSitesError } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allSitesError) {
      console.error('Error fetching all sites:', allSitesError)
    } else {
      console.log(`Total sites: ${allSites.length}`)
      allSites.forEach(site => {
        console.log(`- ${site.name} (${site.id}) - status: ${site.status}, org_id: ${site.organization_id}`)
      })
    }
    
    // 2. Active 사이트만 확인
    console.log('\n2. ACTIVE SITES:')
    const { data: activeSites, error: activeSitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'active')
    
    if (activeSitesError) {
      console.error('Error fetching active sites:', activeSitesError)
    } else {
      console.log(`Active sites: ${activeSites.length}`)
      activeSites.forEach(site => {
        console.log(`- ${site.name} (${site.id})`)
      })
    }
    
    // 3. 테스트 사용자 정보 확인
    console.log('\n3. TEST USERS:')
    const testEmails = ['worker@inopnc.com', 'manager@inopnc.com', 'admin@inopnc.com']
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .in('email', testEmails)
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
    } else {
      users.forEach(user => {
        console.log(`\n${user.email}:`)
        console.log(`  - role: ${user.role}`)
        console.log(`  - site_id: ${user.site_id}`)
        console.log(`  - organization_id: ${user.organization_id}`)
      })
    }
    
    // 4. Organization 확인
    console.log('\n4. ORGANIZATIONS:')
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
    
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
    } else {
      orgs.forEach(org => {
        console.log(`- ${org.name} (${org.id}) - type: ${org.type}`)
      })
    }
    
    // 5. RLS 정책 함수 테스트 (worker@inopnc.com으로)
    console.log('\n5. TESTING RLS WITH worker@inopnc.com:')
    const workerUser = users?.find(u => u.email === 'worker@inopnc.com')
    if (workerUser) {
      // user_site_ids() 함수가 반환하는 사이트 확인
      const { data: workerSites, error: workerSitesError } = await supabase
        .rpc('user_site_ids', {}, {
          // RLS 컨텍스트를 worker 사용자로 설정
          headers: {
            'x-supabase-auth': workerUser.id
          }
        })
      
      if (workerSitesError) {
        console.log('user_site_ids() function might not exist or error:', workerSitesError.message)
      } else {
        console.log('Sites accessible by worker:', workerSites)
      }
    }
    
    // 6. 실제 쿼리 테스트 (anon key로)
    console.log('\n6. TESTING WITH ANON KEY (simulating client):')
    const anonSupabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // 먼저 worker@inopnc.com으로 로그인
    const { data: { user }, error: authError } = await anonSupabase.auth.signInWithPassword({
      email: 'worker@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('Auth error:', authError)
    } else {
      console.log('Logged in as:', user.email)
      
      // 이제 sites 쿼리
      const { data: clientSites, error: clientError } = await anonSupabase
        .from('sites')
        .select('*')
        .eq('status', 'active')
      
      if (clientError) {
        console.error('Client query error:', clientError)
      } else {
        console.log(`Sites visible to client: ${clientSites?.length || 0}`)
        clientSites?.forEach(site => {
          console.log(`- ${site.name}`)
        })
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

debugSitesAccess()