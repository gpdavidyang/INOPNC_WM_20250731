const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupAndVerifySites() {
  try {
    console.log('🔍 Checking all sites in database...');
    
    // Get all sites
    const { data: allSites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .order('name');
    
    if (sitesError) {
      console.error('❌ Error fetching sites:', sitesError);
      return;
    }
    
    console.log(`📊 Found ${allSites.length} total sites:`);
    allSites.forEach(site => {
      console.log(`  - ${site.name} (ID: ${site.id})`);
    });
    
    // Get customer user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'customer@inopnc.com')
      .single();
    
    if (profileError || !profile) {
      console.error('❌ Could not find customer@inopnc.com profile');
      return;
    }
    
    console.log('\n✅ Found customer profile:', profile.full_name);
    
    // Check current assignments
    const { data: assignments, error: assignError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          id,
          name
        )
      `)
      .eq('user_id', profile.id);
    
    if (assignError) {
      console.error('❌ Error checking assignments:', assignError);
      return;
    }
    
    console.log(`\n📋 Current assignments for customer (${assignments?.length || 0} sites):`);
    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        console.log(`  - ${assignment.sites?.name || 'Unknown'} (Site ID: ${assignment.site_id})`);
      });
    }
    
    // Keep only the first valid assignment for each unique site name
    const siteNameMap = new Map();
    const toDelete = [];
    
    if (assignments) {
      for (const assignment of assignments) {
        const siteName = assignment.sites?.name;
        if (siteName) {
          if (!siteNameMap.has(siteName)) {
            siteNameMap.set(siteName, assignment);
          } else {
            // Mark duplicate for deletion
            toDelete.push(assignment.id);
          }
        }
      }
    }
    
    // Delete duplicate assignments
    if (toDelete.length > 0) {
      console.log(`\n🗑️ Removing ${toDelete.length} duplicate assignments...`);
      for (const id of toDelete) {
        await supabase
          .from('site_assignments')
          .delete()
          .eq('id', id);
      }
      console.log('✅ Duplicates removed');
    }
    
    // Ensure customer has access to at least one site of each type
    const requiredSites = ['강남 A현장', '송파 B현장', '서초 C현장'];
    
    for (const siteName of requiredSites) {
      // Find the first site with this name
      const site = allSites.find(s => s.name === siteName);
      
      if (site) {
        // Check if customer has assignment to this specific site
        const hasAssignment = assignments?.some(a => a.site_id === site.id);
        
        if (!hasAssignment) {
          console.log(`\n📝 Assigning customer to ${siteName}...`);
          
          const { error: insertError } = await supabase
            .from('site_assignments')
            .insert({
              user_id: profile.id,
              site_id: site.id,
              role: 'worker',
              assigned_date: new Date().toISOString().split('T')[0]
            });
          
          if (insertError) {
            console.error(`❌ Error assigning to ${siteName}:`, insertError);
          } else {
            console.log(`✅ Successfully assigned to ${siteName}`);
          }
        } else {
          console.log(`✅ Customer already has access to ${siteName}`);
        }
      } else {
        console.log(`⚠️ Site "${siteName}" not found in database`);
      }
    }
    
    // Final verification
    const { data: finalAssignments } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          name,
          address
        )
      `)
      .eq('user_id', profile.id);
    
    console.log('\n✅ Final site assignments for customer@inopnc.com:');
    finalAssignments?.forEach(assignment => {
      console.log(`  ✅ ${assignment.sites?.name} - ${assignment.sites?.address || 'No address'}`);
    });
    
    console.log('\n✨ Site verification and cleanup complete!');
    console.log('Customer should now see work logs for assigned sites.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

cleanupAndVerifySites();