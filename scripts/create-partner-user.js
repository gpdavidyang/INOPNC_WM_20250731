const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPartnerUser() {
  try {
    console.log('🚀 Creating partner user...');

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'partner@inopnc.com',
      password: 'password123',
      email_confirm: true
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      // Continue if user already exists
      if (authError.message.includes('already exists')) {
        console.log('Auth user already exists, getting existing user...');
        const { data: existingUser, error: fetchError } = await supabase.auth.admin.listUsers();
        if (fetchError) {
          console.error('Error fetching users:', fetchError);
          return;
        }
        
        const partnerAuth = existingUser.users.find(u => u.email === 'partner@inopnc.com');
        if (!partnerAuth) {
          console.error('Could not find existing partner user');
          return;
        }
        
        console.log(`Found existing auth user: ${partnerAuth.id}`);
        
        // 2. Check if profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerAuth.id)
          .single();

        if (profileError || !existingProfile) {
          // Create profile
          const { data: newProfile, error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: partnerAuth.id,
              email: 'partner@inopnc.com',
              full_name: '파트너 사용자',
              role: 'customer_manager'
            })
            .select()
            .single();

          if (createProfileError) {
            console.error('Error creating profile:', createProfileError);
            return;
          }

          console.log('✅ Created profile for existing auth user');
        } else {
          console.log('✅ Profile already exists');
        }
      } else {
        return;
      }
    } else {
      console.log(`✅ Created auth user: ${authUser.user.id}`);

      // 2. Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: 'partner@inopnc.com',
          full_name: '파트너 사용자',
          role: 'customer_manager'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
      }

      console.log('✅ Created profile');
    }

    console.log('🎉 Partner user setup completed!');

  } catch (error) {
    console.error('Error in createPartnerUser:', error);
  }
}

createPartnerUser();