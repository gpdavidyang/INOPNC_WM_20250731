const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCustomerAssignments() {
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

    // Check current site assignments
    const { data: assignments, error: assignError } = await supabase
      .from('user_site_assignments')
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
      console.error('Error fetching assignments:', assignError);
      return;
    }

    console.log('\nCurrent Site Assignments:', assignments);

    // Get all available sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
      return;
    }

    console.log('\nAvailable Sites in Database:');
    sites.forEach(site => {
      console.log(`- ${site.id}: ${site.name} (${site.address})`);
    });

    // If no assignments, suggest assignment
    if (!assignments || assignments.length === 0) {
      console.log('\n⚠️  Customer has NO site assignments!');
      console.log('Suggested sites to assign:');
      const suggestedSites = sites.slice(0, 2); // Get first 2 sites
      suggestedSites.forEach(site => {
        console.log(`  - ${site.id}: ${site.name}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkCustomerAssignments();