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

async function insertNPCInventory() {
  try {
    console.log('🚀 Inserting NPC-1000 inventory with simplified schema...');
    
    // Get sites and NPC materials
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(5);
    
    const { data: npcMaterials } = await supabase
      .from('materials')
      .select('*')
      .like('code', 'NPC-%');
    
    console.log('Found sites:', sites?.length || 0);
    console.log('Found NPC materials:', npcMaterials?.length || 0);
    
    if (!sites || !npcMaterials || sites.length === 0 || npcMaterials.length === 0) {
      console.error('Missing sites or materials data');
      return;
    }
    
    // Clear existing inventory for NPC materials
    console.log('🗑️ Clearing existing NPC inventory...');
    for (const material of npcMaterials) {
      await supabase
        .from('material_inventory')
        .delete()
        .eq('material_id', material.id);
    }
    
    console.log('📦 Creating new inventory records...');
    
    // Create inventory records with only required fields
    const inventoryData = [];
    for (const site of sites) {
      for (const material of npcMaterials) {
        const baseStock = material.code === 'NPC-1000' ? 800 : 
                         material.code === 'NPC-1000S' ? 400 :
                         material.code === 'NPC-CEMENT' ? 1200 : 
                         material.code === 'NPC-BOND' ? 50 : 300;
        
        const currentStock = baseStock + Math.floor(Math.random() * 200);
        const reservedStock = Math.floor(currentStock * 0.1); // 10% reserved
        
        inventoryData.push({
          site_id: site.id,
          material_id: material.id,
          current_stock: currentStock,
          reserved_stock: reservedStock
          // available_stock will be computed automatically if it's a generated column
        });
      }
    }
    
    console.log(`📋 Inserting ${inventoryData.length} inventory records...`);
    
    const { data: inventory, error: inventoryError } = await supabase
      .from('material_inventory')
      .insert(inventoryData);
    
    if (inventoryError) {
      console.error('Inventory insertion error:', inventoryError.message);
      
      // Try with even simpler data - just current_stock
      console.log('🔧 Trying with minimal data...');
      const simpleData = inventoryData.map(item => ({
        site_id: item.site_id,
        material_id: item.material_id,
        current_stock: item.current_stock
      }));
      
      const { data: simpleInventory, error: simpleError } = await supabase
        .from('material_inventory')
        .insert(simpleData);
      
      if (simpleError) {
        console.error('Simple insertion error:', simpleError.message);
        return;
      } else {
        console.log(`✅ Created ${simpleData.length} inventory records (simple)`);
      }
    } else {
      console.log(`✅ Created ${inventoryData.length} inventory records`);
    }
    
    // Verify the insertion
    console.log('🔍 Verifying insertion...');
    
    const { data: verifyInventory } = await supabase
      .from('material_inventory')
      .select(`
        current_stock,
        reserved_stock,
        available_stock,
        materials!inner(
          code,
          name
        )
      `)
      .like('materials.code', 'NPC-%')
      .limit(10);
    
    console.log('\n🎉 SUCCESS! Inventory created!');
    console.log('================================================');
    console.log('📊 Sample inventory records:');
    verifyInventory?.forEach(inv => {
      console.log(`   • ${inv.materials?.code}: ${inv.current_stock} current, ${inv.reserved_stock || 0} reserved, ${inv.available_stock || 'auto'} available`);
    });
    
    console.log('\n📱 The NPC-1000 관리 tab should now show data!');
    console.log('🔄 Refresh your browser to see the updated inventory.');
    
  } catch (error) {
    console.error('❌ Inventory insertion failed:', error);
  }
}

insertNPCInventory();