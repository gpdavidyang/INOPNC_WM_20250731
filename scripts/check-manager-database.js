import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check .env.local')
  process.exit(1)
}

// Use service role to bypass RLS for debugging
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkManagerDatabase() {
  console.log('🔍 Checking manager@inopnc.com database status...\n')
  console.log('='.repeat(60))

  try {
    // 1. Check if manager@inopnc.com user exists
    console.log('\n📌 Step 1: Checking manager@inopnc.com user profile...')
    const { data: managerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'manager@inopnc.com')
      .single()

    if (profileError || !managerProfile) {
      console.log('❌ User not found:', profileError?.message)
      
      // Try to find users with similar emails
      console.log('\n🔍 Looking for similar users...')
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .ilike('email', '%manager%')
      
      if (allProfiles && allProfiles.length > 0) {
        console.log('Found users with "manager" in email:')
        allProfiles.forEach(p => {
          console.log(`  - ${p.email} (${p.full_name}) [${p.role}]`)
        })
      }
      return
    }

    console.log('✅ User found:')
    console.log(`  - ID: ${managerProfile.id}`)
    console.log(`  - Email: ${managerProfile.email}`)
    console.log(`  - Name: ${managerProfile.full_name}`)
    console.log(`  - Role: ${managerProfile.role}`)
    console.log(`  - Status: ${managerProfile.status}`)
    console.log(`  - Organization ID: ${managerProfile.organization_id}`)

    // 2. Check all sites in the database
    console.log('\n📌 Step 2: Checking all sites in database...')
    const { data: allSites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false })

    if (sitesError) {
      console.log('❌ Sites query error:', sitesError.message)
      return
    }

    console.log(`✅ Found ${allSites?.length || 0} sites:`)
    allSites?.forEach(site => {
      console.log(`  - ${site.name} (ID: ${site.id.substring(0, 8)}...)`)
      console.log(`    Address: ${site.address}`)
      console.log(`    Status: ${site.status}`)
    })

    // 3. Check site_assignments for manager
    console.log('\n📌 Step 3: Checking site_assignments for manager...')
    const { data: assignments, error: assignError } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('user_id', managerProfile.id)

    if (assignError) {
      console.log('❌ Assignments query error:', assignError.message)
      return
    }

    console.log(`✅ Found ${assignments?.length || 0} site assignments:`)
    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        const site = allSites?.find(s => s.id === assignment.site_id)
        console.log(`  - Site: ${site?.name || 'Unknown'}`)
        console.log(`    Site ID: ${assignment.site_id}`)
        console.log(`    Active: ${assignment.is_active}`)
        console.log(`    Assigned Date: ${assignment.assigned_date}`)
        console.log(`    Role: ${assignment.role}`)
      }
    } else {
      console.log('  ⚠️ No assignments found!')
    }

    // 4. Check if there are ANY assignments in the table
    console.log('\n📌 Step 4: Checking all site_assignments in database...')
    const { data: allAssignments, error: allAssignError } = await supabase
      .from('site_assignments')
      .select('*')
      .limit(10)

    console.log(`✅ Total assignments in database: ${allAssignments?.length || 0}`)
    if (allAssignments && allAssignments.length > 0) {
      console.log('Sample assignments:')
      for (const assignment of allAssignments.slice(0, 3)) {
        const user = await supabase
          .from('profiles')
          .select('email')
          .eq('id', assignment.user_id)
          .single()
        
        const site = allSites?.find(s => s.id === assignment.site_id)
        console.log(`  - ${user.data?.email || 'Unknown'} → ${site?.name || 'Unknown'} (Active: ${assignment.is_active})`)
      }
    }

    // 5. Check auth.users table
    console.log('\n📌 Step 5: Checking auth.users for manager...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(managerProfile.id)
    
    if (authError) {
      console.log('❌ Auth user query error:', authError.message)
    } else if (authUser) {
      console.log('✅ Auth user found:')
      console.log(`  - Email: ${authUser.user.email}`)
      console.log(`  - Confirmed: ${authUser.user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`  - Last sign in: ${authUser.user.last_sign_in_at}`)
    }

    // 6. Test RLS policies by simulating user access
    console.log('\n📌 Step 6: Testing RLS policies...')
    console.log('Note: This uses service role, so RLS is bypassed. Actual app uses anon key with RLS.')
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY:')
    console.log('='.repeat(60))
    
    if (assignments && assignments.length > 0) {
      const activeAssignment = assignments.find(a => a.is_active)
      if (activeAssignment) {
        const site = allSites?.find(s => s.id === activeAssignment.site_id)
        console.log(`✅ Manager has active assignment to: ${site?.name}`)
      } else {
        console.log('⚠️ Manager has assignments but none are active')
      }
    } else {
      console.log('❌ Manager has NO site assignments')
      console.log('\n🔧 To fix this, you can:')
      console.log('1. Run: npm run seed:sample')
      console.log('2. Or manually assign via admin panel')
      console.log('3. Or run the assign-manager-site.js script')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkManagerDatabase()