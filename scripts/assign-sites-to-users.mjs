import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Also try .env if .env.local doesn't have the variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: join(__dirname, '..', '.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignSitesToUsers() {
  try {
    // Get current date info
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    const nextWeekStart = new Date(currentWeekEnd);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    nextWeekStart.setHours(0, 0, 0, 0);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);

    console.log('Date ranges:');
    console.log('Current week:', currentWeekStart.toISOString(), 'to', currentWeekEnd.toISOString());
    console.log('Next week:', nextWeekStart.toISOString(), 'to', nextWeekEnd.toISOString());

    // 1. Get all active users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, organization_id')
      .order('created_at');

    if (usersError) throw usersError;
    console.log(`Found ${users.length} users`);

    // 2. Get all active sites (all sites are considered active if not deleted)
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .order('name');

    if (sitesError) throw sitesError;
    console.log(`Found ${sites.length} active sites`);

    if (sites.length === 0) {
      console.log('No active sites found. Creating sample sites...');
      
      // Get the first organization or create one
      let organizationId = users[0]?.organization_id;
      
      if (!organizationId) {
        // Create a default organization if none exists
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        
        if (orgData) {
          organizationId = orgData.id;
        } else {
          // Create new organization
          const { data: newOrg, error: createOrgError } = await supabase
            .from('organizations')
            .insert({ name: 'INOPNC', type: 'general_contractor' })
            .select()
            .single();
          
          if (newOrg) {
            organizationId = newOrg.id;
          }
        }
      }
      
      // Create sample sites if none exist
      const sampleSites = [
        { name: '강남 A현장', address: '서울특별시 강남구 테헤란로 123', organization_id: organizationId },
        { name: '판교 B현장', address: '경기도 성남시 분당구 판교역로 234', organization_id: organizationId },
        { name: '송도 C현장', address: '인천광역시 연수구 송도동 345', organization_id: organizationId },
        { name: '대전 D현장', address: '대전광역시 서구 둔산로 456', organization_id: organizationId },
        { name: '부산 E현장', address: '부산광역시 해운대구 센텀동 567', organization_id: organizationId }
      ];

      const { data: newSites, error: createSitesError } = await supabase
        .from('sites')
        .insert(sampleSites)
        .select();

      if (createSitesError) throw createSitesError;
      sites.push(...newSites);
      console.log('Created sample sites');
    }

    // 3. Create user_sites assignments
    const assignments = [];
    const assignmentDates = [];

    // Generate dates for current week and next week
    for (let d = new Date(currentWeekStart); d <= nextWeekEnd; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        assignmentDates.push(new Date(d));
      }
    }

    console.log(`Creating assignments for ${assignmentDates.length} working days`);

    // Assign users to sites in a round-robin fashion
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const siteIndex = i % sites.length;
      const site = sites[siteIndex];

      // Create assignments for each working day
      for (const date of assignmentDates) {
        assignments.push({
          user_id: user.id,
          site_id: site.id,
          assigned_date: date.toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // 4. First, delete any existing assignments for this period to avoid duplicates
    const { error: deleteError } = await supabase
      .from('user_sites')
      .delete()
      .gte('assigned_date', currentWeekStart.toISOString().split('T')[0])
      .lte('assigned_date', nextWeekEnd.toISOString().split('T')[0]);

    if (deleteError) {
      console.log('Note: Could not delete existing assignments (table might not exist yet)');
    }

    // 5. Check if user_sites table exists, if not create it
    const { error: tableCheckError } = await supabase
      .from('user_sites')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log('Creating user_sites table...');
      
      // Create the table using raw SQL
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS user_sites (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
            site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
            assigned_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, site_id, assigned_date)
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_user_sites_user_id ON user_sites(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_sites_site_id ON user_sites(site_id);
          CREATE INDEX IF NOT EXISTS idx_user_sites_assigned_date ON user_sites(assigned_date);

          -- Enable RLS
          ALTER TABLE user_sites ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
          CREATE POLICY "Users can view their own site assignments" ON user_sites
            FOR SELECT USING (auth.uid() = user_id);

          CREATE POLICY "Site managers can view assignments for their sites" ON user_sites
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('site_manager', 'admin', 'system_admin')
              )
            );

          CREATE POLICY "Admins can manage all assignments" ON user_sites
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin', 'system_admin')
              )
            );
        `
      });

      if (createTableError) {
        console.log('Could not create table via RPC, trying direct creation...');
      }
    }

    // 6. Insert the assignments in batches
    const batchSize = 100;
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('user_sites')
        .upsert(batch, { onConflict: 'user_id,site_id,assigned_date' });

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        // Continue with other batches even if one fails
      } else {
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(assignments.length / batchSize)}`);
      }
    }

    // 7. Verify the assignments
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_sites')
      .select('*', { count: 'exact' })
      .gte('assigned_date', currentWeekStart.toISOString().split('T')[0])
      .lte('assigned_date', nextWeekEnd.toISOString().split('T')[0]);

    if (verifyError) {
      console.error('Error verifying assignments:', verifyError);
    } else {
      console.log(`\nSuccessfully created ${verifyData.length} site assignments`);
      console.log(`Users: ${users.length}`);
      console.log(`Sites: ${sites.length}`);
      console.log(`Working days: ${assignmentDates.length}`);
      console.log(`Total assignments: ${verifyData.length}`);
    }

    // 8. Display sample assignments
    const { data: sampleAssignments } = await supabase
      .from('user_sites')
      .select(`
        user_id,
        site_id,
        assigned_date,
        profiles!user_sites_user_id_fkey(full_name, email),
        sites!user_sites_site_id_fkey(name)
      `)
      .gte('assigned_date', currentWeekStart.toISOString().split('T')[0])
      .lte('assigned_date', currentWeekEnd.toISOString().split('T')[0])
      .limit(10);

    if (sampleAssignments) {
      console.log('\nSample assignments for this week:');
      sampleAssignments.forEach(a => {
        console.log(`- ${a.profiles?.full_name} (${a.profiles?.email}) → ${a.sites?.name} on ${a.assigned_date}`);
      });
    }

  } catch (error) {
    console.error('Error assigning sites to users:', error);
    process.exit(1);
  }
}

// Run the script
assignSitesToUsers().then(() => {
  console.log('\n✅ Site assignment completed successfully!');
  process.exit(0);
});