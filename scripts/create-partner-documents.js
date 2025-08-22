const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPartnerDocuments() {
  try {
    console.log('🚀 Creating partner documents and site assignments...');

    // 1. First ensure we have test sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .limit(5);

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
      return;
    }

    console.log(`Found ${sites.length} sites`);
    
    // Get the first site for 강남 A현장
    const gangnamSite = sites.find(s => s.name.includes('강남')) || sites[0];
    console.log(`Using site: ${gangnamSite.name} (ID: ${gangnamSite.id})`);

    // 2. Create documents for 강남 A현장
    const documentsToCreate = [
      {
        title: '견적서_2024년8월',
        description: '강남 A현장 8월 견적서',
        file_name: '견적서_2024년8월.pdf',
        file_url: '/documents/estimates/견적서_2024년8월.pdf',
        mime_type: 'application/pdf',
        file_size: 2048576, // 2MB
        site_id: gangnamSite.id,
        document_type: 'certificate',
        is_public: false,
        folder_path: 'billing/estimates'
      },
      {
        title: '시공계획서_강남A현장',
        description: '강남 A현장 시공계획서',
        file_name: '시공계획서_강남A현장.pdf',
        file_url: '/documents/plans/시공계획서_강남A현장.pdf',
        mime_type: 'application/pdf',
        file_size: 5242880, // 5MB
        site_id: gangnamSite.id,
        document_type: 'certificate',
        is_public: false,
        folder_path: 'billing/plans'
      },
      {
        title: '전자세금계산서_202408',
        description: '2024년 8월 전자세금계산서',
        file_name: '전자세금계산서_202408.pdf',
        file_url: '/documents/invoices/전자세금계산서_202408.pdf',
        mime_type: 'application/pdf',
        file_size: 1024000, // 1MB
        site_id: gangnamSite.id,
        document_type: 'certificate',
        is_public: false,
        folder_path: 'billing/invoices'
      },
      {
        title: '계약서_강남A현장',
        description: '강남 A현장 건설공사 계약서',
        file_name: '계약서_강남A현장.pdf',
        file_url: '/documents/contracts/계약서_강남A현장.pdf',
        mime_type: 'application/pdf',
        file_size: 3145728, // 3MB
        site_id: gangnamSite.id,
        document_type: 'certificate',
        is_public: false,
        folder_path: 'billing/contracts'
      },
      {
        title: '사진대지문서_8월',
        description: '강남 A현장 8월 작업사진',
        file_name: '사진대지문서_8월.pdf',
        file_url: '/documents/photos/사진대지문서_8월.pdf',
        mime_type: 'application/pdf',
        file_size: 8388608, // 8MB
        site_id: gangnamSite.id,
        document_type: 'certificate',
        is_public: false,
        folder_path: 'billing/photos'
      }
    ];

    // 3. Get partner user
    const { data: partnerUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'partner@inopnc.com')
      .single();

    if (userError || !partnerUser) {
      console.error('Partner user not found:', userError);
      return;
    }

    console.log(`Found partner user: ${partnerUser.email}`);

    // 4. Insert documents
    const documentsWithUser = documentsToCreate.map(doc => ({
      ...doc,
      owner_id: partnerUser.id
    }));

    const { data: insertedDocs, error: insertError } = await supabase
      .from('documents')
      .insert(documentsWithUser)
      .select();

    if (insertError) {
      console.error('Error inserting documents:', insertError);
      return;
    }

    console.log(`✅ Created ${insertedDocs.length} documents`);

    // 5. Ensure partner has access to the site
    const { error: accessError } = await supabase
      .from('site_memberships')
      .upsert({
        site_id: gangnamSite.id,
        user_id: partnerUser.id,
        role: 'partner',
        status: 'active'
      });

    if (accessError) {
      console.log('Site membership may already exist:', accessError.message);
    } else {
      console.log('✅ Created site membership for partner');
    }

    // 6. Create additional sites for other testing
    const additionalSites = [
      {
        name: '송파 C현장',
        address: '서울시 송파구 올림픽로 300',
        manager_id: partnerUser.id,
        status: 'active'
      },
      {
        name: '서초 B현장', 
        address: '서울시 서초구 서초대로 789',
        manager_id: partnerUser.id,
        status: 'completed'
      }
    ];

    for (const siteData of additionalSites) {
      const { data: existingSite } = await supabase
        .from('sites')
        .select('id')
        .eq('name', siteData.name)
        .single();

      if (!existingSite) {
        const { data: newSite, error: siteError } = await supabase
          .from('sites')
          .insert(siteData)
          .select()
          .single();

        if (!siteError) {
          console.log(`✅ Created site: ${siteData.name}`);
          
          // Create site membership
          await supabase
            .from('site_memberships')
            .insert({
              site_id: newSite.id,
              user_id: partnerUser.id,
              role: 'partner',
              status: 'active'
            });
        }
      }
    }

    console.log('🎉 Partner documents and sites setup completed!');

  } catch (error) {
    console.error('Error in createPartnerDocuments:', error);
  }
}

createPartnerDocuments();