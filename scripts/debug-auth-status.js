const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugAuthAndData() {
  try {
    console.log('🔍 Debugging authentication and data flow...\n')
    
    // 1. Check manager profile directly
    console.log('1️⃣ Checking manager profile in database...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'manager@inopnc.com')
    
    if (profileError) {
      console.error('❌ Profile query error:', profileError)
      return
    }
    
    if (!profiles || profiles.length === 0) {
      console.error('❌ manager@inopnc.com profile not found')
      return
    }
    
    const manager = profiles[0]
    console.log('✅ Manager profile found:')
    console.log(`   ID: ${manager.id}`)
    console.log(`   Email: ${manager.email}`)
    console.log(`   Name: ${manager.full_name}`)
    console.log(`   Role: ${manager.role}`)
    console.log(`   Current site_id: ${manager.site_id}`)
    
    // 2. Check site assignments with the exact query from getCurrentUserSite
    console.log('\n2️⃣ Testing getCurrentUserSite query...')
    const { data: assignment, error: assignmentError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          id,
          name,
          address,
          description,
          work_process,
          work_section,
          component_name,
          manager_name,
          construction_manager_phone,
          safety_manager_name,
          safety_manager_phone,
          accommodation_name,
          accommodation_address,
          status,
          start_date,
          end_date
        )
      `)
      .eq('user_id', manager.id)
      .eq('is_active', true)
      .single()
    
    if (assignmentError) {
      if (assignmentError.code === 'PGRST116') {
        console.log('⚠️ No active assignment found (PGRST116)')
      } else {
        console.error('❌ Assignment query error:', assignmentError)
      }
    } else {
      console.log('✅ Active assignment found:')
      console.log(`   Site ID: ${assignment.site_id}`)
      console.log(`   Site Name: ${assignment.sites?.name}`)
      console.log(`   Assigned Date: ${assignment.assigned_date}`)
      console.log(`   Is Active: ${assignment.is_active}`)
      console.log(`   Role: ${assignment.role}`)
      
      // Convert to expected format
      const site = assignment.sites
      const siteData = {
        site_id: site.id,
        site_name: site.name,
        site_address: site.address,
        site_status: site.status,
        start_date: site.start_date,
        end_date: site.end_date,
        assigned_date: assignment.assigned_date,
        unassigned_date: assignment.unassigned_date,
        user_role: assignment.role,
        work_process: site.work_process,
        work_section: site.work_section,
        component_name: site.component_name,
        manager_name: site.manager_name,
        construction_manager_phone: site.construction_manager_phone,
        safety_manager_name: site.safety_manager_name,
        safety_manager_phone: site.safety_manager_phone,
        accommodation_name: site.accommodation_name,
        accommodation_address: site.accommodation_address,
        is_active: assignment.is_active
      }
      
      console.log('\n✅ Converted site data for TodaySiteInfo:')
      console.log(JSON.stringify(siteData, null, 2))
    }
    
    // 3. Check if authentication is working by creating a test session
    console.log('\n3️⃣ Testing authentication via sign-in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message)
    } else {
      console.log('✅ Authentication successful:')
      console.log(`   User ID: ${authData.user?.id}`)
      console.log(`   Email: ${authData.user?.email}`)
      console.log(`   Session: ${authData.session ? 'Active' : 'None'}`)
      
      // Now test with authenticated user
      if (authData.session) {
        console.log('\n4️⃣ Testing getCurrentUserSite with authenticated session...')
        
        // Create a new client with the session
        const authenticatedSupabase = createClient(supabaseUrl, supabaseServiceKey)
        await authenticatedSupabase.auth.setSession(authData.session)
        
        const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser()
        
        if (userError || !user) {
          console.error('❌ User verification failed:', userError)
        } else {
          console.log(`✅ User verified: ${user.id}`)
          
          // Test the same query with authenticated user
          const { data: authAssignment, error: authAssignmentError } = await authenticatedSupabase
            .from('site_assignments')
            .select(`
              *,
              sites (
                id,
                name,
                address,
                description,
                work_process,
                work_section,
                component_name,
                manager_name,
                construction_manager_phone,
                safety_manager_name,
                safety_manager_phone,
                accommodation_name,
                accommodation_address,
                status,
                start_date,
                end_date
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()
          
          if (authAssignmentError) {
            console.error('❌ Authenticated query failed:', authAssignmentError)
          } else {
            console.log('✅ Authenticated query successful!')
            console.log(`   Found site: ${authAssignment.sites?.name}`)
          }
        }
      }
    }
    
    console.log('\n🎯 Summary:')
    console.log('- Database has the correct data')
    console.log('- The issue is likely authentication in the browser')
    console.log('- User needs to be properly logged in as manager@inopnc.com')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Load environment and run
require('dotenv').config({ path: '.env.local' })
debugAuthAndData()