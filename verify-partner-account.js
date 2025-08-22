// Verify partner account exists and can authenticate
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyPartnerAccount() {
  console.log('🔍 Verifying partner@inopnc.com account...');
  
  try {
    // 1. Check if partner profile exists in profiles table
    console.log('📋 Checking profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'partner@inopnc.com')
      .single();
    
    if (profileError) {
      console.error('❌ Profile query error:', profileError);
      return;
    }
    
    if (!profile) {
      console.log('❌ Partner profile not found in profiles table');
      return;
    }
    
    console.log('✅ Partner profile found:', {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      full_name: profile.full_name
    });
    
    // 2. Check auth.users table (admin access required)
    console.log('🔐 Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth users query error:', authError);
    } else {
      const partnerAuthUser = authUsers.users.find(user => user.email === 'partner@inopnc.com');
      
      if (partnerAuthUser) {
        console.log('✅ Partner auth user found:', {
          id: partnerAuthUser.id,
          email: partnerAuthUser.email,
          email_confirmed: partnerAuthUser.email_confirmed_at ? 'Yes' : 'No',
          created_at: partnerAuthUser.created_at,
          last_sign_in: partnerAuthUser.last_sign_in_at
        });
      } else {
        console.log('❌ Partner not found in auth.users table');
      }
    }
    
    // 3. Check site memberships/assignments
    console.log('🏗️ Checking site assignments...');
    const { data: assignments, error: assignError } = await supabase
      .from('site_assignments')
      .select('*, sites(name, address)')
      .eq('user_id', profile.id);
    
    if (assignError) {
      console.error('⚠️ Site assignments query error:', assignError);
    } else {
      console.log(`📍 Site assignments found: ${assignments?.length || 0}`);
      assignments?.forEach(assignment => {
        console.log(`  - Site: ${assignment.sites?.name} | Role: ${assignment.role} | Active: ${assignment.is_active}`);
      });
    }
    
    // 4. Test authentication with correct credentials
    console.log('🔑 Testing authentication...');
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'partner@inopnc.com',
      password: 'password123'
    });
    
    if (signInError) {
      console.error('❌ Authentication failed:', signInError.message);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('🔧 Attempting to create/reset partner account...');
        
        // Try to create the user if it doesn't exist
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: 'partner@inopnc.com',
          password: 'password123',
          email_confirm: true
        });
        
        if (createError) {
          console.error('❌ User creation failed:', createError.message);
        } else {
          console.log('✅ Partner user created successfully');
          
          // Update or create profile
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: createData.user.id,
              email: 'partner@inopnc.com',
              full_name: '파트너 사용자',
              role: 'partner',
              status: 'active'
            });
          
          if (upsertError) {
            console.error('❌ Profile upsert failed:', upsertError);
          } else {
            console.log('✅ Partner profile created/updated');
          }
        }
      }
    } else {
      console.log('✅ Authentication successful:', {
        user_id: authData.user?.id,
        email: authData.user?.email,
        access_token: authData.session?.access_token ? 'Present' : 'Missing'
      });
    }
    
    // 5. Check site memberships table as well
    console.log('🔗 Checking site memberships...');
    const { data: memberships, error: memberError } = await supabase
      .from('site_memberships')
      .select('*, sites(name)')
      .eq('user_id', profile.id);
    
    if (memberError) {
      console.log('ℹ️ Site memberships query error (table may not exist):', memberError.message);
    } else {
      console.log(`📊 Site memberships found: ${memberships?.length || 0}`);
      memberships?.forEach(membership => {
        console.log(`  - Site: ${membership.sites?.name} | Role: ${membership.role} | Status: ${membership.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyPartnerAccount().catch(console.error);