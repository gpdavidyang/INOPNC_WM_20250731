const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixSiteOrganization() {
  try {
    console.log('Fixing site-organization relationships...')
    
    // 1. 이노피앤씨 organization 확인 또는 생성
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', '이노피앤씨')
      .single()
    
    if (orgError || !org) {
      console.log('Creating 이노피앤씨 organization...')
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: '이노피앤씨',
          type: 'department',
          is_active: true
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating organization:', createError)
        return
      }
      org = newOrg
    }
    
    console.log('Organization:', org)
    
    // 2. 모든 active 사이트에 organization_id 설정
    const { error: updateSitesError } = await supabase
      .from('sites')
      .update({ organization_id: org.id })
      .eq('status', 'active')
      .is('organization_id', null)
    
    if (updateSitesError) {
      console.error('Error updating sites:', updateSitesError)
      return
    }
    
    console.log('Sites updated with organization_id')
    
    // 3. 사용자들에게도 organization_id 설정
    const { error: updateProfilesError } = await supabase
      .from('profiles')
      .update({ organization_id: org.id })
      .in('email', ['worker@inopnc.com', 'manager@inopnc.com', 'admin@inopnc.com'])
    
    if (updateProfilesError) {
      console.error('Error updating profiles:', updateProfilesError)
      return
    }
    
    console.log('Profiles updated with organization_id')
    
    // 4. 최종 확인
    const { data: finalCheck } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .eq('status', 'active')
      .limit(5)
    
    console.log('Final site check:', JSON.stringify(finalCheck, null, 2))
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

fixSiteOrganization()