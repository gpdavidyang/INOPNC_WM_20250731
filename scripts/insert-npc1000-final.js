const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertNPC1000Data() {
  try {
    console.log('🚀 Starting NPC-1000 data insertion...');
    
    // 1. Get existing categories for reference
    const { data: categories } = await supabase
      .from('material_categories')
      .select('*');
    
    const cementCategory = categories?.find(c => c.name === '시멘트');
    const groutCategory = categories?.find(c => c.name === '그라우트');
    const targetCategory = groutCategory || cementCategory;
    
    console.log('📂 Found categories:', categories?.length || 0);
    console.log('🎯 Using category:', targetCategory?.name, 'ID:', targetCategory?.id);
    
    console.log('🧱 Inserting NPC-1000 materials...');
    
    // 2. Insert NPC-1000 materials using correct schema
    const materialsData = [
      {
        code: 'NPC-1000',
        name: 'NPC-1000 무수축 그라우트',
        category_id: targetCategory?.id,
        unit: 'kg',
        specification: '고강도 무수축 그라우트, 압축강도 60MPa 이상',
        manufacturer: '한국건설자재(주)',
        min_stock_level: 500,
        max_stock_level: 2000,
        unit_price: 1200.00,
        is_active: true
      },
      {
        code: 'NPC-1000S',
        name: 'NPC-1000S 속경성 그라우트',
        category_id: targetCategory?.id,
        unit: 'kg',
        specification: '속경성 무수축 그라우트, 조기강도 발현',
        manufacturer: '한국건설자재(주)',
        min_stock_level: 300,
        max_stock_level: 1000,
        unit_price: 1350.00,
        is_active: true
      },
      {
        code: 'NPC-1000F',
        name: 'NPC-1000F 유동성 그라우트',
        category_id: targetCategory?.id,
        unit: 'kg',
        specification: '고유동성 무수축 그라우트, 펌핑성 우수',
        manufacturer: '대한시멘트',
        min_stock_level: 250,
        max_stock_level: 800,
        unit_price: 1280.00,
        is_active: true
      },
      {
        code: 'NPC-1000W',
        name: 'NPC-1000W 방수 그라우트',
        category_id: targetCategory?.id,
        unit: 'kg',
        specification: '방수형 무수축 그라우트, 수밀성 강화',
        manufacturer: '삼성종합건설(주)',
        min_stock_level: 200,
        max_stock_level: 600,
        unit_price: 1450.00,
        is_active: true
      },
      {
        code: 'NPC-1000H',
        name: 'NPC-1000H 고온용 그라우트',
        category_id: targetCategory?.id,
        unit: 'kg',
        specification: '고온환경용 무수축 그라우트, 80℃까지 사용가능',
        manufacturer: '현대건설재료(주)',
        min_stock_level: 150,
        max_stock_level: 500,
        unit_price: 1380.00,
        is_active: true
      },
      {
        code: 'NPC-CEMENT',
        name: 'NPC 전용 시멘트',
        category_id: cementCategory?.id,
        unit: 'kg',
        specification: 'NPC-1000 시리즈 전용 특수 시멘트',
        manufacturer: '대한시멘트',
        min_stock_level: 800,
        max_stock_level: 3000,
        unit_price: 450.00,
        is_active: true
      },
      {
        code: 'NPC-BOND',
        name: 'NPC 접착증강제',
        category_id: targetCategory?.id,
        unit: 'L',
        specification: 'NPC 그라우트 접착력 증강용 첨가제',
        manufacturer: '포스코건설자재',
        min_stock_level: 30,
        max_stock_level: 100,
        unit_price: 2800.00,
        is_active: true
      },
      {
        code: 'NPC-REPAIR',
        name: 'NPC 보수몰탈',
        category_id: targetCategory?.id,
        unit: 'kg',
        specification: 'NPC 계열 콘크리트 보수용 몰탈',
        manufacturer: 'GS건설재료',
        min_stock_level: 200,
        max_stock_level: 800,
        unit_price: 890.00,
        is_active: true
      }
    ];
    
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .upsert(materialsData, { onConflict: 'code' });
    
    if (materialsError) {
      console.error('Materials error:', materialsError.message);
      return;
    } else {
      console.log(`✅ Inserted ${materialsData.length} NPC materials`);
    }
    
    // 3. Get sites and newly created materials
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .limit(5); // Limit to first 5 sites for demo
    
    const { data: npcMaterials } = await supabase
      .from('materials')
      .select('*')
      .like('code', 'NPC-%');
    
    const { data: firstProfile } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();
    
    console.log('📊 Retrieved data:');
    console.log(`   • Sites: ${sites?.length || 0}`);
    console.log(`   • NPC Materials: ${npcMaterials?.length || 0}`);
    console.log(`   • Profile: ${firstProfile?.id ? 'Found' : 'Not found'}`);
    
    if (!sites || !npcMaterials || !firstProfile) {
      console.error('Missing required data for inventory creation');
      return;
    }
    
    console.log('📋 Creating material inventory...');
    
    // 4. Create inventory records for each site and material combination
    const inventoryData = [];
    for (const site of sites) {
      for (const material of npcMaterials) {
        const baseStock = material.code === 'NPC-1000' ? 800 : 
                         material.code === 'NPC-1000S' ? 400 :
                         material.code === 'NPC-CEMENT' ? 1200 : 
                         material.code === 'NPC-BOND' ? 50 : 300;
        
        inventoryData.push({
          site_id: site.id,
          material_id: material.id,
          current_stock: baseStock + Math.floor(Math.random() * 200),
          minimum_stock: material.min_stock_level,
          maximum_stock: material.max_stock_level,
          last_checked_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: firstProfile.id
        });
      }
    }
    
    console.log(`📦 Preparing ${inventoryData.length} inventory records...`);
    
    const { data: inventory, error: inventoryError } = await supabase
      .from('material_inventory')
      .upsert(inventoryData, { onConflict: 'site_id,material_id' });
    
    if (inventoryError) {
      console.error('Inventory error:', inventoryError.message);
    } else {
      console.log(`✅ Created ${inventoryData.length} inventory records`);
    }
    
    // 5. Create some material requests
    console.log('📝 Creating material requests...');
    
    const requestsData = [];
    
    for (let i = 0; i < 5; i++) {
      const site = sites[i % sites.length];
      
      requestsData.push({
        site_id: site.id,
        requested_by: firstProfile.id,
        required_date: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: ['urgent', 'high', 'normal', 'low', 'normal'][i],
        status: ['pending', 'approved', 'ordered', 'delivered', 'pending'][i],
        notes: `NPC-1000 그라우트 요청 #${i + 1} - ${['기초공사', '앵커볼트 고정', '콘크리트 보수', '구조물 접합부', '일반 보수'][i]}용`
      });
    }
    
    const { data: requests, error: requestsError } = await supabase
      .from('material_requests')
      .insert(requestsData);
    
    if (requestsError) {
      console.error('Requests error:', requestsError.message);
    } else {
      console.log(`✅ Created ${requestsData.length} material requests`);
    }
    
    // 6. Create material request items
    if (requests && requests.length > 0) {
      console.log('📋 Creating material request items...');
      
      const requestItemsData = [];
      requests.forEach((request, index) => {
        const material = npcMaterials[index % npcMaterials.length];
        const baseQty = material.code === 'NPC-1000' ? 200 : 
                       material.code === 'NPC-CEMENT' ? 500 : 100;
        
        requestItemsData.push({
          request_id: request.id,
          material_id: material.id,
          requested_quantity: baseQty + Math.floor(Math.random() * 100),
          approved_quantity: request.status !== 'pending' ? baseQty * 0.9 : null,
          delivered_quantity: request.status === 'delivered' ? baseQty * 0.85 : null,
          notes: `${material.name} - ${['기초작업', '보수작업', '접합작업', '고정작업', '일반작업'][index % 5]}용`
        });
      });
      
      const { data: requestItems, error: requestItemsError } = await supabase
        .from('material_request_items')
        .insert(requestItemsData);
      
      if (requestItemsError) {
        console.error('Request items error:', requestItemsError.message);
      } else {
        console.log(`✅ Created ${requestItemsData.length} material request items`);
      }
    }
    
    // 7. Create some material transactions
    console.log('📋 Creating material transactions...');
    
    const transactionsData = [];
    for (let i = 0; i < 15; i++) {
      const site = sites[i % sites.length];
      const material = npcMaterials[i % npcMaterials.length];
      const transactionTypes = ['in', 'out', 'out', 'out', 'out']; // More outs than ins
      const type = transactionTypes[i % transactionTypes.length];
      
      const baseQty = material.code === 'NPC-1000' ? 50 : 
                     material.code === 'NPC-CEMENT' ? 100 : 25;
      
      transactionsData.push({
        site_id: site.id,
        material_id: material.id,
        transaction_type: type,
        quantity: baseQty + Math.floor(Math.random() * 50),
        reference_type: 'daily_report',
        performed_by: firstProfile.id,
        notes: `${material.name} ${type === 'in' ? '입고' : '사용'} - ${['기초공사', '앵커볼트 고정', '콘크리트 보수', '구조물 접합부'][i % 4]}`,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('material_transactions')
      .insert(transactionsData);
    
    if (transactionsError) {
      console.error('Transactions error:', transactionsError.message);
    } else {
      console.log(`✅ Created ${transactionsData.length} material transactions`);
    }
    
    // 8. Verify final results
    console.log('🔍 Verifying data insertion...');
    
    const { data: finalMaterials } = await supabase
      .from('materials')
      .select('*')
      .like('code', 'NPC-%');
    
    const { data: finalInventory, count: inventoryCount } = await supabase
      .from('material_inventory')
      .select('*', { count: 'exact' });
    
    const { data: finalRequests, count: requestsCount } = await supabase
      .from('material_requests')
      .select('*', { count: 'exact' });
    
    const { data: finalTransactions, count: transactionsCount } = await supabase
      .from('material_transactions')
      .select('*', { count: 'exact' });
    
    console.log('\n🎉 SUCCESS! NPC-1000 Data Insertion Complete!');
    console.log('================================================');
    console.log('📊 Final Results:');
    console.log(`   • NPC Materials: ${finalMaterials?.length || 0}`);
    console.log(`   • Inventory Records: ${inventoryCount || 0}`);
    console.log(`   • Material Requests: ${requestsCount || 0}`);
    console.log(`   • Material Transactions: ${transactionsCount || 0}`);
    
    if (finalMaterials && finalMaterials.length > 0) {
      console.log('\n📋 Available NPC Materials:');
      finalMaterials.forEach(material => {
        console.log(`   • ${material.code}: ${material.name} (${material.unit_price?.toLocaleString()}원/${material.unit})`);
      });
      
      console.log('\n🏗️  Sample Inventory by Site:');
      if (inventoryCount && inventoryCount > 0) {
        const sampleInventory = await supabase
          .from('material_inventory')
          .select(`
            current_stock,
            materials(code, name),
            sites(name)
          `)
          .like('materials.code', 'NPC-%')
          .limit(5);
        
        sampleInventory.data?.forEach(inv => {
          console.log(`   • ${inv.sites?.name}: ${inv.materials?.code} - ${inv.current_stock}${inv.materials?.name?.includes('시멘트') ? 'kg' : inv.materials?.code?.includes('BOND') ? 'L' : 'kg'} 보유`);
        });
      }
      
      console.log('\n📱 You can now view the data in the NPC-1000 관리 tab!');
      console.log('🔄 Refresh your browser to see the updated material data.');
      console.log('📊 The data includes:');
      console.log('   - 8 different NPC material types');
      console.log('   - Real inventory quantities for each site');
      console.log('   - Active material requests and transactions');
      console.log('   - Complete material management history');
    } else {
      console.log('❌ No NPC materials found. Please check for errors.');
    }
    
  } catch (error) {
    console.error('❌ Data insertion failed:', error);
    process.exit(1);
  }
}

insertNPC1000Data();