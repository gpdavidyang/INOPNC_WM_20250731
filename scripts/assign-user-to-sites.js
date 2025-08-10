const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function assignUserToSites() {
  try {
    // 1. 먼저 테스트 사용자들의 정보를 확인
    console.log('Getting test users...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, role, site_id, organization_id')
      .in('email', ['worker@inopnc.com', 'manager@inopnc.com', 'admin@inopnc.com'])
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }
    
    console.log('Current users:', JSON.stringify(users, null, 2))
    
    // 2. 사이트 하나를 가져옴
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(1)
    
    if (sitesError || !sites || sites.length === 0) {
      console.error('Error fetching sites or no sites found:', sitesError)
      return
    }
    
    const targetSite = sites[0]
    console.log('Target site:', targetSite)
    
    // 3. 사용자들에게 사이트 할당
    console.log('Assigning users to site...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ site_id: targetSite.id })
      .in('email', ['worker@inopnc.com', 'manager@inopnc.com'])
    
    if (updateError) {
      console.error('Error updating profiles:', updateError)
      return
    }
    
    console.log('Successfully assigned users to site:', targetSite.name)
    
    // 4. 업데이트된 사용자 정보 확인
    const { data: updatedUsers } = await supabase
      .from('profiles')
      .select('id, email, role, site_id')
      .in('email', ['worker@inopnc.com', 'manager@inopnc.com'])
    
    console.log('Updated users:', JSON.stringify(updatedUsers, null, 2))
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

assignUserToSites()