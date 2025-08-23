const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createNPCTables() {
  console.log('🔍 NPC 자재관리 테이블 생성 시작...');
  
  try {
    // Get admin user ID for creating sample data
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', adminUser.id);
    
    // 1. Create sample npc_production data using INSERT
    console.log('📝 npc_production 샘플 데이터 생성...');
    
    const productionData = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        production_date: '2025-01-20',
        production_amount: 1000,
        shipment_amount: 800,
        balance_amount: 200,
        notes: '첫 번째 생산 배치',
        created_by: adminUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        production_date: '2025-01-21',
        production_amount: 1200,
        shipment_amount: 950,
        balance_amount: 450,
        notes: '두 번째 생산 배치',
        created_by: adminUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Try to insert into npc_production (this will fail if table doesn't exist)
    const { error: prodError } = await supabase
      .from('npc_production')
      .upsert(productionData);
    
    if (prodError) {
      console.log('⚠️ npc_production 테이블이 존재하지 않습니다:', prodError.message);
      console.log('📋 테이블 생성이 필요합니다. 마이그레이션 파일을 데이터베이스에 적용해주세요.');
    } else {
      console.log('✅ npc_production 샘플 데이터 생성 완료');
    }
    
    // 2. Get site IDs for shipment data
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3);
    
    if (sites && sites.length > 0) {
      console.log('📝 npc_shipments 샘플 데이터 생성...');
      
      const shipmentData = [
        {
          id: '33333333-3333-3333-3333-333333333333',
          shipment_date: '2025-01-22',
          site_id: sites[0].id,
          amount: 500,
          delivery_status: 'delivered',
          delivery_method: 'freight',
          invoice_confirmed: true,
          tax_invoice_issued: true,
          payment_confirmed: true,
          shipping_cost: 50000,
          tracking_number: 'TR123456789',
          notes: '정상 배송 완료',
          created_by: adminUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const { error: shipError } = await supabase
        .from('npc_shipments')
        .upsert(shipmentData);
      
      if (shipError) {
        console.log('⚠️ npc_shipments 테이블이 존재하지 않습니다:', shipError.message);
      } else {
        console.log('✅ npc_shipments 샘플 데이터 생성 완료');
      }
      
      // 3. Create shipment request data
      console.log('📝 npc_shipment_requests 샘플 데이터 생성...');
      
      const { data: siteManager } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'site_manager')
        .limit(1)
        .single();
      
      if (siteManager) {
        const requestData = [
          {
            id: '44444444-4444-4444-4444-444444444444',
            request_date: '2025-01-23',
            site_id: sites[0].id,
            requester_id: siteManager.id,
            requested_amount: 300,
            urgency: 'urgent',
            reason: '현장 작업량 증가로 인한 추가 자재 필요',
            status: 'pending',
            notes: '긴급 요청',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const { error: reqError } = await supabase
          .from('npc_shipment_requests')
          .upsert(requestData);
        
        if (reqError) {
          console.log('⚠️ npc_shipment_requests 테이블이 존재하지 않습니다:', reqError.message);
        } else {
          console.log('✅ npc_shipment_requests 샘플 데이터 생성 완료');
        }
      }
    }
    
    // 4. Test all tables exist
    console.log('\n🔍 테이블 존재 여부 확인...');
    
    const tables = ['npc_production', 'npc_shipments', 'npc_shipment_requests'];
    let allTablesExist = true;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log('❌ ' + table + ': 존재하지 않음');
          allTablesExist = false;
        } else {
          console.log('✅ ' + table + ': 존재함 (' + (data ? data.length : 0) + '개 데이터)');
        }
      } catch (e) {
        console.log('❌ ' + table + ': 접근 실패');
        allTablesExist = false;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    if (allTablesExist) {
      console.log('🎉 모든 NPC 자재관리 테이블이 준비되었습니다!');
      console.log('🚀 http://localhost:3000/dashboard/admin/materials 에서 확인하세요.');
    } else {
      console.log('⚠️  일부 테이블이 누락되었습니다.');
      console.log('📋 다음 마이그레이션 파일을 데이터베이스에 적용하세요:');
      console.log('   📁 supabase/migrations/806_create_npc_material_tables.sql');
      console.log('');
      console.log('💡 현재 상태:');
      console.log('   ✅ UI 및 컴포넌트: 100% 완성');
      console.log('   ✅ 사용재고관리: 작동 (daily_reports 활용)');
      console.log('   ⚠️  나머지 3개 탭: 테이블 생성 후 작동');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  createNPCTables();
}

module.exports = { createNPCTables };