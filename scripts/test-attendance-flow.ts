const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testAttendanceFlow() {
  console.log('🔍 Testing Complete Attendance Flow\n');
  console.log('=' + '='.repeat(60));
  
  // 1. Test Authentication
  console.log('\n1️⃣ Testing Authentication...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  });
  
  if (authError) {
    console.error('❌ Auth failed:', authError);
    return;
  }
  
  console.log('✅ Authenticated as:', authData.user?.email);
  console.log('   User ID:', authData.user?.id);
  
  // 2. Test Profile Query
  console.log('\n2️⃣ Testing Profile Query...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user?.id)
    .single();
  
  if (profileError) {
    console.error('❌ Profile query failed:', profileError);
  } else {
    console.log('✅ Profile found:');
    console.log('   Name:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('   Site ID:', profile.site_id);
  }
  
  // 3. Test Sites Query
  console.log('\n3️⃣ Testing Sites Query...');
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active');
  
  if (sitesError) {
    console.error('❌ Sites query failed:', sitesError);
  } else {
    console.log('✅ Sites found:', sites.length);
    sites.forEach(site => {
      console.log(`   - ${site.name} (${site.id})`);
    });
  }
  
  // 4. Test Attendance Query (same as component)
  console.log('\n4️⃣ Testing Attendance Query...');
  const currentMonth = new Date();
  const selectedYear = currentMonth.getFullYear();
  const selectedMonth = currentMonth.getMonth() + 1;
  const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
  
  console.log('   Date range:', startDate, 'to', endDate);
  console.log('   User ID:', authData.user?.id);
  
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance_records')
    .select(`
      *,
      site:sites(id, name),
      worker:profiles(id, full_name, email)
    `)
    .eq('user_id', authData.user?.id)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: true });
  
  if (attendanceError) {
    console.error('❌ Attendance query failed:', attendanceError);
  } else {
    console.log('✅ Attendance records found:', attendance?.length || 0);
    if (attendance && attendance.length > 0) {
      console.log('\n   Sample records:');
      attendance.slice(0, 3).forEach(record => {
        console.log(`   - ${record.work_date}: ${record.work_hours}h (${(record.work_hours/8).toFixed(2)} 공수)`);
        console.log(`     Site: ${record.site?.name || 'N/A'}`);
        console.log(`     Status: ${record.status}`);
      });
    }
  }
  
  // 5. Test with site_id filter (if profile has site_id)
  if (profile?.site_id) {
    console.log('\n5️⃣ Testing Attendance Query with Site Filter...');
    console.log('   Site ID:', profile.site_id);
    
    const { data: siteAttendance, error: siteAttendanceError } = await supabase
      .from('attendance_records')
      .select(`
        *,
        site:sites(id, name),
        worker:profiles(id, full_name, email)
      `)
      .eq('user_id', authData.user?.id)
      .eq('site_id', profile.site_id)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: true });
    
    if (siteAttendanceError) {
      console.error('❌ Site attendance query failed:', siteAttendanceError);
    } else {
      console.log('✅ Site attendance records found:', siteAttendance?.length || 0);
    }
  }
  
  // 6. Test RLS policies
  console.log('\n6️⃣ Testing RLS Policies...');
  
  // Try to query all attendance records (should be filtered by RLS)
  const { data: allAttendance, error: allAttendanceError } = await supabase
    .from('attendance_records')
    .select('id, user_id, work_date')
    .limit(10);
  
  console.log('   All attendance query (with RLS):', allAttendance?.length || 0, 'records');
  if (allAttendance && allAttendance.length > 0) {
    const uniqueUsers = [...new Set(allAttendance.map(a => a.user_id))];
    console.log('   Unique users in results:', uniqueUsers.length);
    console.log('   Current user in results:', uniqueUsers.includes(authData.user?.id) ? 'Yes' : 'No');
  }
  
  console.log('\n' + '=' + '='.repeat(60));
  console.log('✅ Test Complete!');
}

testAttendanceFlow();