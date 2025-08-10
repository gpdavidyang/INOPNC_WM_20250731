const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertSampleAnnouncements() {
  console.log('📢 공지사항 샘플 데이터 삽입...');
  
  try {
    // Get user IDs for different roles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('email', ['manager@inopnc.com', 'worker@inopnc.com', 'admin@inopnc.com']);
    
    if (usersError) throw usersError;
    
    if (!users || users.length === 0) {
      console.log('❌ 사용자가 없습니다. 먼저 사용자를 생성하세요.');
      return;
    }
    
    console.log('✅ 찾은 사용자:', users.map((u: any) => u.email).join(', '));
    
    // Sample announcements for different users
    const sampleNotifications = [];
    
    const adminUser = users.find((u: any) => u.role === 'admin');
    
    // Add announcements for each user (using actual table structure)
    for (const user of users) {
      sampleNotifications.push(
        {
          user_id: user.id,
          type: 'info',
          title: '시스템 점검 안내',
          message: '매주 일요일 오전 2:00-4:00 정기 시스템 점검이 진행됩니다. 해당 시간 동안 서비스 이용이 제한될 수 있습니다.',
          is_read: Math.random() > 0.5,
          created_at: new Date(Date.now() - 2*24*60*60*1000).toISOString()
        },
        {
          user_id: user.id,
          type: 'info',
          title: '안전교육 필수 이수 안내',
          message: '모든 작업자는 월 1회 안전교육을 필수로 이수해야 합니다. 미이수시 현장 출입이 제한될 수 있습니다.',
          is_read: false,
          created_at: new Date(Date.now() - 1*24*60*60*1000).toISOString()
        },
        {
          user_id: user.id,
          type: 'info',
          title: 'NPC-1000 자재 관리 업데이트',
          message: 'NPC-1000 자재 관리 시스템이 업데이트 되었습니다. 새로운 요청 양식을 확인해 주세요.',
          is_read: true,
          created_at: new Date(Date.now() - 3*24*60*60*1000).toISOString()
        },
        {
          user_id: user.id,
          type: 'warning',
          title: '현장 안전수칙 준수 안내',
          message: '안전모, 안전화 등 보호장비 착용은 필수입니다. 미착용시 출입이 제한됩니다.',
          is_read: Math.random() > 0.3,
          created_at: new Date(Date.now() - 4*24*60*60*1000).toISOString()
        }
      );
    }
    
    // Insert notifications
    const { data, error } = await supabase
      .from('notifications')
      .insert(sampleNotifications)
      .select();
    
    if (error) throw error;
    
    console.log('✅ 공지사항 샘플 데이터 삽입 완료!');
    console.log('📊 삽입된 알림 수:', data?.length || 0);
    console.log('🎯 각 사용자당 4개의 공지사항이 생성되었습니다.');
    
    // Display sample data
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select(`
        title, 
        type, 
        created_at, 
        profiles!inner(email)
      `)
      .in('type', ['info', 'warning'])
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!fetchError && notifications) {
      console.log('\n📋 최근 공지사항 (상위 5개):');
      notifications.forEach((notif: any, index: number) => {
        console.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${notif.profiles?.email}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
  }
}

insertSampleAnnouncements();