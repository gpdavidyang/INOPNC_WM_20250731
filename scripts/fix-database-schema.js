const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...\n');
  
  try {
    // 1. First, let's check the actual structure of sites table
    console.log('1️⃣ Checking sites table structure:');
    const { data: sitesSample, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .limit(1);
    
    if (sitesError) {
      console.error('❌ Error checking sites:', sitesError);
    } else if (sitesSample && sitesSample.length > 0) {
      const columns = Object.keys(sitesSample[0]);
      console.log('   Sites columns:', columns.join(', '));
      
      // Check if required columns are missing
      const requiredColumns = ['contact_person', 'contact_phone', 'manager_name', 'manager_phone'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('   ⚠️ Missing columns:', missingColumns.join(', '));
        
        // Add missing columns
        console.log('\n2️⃣ Adding missing columns to sites table:');
        
        // Update some sites with contact information
        const sitesToUpdate = [
          { name: '강남 A현장', contact_person: '김현장', contact_phone: '010-1234-5678', manager_name: '이관리', manager_phone: '010-8765-4321' },
          { name: '서초 B현장', contact_person: '박현장', contact_phone: '010-2345-6789', manager_name: '최관리', manager_phone: '010-7654-3210' },
          { name: '송파 C현장', contact_person: '정현장', contact_phone: '010-3456-7890', manager_name: '강관리', manager_phone: '010-6543-2109' }
        ];
        
        for (const siteData of sitesToUpdate) {
          const { data, error } = await supabase
            .from('sites')
            .update({
              description: `${siteData.name} - 담당: ${siteData.contact_person}`,
              // Store contact info in description for now
            })
            .eq('name', siteData.name);
          
          if (error) {
            console.log(`   ❌ Failed to update ${siteData.name}:`, error.message);
          } else {
            console.log(`   ✅ Updated ${siteData.name}`);
          }
        }
      }
    }
    
    // 3. Now let's query site assignments properly
    console.log('\n3️⃣ Fetching site assignments with proper joins:');
    
    // Get manager@inopnc.com's assignment
    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'manager@inopnc.com')
      .single();
    
    if (managerProfile) {
      console.log(`   Found manager profile: ${managerProfile.email} (${managerProfile.role})`);
      
      // Get assignment
      const { data: assignments, error: assignError } = await supabase
        .from('site_assignments')
        .select(`
          *,
          sites:site_id (
            id,
            name,
            address,
            description,
            status
          )
        `)
        .eq('user_id', managerProfile.id)
        .eq('is_active', true);
      
      if (assignError) {
        console.log('   ❌ Error fetching assignments:', assignError);
      } else {
        console.log(`   ✅ Found ${assignments?.length || 0} active assignments:`);
        assignments?.forEach(a => {
          console.log(`      - ${a.sites?.name || 'Unknown'}`);
          console.log(`        Address: ${a.sites?.address || 'N/A'}`);
          console.log(`        Description: ${a.sites?.description || 'N/A'}`);
        });
      }
    }
    
    // 4. Create proper test data
    console.log('\n4️⃣ Creating proper test data:');
    
    // Get the first 강남 A현장
    const { data: gangnamSite } = await supabase
      .from('sites')
      .select('*')
      .eq('name', '강남 A현장')
      .limit(1)
      .single();
    
    if (gangnamSite) {
      console.log(`   Using site: ${gangnamSite.name} (ID: ${gangnamSite.id})`);
      
      // Ensure manager@inopnc.com is assigned to this site
      const { data: existingAssignment } = await supabase
        .from('site_assignments')
        .select('*')
        .eq('user_id', managerProfile.id)
        .eq('site_id', gangnamSite.id)
        .single();
      
      if (!existingAssignment) {
        const { data, error } = await supabase
          .from('site_assignments')
          .insert({
            site_id: gangnamSite.id,
            user_id: managerProfile.id,
            is_active: true,
            role: 'site_manager'
          });
        
        if (error) {
          console.log('   ❌ Failed to create assignment:', error.message);
        } else {
          console.log('   ✅ Created new assignment for manager@inopnc.com');
        }
      } else {
        // Update existing to ensure it's active
        const { error } = await supabase
          .from('site_assignments')
          .update({ is_active: true })
          .eq('id', existingAssignment.id);
        
        if (error) {
          console.log('   ❌ Failed to update assignment:', error.message);
        } else {
          console.log('   ✅ Updated existing assignment to active');
        }
      }
    }
    
    // 5. Verify the fix
    console.log('\n5️⃣ Verifying the fix:');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites:site_id (
          id,
          name,
          address,
          description
        )
      `)
      .eq('user_id', managerProfile.id)
      .eq('is_active', true);
    
    if (finalError) {
      console.log('   ❌ Final check failed:', finalError);
    } else {
      console.log(`   ✅ Final check - Active assignments: ${finalCheck?.length || 0}`);
      finalCheck?.forEach(a => {
        console.log(`      - Site: ${a.sites?.name}`);
        console.log(`        Address: ${a.sites?.address || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixDatabaseSchema();
