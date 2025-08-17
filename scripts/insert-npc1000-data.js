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
    
    // 1. First, insert additional suppliers
    console.log('📦 Inserting material suppliers...');
    const suppliersData = [
      {
        name: '삼성종합건설(주)',
        contact_person: '김현준',
        phone: '02-2145-7890',
        email: 'materials@samsung.co.kr',
        address: '서울시 강남구 테헤란로 521',
        business_number: '456-78-90123'
      },
      {
        name: '대우건설자재',
        contact_person: '박소영',
        phone: '031-234-5678',
        email: 'supply@daewoo.co.kr',
        address: '경기도 성남시 분당구 판교로 235',
        business_number: '567-89-01234'
      },
      {
        name: '현대건설재료(주)',
        contact_person: '이승호',
        phone: '02-789-0123',
        email: 'info@hyundai-materials.com',
        address: '서울시 서초구 반포대로 58',
        business_number: '678-90-12345'
      }
    ];
    
    const { data: suppliers, error: suppliersError } = await supabase
      .from('material_suppliers')
      .upsert(suppliersData, { onConflict: 'business_number' });
    
    if (suppliersError) {
      console.warn('Suppliers warning:', suppliersError.message);
    }
    
    // 2. Get existing categories and suppliers for reference
    const { data: categories } = await supabase
      .from('material_categories')
      .select('*');
    
    const { data: allSuppliers } = await supabase
      .from('material_suppliers')
      .select('*');
    
    const cementCategory = categories?.find(c => c.name === '시멘트');
    const groutCategory = categories?.find(c => c.name === '그라우트');
    const defaultSupplier = allSuppliers?.[0];
    
    console.log('🧱 Inserting NPC-1000 materials...');
    
    // 3. Insert NPC-1000 materials
    const materialsData = [
      {
        category_id: groutCategory?.id || cementCategory?.id,
        name: 'NPC-1000 무수축 그라우트',
        unit: 'kg',
        unit_price: 1200.00,
        material_code: 'NPC-1000',
        supplier_id: defaultSupplier?.id,
        description: '고강도 무수축 그라우트, 압축강도 60MPa 이상'
      },
      {
        category_id: groutCategory?.id || cementCategory?.id,
        name: 'NPC-1000S 속경성 그라우트',
        unit: 'kg',
        unit_price: 1350.00,
        material_code: 'NPC-1000S',
        supplier_id: defaultSupplier?.id,
        description: '속경성 무수축 그라우트, 조기강도 발현'
      },
      {
        category_id: groutCategory?.id || cementCategory?.id,
        name: 'NPC-1000F 유동성 그라우트',
        unit: 'kg',
        unit_price: 1280.00,
        material_code: 'NPC-1000F',
        supplier_id: defaultSupplier?.id,
        description: '고유동성 무수축 그라우트, 펌핑성 우수'
      },
      {
        category_id: groutCategory?.id || cementCategory?.id,
        name: 'NPC-1000W 방수 그라우트',
        unit: 'kg',
        unit_price: 1450.00,
        material_code: 'NPC-1000W',
        supplier_id: defaultSupplier?.id,
        description: '방수형 무수축 그라우트, 수밀성 강화'
      },
      {
        category_id: cementCategory?.id,
        name: 'NPC 전용 시멘트',
        unit: 'kg',
        unit_price: 450.00,
        material_code: 'NPC-CEMENT',
        supplier_id: defaultSupplier?.id,
        description: 'NPC-1000 시리즈 전용 특수 시멘트'
      }
    ];
    
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .upsert(materialsData, { onConflict: 'material_code' });
    
    if (materialsError) {
      console.error('Materials error:', materialsError.message);
    } else {
      console.log(`✅ Inserted ${materialsData.length} NPC materials`);
    }
    
    // 4. Get sites and newly created materials
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .limit(5); // Limit to first 5 sites for demo
    
    const { data: npcMaterials } = await supabase
      .from('materials')
      .select('*')
      .like('material_code', 'NPC-%');
    
    const { data: firstProfile } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();
    
    if (!sites || !npcMaterials || !firstProfile) {
      console.error('Missing required data for inventory creation');
      return;
    }
    
    console.log('📋 Creating material inventory...');
    
    // 5. Create inventory records for each site and material combination
    const inventoryData = [];
    for (const site of sites) {
      for (const material of npcMaterials) {
        const baseStock = material.material_code === 'NPC-1000' ? 800 : 
                         material.material_code === 'NPC-1000S' ? 400 :
                         material.material_code === 'NPC-CEMENT' ? 1200 : 300;
        
        inventoryData.push({
          site_id: site.id,
          material_id: material.id,
          current_stock: baseStock + Math.floor(Math.random() * 200),
          minimum_stock: Math.floor(baseStock * 0.3),
          maximum_stock: Math.floor(baseStock * 2.5),
          last_checked_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: firstProfile.id
        });
      }
    }
    
    const { data: inventory, error: inventoryError } = await supabase
      .from('material_inventory')
      .upsert(inventoryData, { onConflict: 'site_id,material_id' });
    
    if (inventoryError) {
      console.error('Inventory error:', inventoryError.message);
    } else {
      console.log(`✅ Created ${inventoryData.length} inventory records`);
    }
    
    // 6. Create some material requests
    console.log('📝 Creating material requests...');
    
    const requestsData = [];
    const requestItemsData = [];
    
    for (let i = 0; i < 5; i++) {
      const site = sites[i % sites.length];
      const requestId = `req_${Date.now()}_${i}`;
      
      requestsData.push({
        site_id: site.id,
        requested_by: firstProfile.id,
        required_date: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: ['urgent', 'high', 'normal', 'low'][Math.floor(Math.random() * 4)],
        status: ['pending', 'approved', 'ordered'][Math.floor(Math.random() * 3)],
        notes: `NPC-1000 그라우트 요청 #${i + 1}`
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
    
    // 7. Verify final results
    console.log('🔍 Verifying data insertion...');
    
    const { data: finalMaterials } = await supabase
      .from('materials')
      .select('*')
      .like('material_code', 'NPC-%');
    
    const { data: finalInventory, count: inventoryCount } = await supabase
      .from('material_inventory')
      .select('*', { count: 'exact' });
    
    const { data: finalRequests, count: requestsCount } = await supabase
      .from('material_requests')
      .select('*', { count: 'exact' });
    
    console.log('📊 Final Results:');
    console.log(`   • NPC Materials: ${finalMaterials?.length || 0}`);
    console.log(`   • Inventory Records: ${inventoryCount || 0}`);
    console.log(`   • Material Requests: ${requestsCount || 0}`);
    
    if (finalMaterials && finalMaterials.length > 0) {
      console.log('🎉 NPC-1000 data successfully inserted!');
      console.log('📱 You can now view the data in the NPC-1000 관리 tab');
      
      console.log('\n📋 Available NPC Materials:');
      finalMaterials.forEach(material => {
        console.log(`   • ${material.material_code}: ${material.name} (${material.unit_price}원/${material.unit})`);
      });
    } else {
      console.log('❌ No NPC materials found. Please check for errors.');
    }
    
  } catch (error) {
    console.error('❌ Data insertion failed:', error.message);
    process.exit(1);
  }
}

insertNPC1000Data();