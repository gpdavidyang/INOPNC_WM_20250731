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

async function fixSiteInventory() {
  try {
    console.log('🔍 Checking which sites have inventory...');
    
    // Check current inventory distribution
    const { data: currentInventory } = await supabase
      .from('material_inventory')
      .select(`
        site_id,
        sites!inner(name),
        materials!inner(code)
      `)
      .like('materials.code', 'NPC-%');
    
    const siteDistribution = {};
    currentInventory?.forEach(inv => {
      const siteName = inv.sites?.name || 'Unknown';
      if (!siteDistribution[siteName]) siteDistribution[siteName] = 0;
      siteDistribution[siteName]++;
    });
    
    console.log('Current inventory distribution by site:');
    Object.entries(siteDistribution).forEach(([site, count]) => {
      console.log(`  • ${site}: ${count} materials`);
    });
    
    // Check if user's current site has inventory
    const userSiteId = 'fb777dd6-fde2-4fe7-a83b-72605372d0c5'; // 송파 C현장
    
    const { data: userSiteCheck } = await supabase
      .from('material_inventory')
      .select('count')
      .eq('site_id', userSiteId);
    
    console.log(`\nUser's current site (${userSiteId}) inventory count:`, userSiteCheck?.length || 0);
    
    if (!userSiteCheck || userSiteCheck.length === 0) {
      console.log('🔧 Adding inventory for user\'s current site...');
      
      // Get NPC materials
      const { data: npcMaterials } = await supabase
        .from('materials')
        .select('*')
        .like('code', 'NPC-%');
      
      console.log('Found NPC materials:', npcMaterials?.length || 0);
      
      if (npcMaterials && npcMaterials.length > 0) {
        const inventoryData = [];
        
        for (const material of npcMaterials) {
          const baseStock = material.code === 'NPC-1000' ? 800 : 
                           material.code === 'NPC-1000S' ? 400 :
                           material.code === 'NPC-CEMENT' ? 1200 : 
                           material.code === 'NPC-BOND' ? 50 : 300;
          
          const currentStock = baseStock + Math.floor(Math.random() * 200);
          const reservedStock = Math.floor(currentStock * 0.1);
          
          inventoryData.push({
            site_id: userSiteId,
            material_id: material.id,
            current_stock: currentStock,
            reserved_stock: reservedStock
          });
        }
        
        console.log(`📦 Inserting ${inventoryData.length} inventory records for user's site...`);
        
        const { data: newInventory, error: insertError } = await supabase
          .from('material_inventory')
          .insert(inventoryData);
        
        if (insertError) {
          console.error('Insert error:', insertError.message);
        } else {
          console.log('✅ Successfully added inventory for user\'s site!');
        }
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying user site inventory...');
    
    const { data: verifyInventory } = await supabase
      .from('material_inventory')
      .select(`
        current_stock,
        available_stock,
        materials!inner(
          code,
          name
        )
      `)
      .eq('site_id', userSiteId)
      .like('materials.code', 'NPC-%');
    
    console.log('📊 User site inventory verification:');
    console.log('Count:', verifyInventory?.length || 0);
    if (verifyInventory && verifyInventory.length > 0) {
      const totalStock = verifyInventory.reduce((sum, item) => sum + (item.current_stock || 0), 0);
      console.log('Total stock:', totalStock);
      console.log('Sample items:');
      verifyInventory.slice(0, 3).forEach(item => {
        console.log(`  • ${item.materials?.code}: ${item.current_stock} current, ${item.available_stock} available`);
      });
    }
    
    console.log('\n🎉 Site inventory fix completed!');
    console.log('📱 The NPC-1000 tab should now show data for the user\'s current site!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixSiteInventory();