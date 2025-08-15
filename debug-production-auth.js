const { createClient } = require('@supabase/supabase-js');

// Production environment simulation
process.env.NODE_ENV = 'production';

const supabase = createClient(
  'https://yjtnpscnnsnvfsyvajku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mzc1NjQsImV4cCI6MjA2OTQxMzU2NH0.VNyFGFPRiYTIIRgGBvehV2_wA-Fsq1dhjlvj90yvY08'
);

async function debugProductionAuth() {
  console.log('🚀 프로덕션 인증 디버깅...\n');
  
  try {
    console.log('환경 정보:');
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  Supabase URL: https://yjtnpscnnsnvfsyvajku.supabase.co');
    
    // 여러 계정으로 테스트
    const testUsers = [
      { email: 'admin@inopnc.com', password: 'password123' },
      { email: 'manager@inopnc.com', password: 'password123' }
    ];
    
    for (const user of testUsers) {
      console.log(`\n🔐 로그인 테스트: ${user.email}`);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.password
        });
        
        if (error) {
          console.error('  ❌ 로그인 실패:', error.message);
          console.error('     코드:', error.status || 'Unknown');
          console.error('     이름:', error.name || 'Unknown');
        } else {
          console.log('  ✅ 로그인 성공');
          console.log('     사용자 ID:', data.user?.id);
          console.log('     이메일:', data.user?.email);
          
          // 프로필 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .single();
          
          if (profileError) {
            console.error('     프로필 오류:', profileError.message);
          } else {
            console.log('     프로필:', profile.full_name, profile.role);
          }
          
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error('  💥 예외 발생:', err.message);
      }
    }
    
    // Network test
    console.log('\n🌐 네트워크 테스트:');
    try {
      const response = await fetch('https://yjtnpscnnsnvfsyvajku.supabase.co/auth/v1/health');
      console.log('  Auth Health:', response.status, response.statusText);
      const text = await response.text();
      console.log('  응답:', text.substring(0, 100));
    } catch (fetchError) {
      console.error('  ❌ Fetch 실패:', fetchError.message);
    }
    
  } catch (error) {
    console.error('💥 전체 오류:', error.message);
  }
}

debugProductionAuth();