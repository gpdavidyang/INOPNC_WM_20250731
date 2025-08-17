const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function assignManagerToSite() {
  try {
    console.log('🔍 Checking existing data...')
    
    // Check if manager@inopnc.com user exists
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'manager@inopnc.com')
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return
    }
    
    if (!profiles || profiles.length === 0) {
      console.error('❌ manager@inopnc.com user not found in profiles table')
      return
    }
    
    const managerProfile = profiles[0]
    console.log('✅ Found manager profile:', {
      id: managerProfile.id,
      email: managerProfile.email,
      full_name: managerProfile.full_name,
      role: managerProfile.role
    })
    
    // Check available sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'active')
    
    if (sitesError) {
      console.error('Error fetching sites:', sitesError)
      return
    }
    
    console.log('📍 Available active sites:')
    sites.forEach(site => {
      console.log(`  - ${site.name} (ID: ${site.id})`)
    })
    
    // Use the first active site (or you can choose a specific one)
    const targetSite = sites[0]
    if (!targetSite) {
      console.error('❌ No active sites found')
      return
    }
    
    console.log(`🎯 Target site: ${targetSite.name}`)
    
    // Check if there's already an active assignment
    const { data: existingAssignments, error: assignError } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('user_id', managerProfile.id)
      .eq('is_active', true)
    
    if (assignError) {
      console.error('Error checking existing assignments:', assignError)
      return
    }
    
    // End any existing active assignments
    if (existingAssignments && existingAssignments.length > 0) {
      console.log('🔄 Ending existing active assignments...')
      for (const assignment of existingAssignments) {
        await supabase
          .from('site_assignments')
          .update({
            is_active: false,
            unassigned_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', assignment.id)
        
        console.log(`   Ended assignment to ${assignment.site_id}`)
      }
    }
    
    // Create new assignment from today to end of August
    const today = new Date()
    const endOfAugust = new Date(today.getFullYear(), 7, 31) // Month is 0-indexed, so 7 = August
    
    const newAssignment = {
      user_id: managerProfile.id,
      site_id: targetSite.id,
      assigned_date: today.toISOString().split('T')[0],
      unassigned_date: endOfAugust.toISOString().split('T')[0],
      is_active: true,
      role: 'site_manager'
    }
    
    console.log('📝 Creating new site assignment...')
    console.log('Assignment details:', {
      user_email: managerProfile.email,
      site_name: targetSite.name,
      assigned_date: newAssignment.assigned_date,
      unassigned_date: newAssignment.unassigned_date,
      role: newAssignment.role
    })
    
    const { data: insertedAssignment, error: insertError } = await supabase
      .from('site_assignments')
      .insert(newAssignment)
      .select()
    
    if (insertError) {
      console.error('❌ Error creating site assignment:', insertError)
      return
    }
    
    console.log('✅ Site assignment created successfully!')
    console.log('Assignment ID:', insertedAssignment[0].id)
    
    // Update the user's current site_id in profiles table
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ site_id: targetSite.id })
      .eq('id', managerProfile.id)
    
    if (updateProfileError) {
      console.error('⚠️ Warning: Could not update profile site_id:', updateProfileError)
    } else {
      console.log('✅ Updated profile with current site_id')
    }
    
    console.log('\n🎉 Assignment complete!')
    console.log(`📧 User: ${managerProfile.email}`)
    console.log(`🏗️ Site: ${targetSite.name}`)
    console.log(`📅 Period: ${newAssignment.assigned_date} ~ ${newAssignment.unassigned_date}`)
    console.log(`👔 Role: ${newAssignment.role}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
assignManagerToSite()