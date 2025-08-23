const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRequiredDocuments() {
  console.log('🚀 Creating required documents test data...\n');
  
  try {
    // 1. Get users to create documents for
    console.log('1️⃣ Fetching users...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['worker', 'site_manager', 'partner'])
      .order('created_at');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`✅ Found ${users.length} users\n`);
    
    // 2. Get sites for assignment
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'active')
      .limit(5);
    
    if (sitesError) {
      console.error('❌ Error fetching sites:', sitesError);
      return;
    }
    
    console.log(`✅ Found ${sites.length} active sites\n`);
    
    // 3. Define required document types
    const documentTypes = [
      { name: '안전교육이수증', type: 'safety_certificate', description: '건설현장 안전교육 이수증명서', roles: ['worker'] },
      { name: '건강진단서', type: 'health_certificate', description: '건설업 종사자 건강진단서', roles: ['worker'] },
      { name: '보험증서', type: 'insurance_certificate', description: '산재보험 및 고용보험 가입증명서', roles: ['worker'] },
      { name: '신분증 사본', type: 'id_copy', description: '주민등록증 또는 운전면허증 사본', roles: ['worker'] },
      { name: '자격증', type: 'license', description: '해당 업무 관련 자격증', roles: ['worker', 'site_manager'] },
      { name: '근로계약서', type: 'employment_contract', description: '정식 근로계약서', roles: ['worker'] },
      { name: '통장사본', type: 'bank_account', description: '급여 입금용 통장 사본', roles: ['worker'] },
      { name: '사업자등록증', type: 'business_license', description: '사업자등록증 사본', roles: ['partner'] },
      { name: '법인등기부등본', type: 'corporate_register', description: '법인등기부등본', roles: ['partner'] }
    ];
    
    // 4. Create documents for each user
    console.log('2️⃣ Creating required documents for each user...\n');
    
    let createdCount = 0;
    let errorCount = 0;
    const createdDocuments = [];
    
    for (const user of users) {
      console.log(`👤 ${user.full_name || user.email} (${user.role})`);
      
      // Filter document types for this user's role
      const userDocTypes = documentTypes.filter(doc => 
        doc.roles.includes(user.role)
      );
      
      // Assign a random site
      const userSite = sites[Math.floor(Math.random() * sites.length)];
      
      for (const docType of userDocTypes) {
        // Random status
        const statuses = ['pending', 'approved', 'rejected'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Random date (within last 30 days)
        const randomDays = Math.floor(Math.random() * 30);
        const submittedDate = new Date();
        submittedDate.setDate(submittedDate.getDate() - randomDays);
        
        // Create document data matching the actual schema
        const documentData = {
          title: `${docType.name} - ${user.full_name || user.email}`,
          description: `${user.full_name || user.email}님이 제출한 ${docType.description} (상태: ${randomStatus})`,
          file_url: `https://example.com/documents/${user.id}/${docType.type}.pdf`,
          file_name: `${docType.type}_${user.id}.pdf`,
          file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB ~ 5MB
          mime_type: 'application/pdf',
          document_type: 'required_' + docType.type, // Prefix with 'required_' to identify
          folder_path: `/required/${user.role}/${user.id}`,
          owner_id: user.id,
          is_public: false,
          site_id: userSite?.id || null,
          created_at: submittedDate.toISOString(),
          updated_at: submittedDate.toISOString()
        };
        
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single();
        
        if (docError) {
          console.error(`   ❌ ${docType.name}: ${docError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ ${docType.name}: Created (${randomStatus})`);
          createdCount++;
          createdDocuments.push(document);
        }
      }
    }
    
    // 5. Summary statistics
    console.log('\n3️⃣ Creation Summary');
    console.log(`   ✅ Success: ${createdCount} documents`);
    console.log(`   ❌ Failed: ${errorCount} documents`);
    
    // 6. Verify created documents
    console.log('\n4️⃣ Verifying created required documents...');
    
    const { data: requiredDocs, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .like('document_type', 'required_%')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('❌ Error fetching documents:', fetchError);
    } else {
      console.log(`\n📊 Recent required documents (${requiredDocs?.length || 0} total):`);
      
      for (const doc of requiredDocs || []) {
        console.log(`   - ${doc.title}`);
        console.log(`     Type: ${doc.document_type}`);
        console.log(`     Size: ${Math.round(doc.file_size / 1024)}KB`);
        console.log(`     Created: ${new Date(doc.created_at).toLocaleDateString()}`);
      }
    }
    
    // 7. Statistics by document type
    console.log('\n5️⃣ Statistics by Document Type');
    
    const { data: allRequiredDocs } = await supabase
      .from('documents')
      .select('document_type')
      .like('document_type', 'required_%');
    
    if (allRequiredDocs) {
      const typeCount = allRequiredDocs.reduce((acc, doc) => {
        const type = doc.document_type.replace('required_', '');
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   📈 Document type distribution:');
      Object.entries(typeCount).forEach(([type, count]) => {
        const docInfo = documentTypes.find(d => d.type === type);
        console.log(`      - ${docInfo?.name || type}: ${count} documents`);
      });
    }
    
    console.log('\n✅ Required documents test data created successfully!');
    console.log('📌 View in admin: http://localhost:3000/dashboard/admin/documents/required');
    console.log('💡 You can now view, add, edit, and delete required documents by worker.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
createRequiredDocuments();