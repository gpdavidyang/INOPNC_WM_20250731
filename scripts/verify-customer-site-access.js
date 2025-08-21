const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAndAssignCustomerSite() {
  try {
    console.log('🔍 Checking customer@inopnc.com site assignments...');
    
    // Get customer user ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'customer@inopnc.com')
      .single();
    
    if (profileError || !profile) {
      console.error('❌ Could not find customer@inopnc.com profile:', profileError);
      return;
    }
    
    console.log('✅ Found customer profile:', profile.id, profile.full_name);
    
    // Check current site assignments
    const { data: currentAssignments, error: assignError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          id,
          name,
          address
        )
      `)
      .eq('user_id', profile.id);
    
    if (assignError) {
      console.error('❌ Error checking assignments:', assignError);
      return;
    }
    
    console.log(`📊 Current assignments: ${currentAssignments?.length || 0} sites`);
    if (currentAssignments && currentAssignments.length > 0) {
      currentAssignments.forEach(assignment => {
        console.log(`  - ${assignment.sites?.name} (ID: ${assignment.site_id})`);
      });
    }
    
    // Get 강남 A현장
    const { data: gangnamSite, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('name', '강남 A현장')
      .single();
    
    if (siteError || !gangnamSite) {
      console.error('❌ Could not find 강남 A현장:', siteError);
      return;
    }
    
    console.log('✅ Found 강남 A현장:', gangnamSite.id);
    
    // Check if already assigned
    const existingAssignment = currentAssignments?.find(a => a.site_id === gangnamSite.id);
    
    if (existingAssignment) {
      console.log('✅ Customer is already assigned to 강남 A현장');
      console.log('   Assignment details:', {
        role: existingAssignment.role,
        assigned_at: existingAssignment.assigned_at
      });
    } else {
      // Assign to 강남 A현장
      console.log('📝 Assigning customer to 강남 A현장...');
      
      const { data: newAssignment, error: insertError } = await supabase
        .from('site_assignments')
        .insert({
          user_id: profile.id,
          site_id: gangnamSite.id,
          role: 'customer_manager',
          assigned_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error creating assignment:', insertError);
        return;
      }
      
      console.log('✅ Successfully assigned customer to 강남 A현장');
      console.log('   New assignment:', newAssignment);
    }
    
    // Also ensure customer has access to other sample sites
    const sampleSites = ['송파 B현장', '서초 C현장'];
    
    for (const siteName of sampleSites) {
      const { data: site } = await supabase
        .from('sites')
        .select('*')
        .eq('name', siteName)
        .single();
      
      if (site) {
        const hasAssignment = currentAssignments?.find(a => a.site_id === site.id);
        if (!hasAssignment) {
          const { error: assignErr } = await supabase
            .from('site_assignments')
            .insert({
              user_id: profile.id,
              site_id: site.id,
              role: 'customer_manager',
              assigned_at: new Date().toISOString()
            });
          
          if (!assignErr) {
            console.log(`✅ Also assigned customer to ${siteName}`);
          }
        }
      }
    }
    
    // Final check - list all assignments
    const { data: finalAssignments } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          name
        )
      `)
      .eq('user_id', profile.id);
    
    console.log('\n📋 Final site assignments for customer@inopnc.com:');
    finalAssignments?.forEach(assignment => {
      console.log(`  ✅ ${assignment.sites?.name}`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyAndAssignCustomerSite();