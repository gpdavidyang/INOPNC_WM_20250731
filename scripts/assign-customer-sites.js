const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function assignCustomerSites() {
  try {
    // First, find the customer@inopnc.com profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'customer@inopnc.com')
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }

    console.log('Customer Profile:', profile);
    console.log('User ID:', profile.id);

    // Check current site assignments - trying different table names
    const { data: currentAssignments, error: currentError } = await supabase
      .from('current_site_assignments')
      .select('*')
      .eq('user_id', profile.id);

    console.log('\nCurrent Site Assignments:', currentAssignments);

    // Get all available sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
      return;
    }

    console.log('\nAvailable Sites:');
    sites.forEach(site => {
      console.log(`- ${site.id}: ${site.name}`);
    });

    // Assign customer to specific sites
    const sitesToAssign = sites.filter(site => 
      site.name === '강남 A현장' || 
      site.name === '송파 B현장' ||
      site.name === '서초 C현장'
    ).slice(0, 2); // Take first 2 matching sites

    if (sitesToAssign.length > 0) {
      console.log('\n📍 Assigning customer to sites:');
      
      for (const site of sitesToAssign) {
        // First check if assignment already exists
        const { data: existing } = await supabase
          .from('current_site_assignments')
          .select('*')
          .eq('user_id', profile.id)
          .eq('site_id', site.id)
          .single();

        if (!existing) {
          // Create new assignment
          const { data: newAssignment, error: assignError } = await supabase
            .from('current_site_assignments')
            .insert({
              user_id: profile.id,
              site_id: site.id,
              assigned_date: new Date().toISOString(),
              is_active: true
            })
            .select();

          if (assignError) {
            console.error(`Error assigning to ${site.name}:`, assignError);
          } else {
            console.log(`✅ Assigned to: ${site.name} (${site.id})`);
          }
        } else {
          console.log(`⚠️  Already assigned to: ${site.name}`);
        }
      }

      // Also update the profile's site_id to the first site
      if (sitesToAssign[0]) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ site_id: sitesToAssign[0].id })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Error updating profile site_id:', updateError);
        } else {
          console.log(`\n✅ Updated profile site_id to: ${sitesToAssign[0].name}`);
        }
      }
    }

    // Verify final assignments
    const { data: finalAssignments } = await supabase
      .from('current_site_assignments')
      .select('*, sites:site_id(name, address)')
      .eq('user_id', profile.id);

    console.log('\n📋 Final Site Assignments:');
    if (finalAssignments && finalAssignments.length > 0) {
      finalAssignments.forEach(assignment => {
        console.log(`- ${assignment.sites?.name || assignment.site_id}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

assignCustomerSites();