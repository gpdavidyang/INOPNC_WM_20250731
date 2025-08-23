const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUserSiteAssignments() {
  console.log('🔧 Setting up user site assignments...\n');
  
  try {
    // 1. Get test users
    const testUsers = [
      'manager@inopnc.com',
      'worker@inopnc.com',
      'production@inopnc.com'
    ];
    
    for (const email of testUsers) {
      console.log(`\n📋 Processing ${email}:`);
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (profileError || !profile) {
        console.log(`  ❌ Profile not found`);
        continue;
      }
      
      console.log(`  ✅ Found profile - Role: ${profile.role}`);
      
      // Determine which site to assign based on role
      let siteName = '강남 A현장';
      if (email === 'production@inopnc.com') {
        siteName = '서초 B현장';
      } else if (email === 'worker@inopnc.com') {
        siteName = '송파 C현장';
      }
      
      // Get the site
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('name', siteName)
        .limit(1)
        .single();
      
      if (siteError || !site) {
        console.log(`  ❌ Site "${siteName}" not found`);
        continue;
      }
      
      console.log(`  📍 Assigning to: ${site.name}`);
      
      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('site_assignments')
        .select('*')
        .eq('user_id', profile.id)
        .eq('site_id', site.id)
        .single();
      
      if (existingAssignment) {
        // Update existing assignment to be active
        const { error: updateError } = await supabase
          .from('site_assignments')
          .update({ 
            is_active: true,
            assigned_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', existingAssignment.id);
        
        if (updateError) {
          console.log(`  ❌ Failed to update assignment:`, updateError.message);
        } else {
          console.log(`  ✅ Updated existing assignment to active`);
        }
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from('site_assignments')
          .insert({
            user_id: profile.id,
            site_id: site.id,
            assigned_date: new Date().toISOString().split('T')[0],
            is_active: true,
            role: profile.role
          });
        
        if (insertError) {
          console.log(`  ❌ Failed to create assignment:`, insertError.message);
        } else {
          console.log(`  ✅ Created new assignment`);
        }
      }
      
      // Update site with better contact information
      if (siteName === '강남 A현장') {
        await supabase
          .from('sites')
          .update({
            manager_name: '김현장',
            construction_manager_phone: '010-1234-5678',
            safety_manager_name: '이안전',
            safety_manager_phone: '010-2345-6789',
            accommodation_name: '강남 숙소',
            accommodation_address: '서울시 강남구 역삼동 123-45',
            work_process: '1층 철근 배근 작업',
            work_section: 'A구역'
          })
          .eq('id', site.id);
      } else if (siteName === '서초 B현장') {
        await supabase
          .from('sites')
          .update({
            manager_name: '박소장',
            construction_manager_phone: '010-3456-7890',
            safety_manager_name: '최안전',
            safety_manager_phone: '010-4567-8901',
            accommodation_name: '서초 숙소',
            accommodation_address: '서울시 서초구 방배동 456-78',
            work_process: '2층 콘크리트 타설',
            work_section: 'B구역'
          })
          .eq('id', site.id);
      } else if (siteName === '송파 C현장') {
        await supabase
          .from('sites')
          .update({
            manager_name: '정소장',
            construction_manager_phone: '010-5678-9012',
            safety_manager_name: '강안전',
            safety_manager_phone: '010-6789-0123',
            accommodation_name: '송파 숙소',
            accommodation_address: '서울시 송파구 잠실동 789-01',
            work_process: '지하층 방수 작업',
            work_section: 'C구역'
          })
          .eq('id', site.id);
      }
    }
    
    console.log('\n✅ Setup complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupUserSiteAssignments();
