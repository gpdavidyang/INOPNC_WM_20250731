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

async function debugInventoryQuery() {
  try {
    console.log('🔍 Debugging inventory query step by step...');
    
    const userSiteId = 'fb777dd6-fde2-4fe7-a83b-72605372d0c5'; // 송파 C현장
    
    // Step 1: Check raw inventory for this site
    console.log('\n1️⃣ Raw inventory for user site:');
    const { data: rawInventory, error: rawError } = await supabase
      .from('material_inventory')
      .select('*')
      .eq('site_id', userSiteId);
    
    console.log('Raw inventory count:', rawInventory?.length || 0);
    console.log('Raw error:', rawError?.message || 'None');
    if (rawInventory && rawInventory.length > 0) {
      console.log('Sample raw record:', rawInventory[0]);
    }
    
    // Step 2: Check materials that exist
    console.log('\n2️⃣ Available NPC materials:');
    const { data: npcMaterials, error: matError } = await supabase
      .from('materials')
      .select('*')
      .like('code', 'NPC-%');
    
    console.log('NPC materials count:', npcMaterials?.length || 0);
    console.log('Materials error:', matError?.message || 'None');
    if (npcMaterials && npcMaterials.length > 0) {
      console.log('Sample material:', {
        id: npcMaterials[0].id,
        code: npcMaterials[0].code,
        name: npcMaterials[0].name
      });
    }
    
    // Step 3: Check if inventory material_ids match material ids
    if (rawInventory && rawInventory.length > 0 && npcMaterials && npcMaterials.length > 0) {
      console.log('\n3️⃣ Checking material ID matches:');
      const inventoryMaterialIds = rawInventory.map(inv => inv.material_id);
      const npcMaterialIds = npcMaterials.map(mat => mat.id);
      
      console.log('Inventory material IDs:', inventoryMaterialIds);
      console.log('NPC material IDs (first 3):', npcMaterialIds.slice(0, 3));
      
      const matches = inventoryMaterialIds.filter(id => npcMaterialIds.includes(id));
      console.log('Matching IDs:', matches.length);
    }
    
    // Step 4: Try join query without inner join
    console.log('\n4️⃣ Testing join query without inner:');
    const { data: joinData, error: joinError } = await supabase
      .from('material_inventory')
      .select(`
        current_stock,
        available_stock,
        materials(
          code,
          name
        )
      `)
      .eq('site_id', userSiteId);
    
    console.log('Join query count:', joinData?.length || 0);
    console.log('Join error:', joinError?.message || 'None');
    if (joinData && joinData.length > 0) {
      console.log('Sample joined record:', joinData[0]);
    }
    
    // Step 5: Filter materials manually
    console.log('\n5️⃣ Manual filtering for NPC materials:');
    const npcJoinData = joinData?.filter(item => 
      item.materials && item.materials.code && item.materials.code.startsWith('NPC-')
    );
    
    console.log('NPC filtered count:', npcJoinData?.length || 0);
    if (npcJoinData && npcJoinData.length > 0) {
      console.log('Sample NPC record:', npcJoinData[0]);
    }
    
    // Step 6: Add inventory for missing NPC materials
    if (rawInventory && npcMaterials && rawInventory.length < npcMaterials.length) {
      console.log('\n6️⃣ Adding missing NPC materials to inventory...');
      
      const existingMaterialIds = rawInventory.map(inv => inv.material_id);
      const missingMaterials = npcMaterials.filter(mat => !existingMaterialIds.includes(mat.id));
      
      console.log('Missing materials count:', missingMaterials.length);
      
      if (missingMaterials.length > 0) {
        const newInventoryData = missingMaterials.map(material => {
          const baseStock = material.code === 'NPC-1000' ? 800 : 
                           material.code === 'NPC-1000S' ? 400 :
                           material.code === 'NPC-CEMENT' ? 1200 : 
                           material.code === 'NPC-BOND' ? 50 : 300;
          
          const currentStock = baseStock + Math.floor(Math.random() * 200);
          const reservedStock = Math.floor(currentStock * 0.1);
          
          return {
            site_id: userSiteId,
            material_id: material.id,
            current_stock: currentStock,
            reserved_stock: reservedStock
          };
        });
        
        console.log(`Adding ${newInventoryData.length} missing inventory records...`);
        
        const { data: addedInventory, error: addError } = await supabase
          .from('material_inventory')
          .insert(newInventoryData);
        
        if (addError) {
          console.error('Add error:', addError.message);
        } else {
          console.log('✅ Added missing inventory records!');
        }
      }
    }
    
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugInventoryQuery();