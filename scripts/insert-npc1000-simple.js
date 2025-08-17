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
    
    // 1. Check existing materials table structure
    const { data: existingMaterials } = await supabase
      .from('materials')
      .select('*')
      .limit(1);
    
    console.log('📋 Existing materials table structure:', Object.keys(existingMaterials?.[0] || {}));
    
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
    
    console.log('🏢 Found suppliers:', allSuppliers?.length || 0);
    console.log('📂 Found categories:', categories?.length || 0);
    console.log('🎯 Using category ID:', groutCategory?.id || cementCategory?.id);
    console.log('🎯 Using supplier ID:', defaultSupplier?.id);
    
    console.log('🧱 Inserting NPC-1000 materials...');
    
    // 3. Insert NPC-1000 materials (without description field)
    const materialsData = [
      {
        category_id: groutCategory?.id || cementCategory?.id,
        name: 'NPC-1000 무수축 그라우트',
        unit: 'kg',
        unit_price: 1200.00,
        material_code: 'NPC-1000',
        supplier_id: defaultSupplier?.id
      },
      {
        category_id: groutCategory?.id || cementCategory?.id,
        name: 'NPC-1000S 속경성 그라우트',
        unit: 'kg',
        unit_price: 1350.00,
        material_code: 'NPC-1000S',
        supplier_id: defaultSupplier?.id
      },
      {
        category_id: groutCategory?.id || cementCategory?.id,
        name: 'NPC-1000F 유동성 그라우트',
        unit: 'kg',
        unit_price: 1280.00,
        material_code: 'NPC-1000F',
        supplier_id: defaultSupplier?.id
      },
      {
        category_id: groutCategory?.id || cementCategory?.id,
        name: 'NPC-1000W 방수 그라우트',
        unit: 'kg',
        unit_price: 1450.00,
        material_code: 'NPC-1000W',
        supplier_id: defaultSupplier?.id
      },
      {
        category_id: cementCategory?.id,
        name: 'NPC 전용 시멘트',
        unit: 'kg',
        unit_price: 450.00,
        material_code: 'NPC-CEMENT',
        supplier_id: defaultSupplier?.id
      }
    ];
    
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .upsert(materialsData, { onConflict: 'material_code' });
    
    if (materialsError) {
      console.error('Materials error:', materialsError.message);
      return;
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
    
    console.log('📊 Retrieved data:');
    console.log(`   • Sites: ${sites?.length || 0}`);
    console.log(`   • NPC Materials: ${npcMaterials?.length || 0}`);
    console.log(`   • Profile: ${firstProfile?.id ? 'Found' : 'Not found'}`);
    
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
    
    console.log(`📦 Preparing ${inventoryData.length} inventory records...`);
    
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
    
    for (let i = 0; i < 3; i++) {
      const site = sites[i % sites.length];
      
      requestsData.push({
        site_id: site.id,
        requested_by: firstProfile.id,
        required_date: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: ['urgent', 'high', 'normal'][i % 3],
        status: ['pending', 'approved', 'ordered'][i % 3],
        notes: `NPC-1000 그라우트 요청 #${i + 1} - 기초공사용`
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
    
    // 7. Create some material transactions
    console.log('📋 Creating material transactions...');
    
    const transactionsData = [];
    for (let i = 0; i < 10; i++) {
      const site = sites[i % sites.length];
      const material = npcMaterials[i % npcMaterials.length];
      
      transactionsData.push({
        site_id: site.id,
        material_id: material.id,
        transaction_type: ['in', 'out', 'out', 'out'][i % 4], // More outs than ins
        quantity: 25 + Math.floor(Math.random() * 75),
        reference_type: 'daily_report',
        performed_by: firstProfile.id,
        notes: `${material.name} ${['입고', '사용', '사용', '사용'][i % 4]} - 현장작업`,
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
      .like('material_code', 'NPC-%');
    
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
        console.log(`   • ${material.material_code}: ${material.name} (${material.unit_price}원/${material.unit})`);
      });
      
      console.log('\n📱 You can now view the data in the NPC-1000 관리 tab!');
      console.log('🔄 Refresh your browser to see the updated material data.');
    } else {
      console.log('❌ No NPC materials found. Please check for errors.');
    }
    
  } catch (error) {
    console.error('❌ Data insertion failed:', error);
    process.exit(1);
  }
}

insertNPC1000Data();