const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addMoreCustomerSites() {
  try {
    // Get customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'customer@inopnc.com')
      .single();

    console.log('Customer:', profile.full_name, '(' + profile.email + ')');

    // Get sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .in('name', ['송파 C현장', '서초 B현장'])
      .limit(2);

    console.log('\nAdding additional sites:');

    for (const site of sites) {
      // Check if already assigned
      const { data: existing } = await supabase
        .from('current_site_assignments')
        .select('*')
        .eq('user_id', profile.id)
        .eq('site_id', site.id)
        .maybeSingle();

      if (!existing) {
        // Create assignment - using correct column names
        const { data: newAssignment, error } = await supabase
          .from('current_site_assignments')
          .insert({
            user_id: profile.id,
            site_id: site.id,
            assigned_date: new Date().toISOString().split('T')[0],
            role: 'supervisor',
            site_name: site.name,
            site_address: site.address || '서울시',
            site_status: 'active',
            start_date: '2025-01-01',
            end_date: '2025-12-31',
            construction_manager_phone: '010-1234-5678',
            safety_manager_phone: '010-1234-5679',
            accommodation_name: site.name + ' 숙소',
            accommodation_address: '서울시 ' + site.name.split(' ')[0] + '구'
          })
          .select();

        if (error) {
          console.error(`Error assigning ${site.name}:`, error.message);
        } else {
          console.log(`✅ Added: ${site.name} (${site.id})`);
        }
      } else {
        console.log(`⚠️  Already has: ${site.name}`);
      }
    }

    // Show final assignments
    const { data: finalAssignments } = await supabase
      .from('current_site_assignments')
      .select('site_name, site_address, assigned_date')
      .eq('user_id', profile.id)
      .order('assigned_date', { ascending: false });

    console.log('\n📋 Customer\'s Final Site Assignments:');
    finalAssignments?.forEach((assignment, idx) => {
      console.log(`${idx + 1}. ${assignment.site_name} - ${assignment.site_address}`);
      console.log(`   Assigned: ${assignment.assigned_date}`);
    });

    console.log(`\n✅ Total sites assigned: ${finalAssignments?.length || 0}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

addMoreCustomerSites();