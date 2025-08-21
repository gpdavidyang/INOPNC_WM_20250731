const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCustomerSiteAssignment() {
  try {
    // Get customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'customer@inopnc.com')
      .single();

    console.log('Customer:', profile.full_name, '(' + profile.email + ')');
    console.log('Current site_id in profile:', profile.site_id);

    // Get a few active sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .in('name', ['강남 A현장', '송파 C현장', '서초 B현장'])
      .limit(3);

    console.log('\nAvailable Sites:');
    sites?.forEach(site => {
      console.log(`- ${site.id}: ${site.name} (${site.address})`);
    });

    // Since customer already has 강남 A현장 in current_site_assignments view,
    // let's just update the profile to ensure site_id is set
    const gangnamSite = sites?.find(s => s.name === '강남 A현장');
    
    if (gangnamSite && !profile.site_id) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          site_id: gangnamSite.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log(`\n✅ Updated profile site_id to: ${gangnamSite.name} (${gangnamSite.id})`);
      }
    }

    // Check site history table
    const { data: siteHistory, error: historyError } = await supabase
      .from('user_site_history')
      .select('*')
      .eq('user_id', profile.id)
      .order('assigned_date', { ascending: false });

    if (!historyError) {
      console.log('\n📋 Site History for customer:');
      if (siteHistory && siteHistory.length > 0) {
        siteHistory.forEach(history => {
          console.log(`- Site ID: ${history.site_id}, Assigned: ${history.assigned_date}`);
        });
      } else {
        console.log('No site history found.');
        
        // Add to site history
        if (gangnamSite) {
          const { error: insertError } = await supabase
            .from('user_site_history')
            .insert({
              user_id: profile.id,
              site_id: gangnamSite.id,
              assigned_date: new Date().toISOString().split('T')[0],
              unassigned_date: null
            });

          if (insertError) {
            console.error('Error adding to site history:', insertError);
          } else {
            console.log(`✅ Added ${gangnamSite.name} to site history`);
          }
        }
      }
    }

    // Verify current assignments view
    const { data: currentAssignments } = await supabase
      .from('current_site_assignments')
      .select('site_name, site_address, assigned_date')
      .eq('user_id', profile.id);

    console.log('\n📍 Current Site Assignments (from view):');
    currentAssignments?.forEach((assignment, idx) => {
      console.log(`${idx + 1}. ${assignment.site_name} - ${assignment.site_address}`);
    });

    // Final profile check
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name, site_id')
      .eq('id', profile.id)
      .single();

    console.log('\n✅ Final Profile State:');
    console.log(`- Name: ${finalProfile.full_name}`);
    console.log(`- Email: ${finalProfile.email}`);
    console.log(`- Site ID: ${finalProfile.site_id || 'NOT SET'}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

fixCustomerSiteAssignment();