const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCustomerData() {
  try {
    console.log('Creating customer data for customer@inopnc.com...');
    
    // Get customer profile
    const { data: customerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'customer@inopnc.com')
      .single();
    
    if (profileError) {
      console.error('Error fetching customer profile:', profileError);
      return;
    }
    
    console.log('Customer profile found:', customerProfile.id);
    
    // Get accessible sites for customer
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .limit(3);
    
    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
      return;
    }
    
    const mainSite = sites[0];
    console.log('Using main site:', mainSite.name);
    
    // Create documents for customer
    const documentsToCreate = [
      // Personal documents
      {
        title: '고객사 계약서',
        description: '고객사 계약 관련 문서',
        file_name: '고객사_계약서.pdf',
        file_size: 2457600,
        mime_type: 'application/pdf',
        document_type: 'personal',
        site_id: mainSite.id
      },
      {
        title: '프로젝트 제안서',
        description: '프로젝트 제안서 문서',
        file_name: '프로젝트_제안서.docx',
        file_size: 1843200,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        document_type: 'personal',
        site_id: mainSite.id
      },
      {
        title: '비용 산출서',
        description: '프로젝트 비용 산출 자료',
        file_name: '비용_산출서.xlsx',
        file_size: 987654,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        document_type: 'personal',
        site_id: mainSite.id
      },
      // Shared documents
      {
        title: '현장 협의록',
        description: '현장 협의 회의록',
        file_name: '현장_협의록.pdf',
        file_size: 3216540,
        mime_type: 'application/pdf',
        document_type: 'shared',
        site_id: mainSite.id
      },
      {
        title: '품질관리 체크리스트',
        description: '품질관리 점검 항목',
        file_name: '품질관리_체크리스트.pdf',
        file_size: 1567890,
        mime_type: 'application/pdf',
        document_type: 'shared',
        site_id: mainSite.id
      },
      // Certificate documents
      {
        title: '공사 진행률 증명서',
        description: '공사 진행률 공식 증명서',
        file_name: '공사_진행률_증명서.pdf',
        file_size: 2134567,
        mime_type: 'application/pdf',
        document_type: 'certificate',
        site_id: mainSite.id
      },
      {
        title: '자재 검수 증명서',
        description: '자재 품질 검수 증명서',
        file_name: '자재_검수_증명서.pdf',
        file_size: 1789345,
        mime_type: 'application/pdf',
        document_type: 'certificate',
        site_id: mainSite.id
      }
    ];
    
    console.log('Creating documents...');
    for (const doc of documentsToCreate) {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: doc.title,
          description: doc.description,
          file_name: doc.file_name,
          file_size: doc.file_size,
          mime_type: doc.mime_type,
          document_type: doc.document_type,
          file_url: `/customer-docs/${doc.file_name}`,
          folder_path: `/customer/${doc.document_type}`,
          site_id: doc.site_id,
          owner_id: customerProfile.id,
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating document:', doc.title, error);
      } else {
        console.log('✓ Created document:', doc.title);
      }
    }
    
    // Create work logs for the past 10 days
    console.log('Creating work logs...');
    const memberNames = ['고객관리팀', '품질관리팀', '안전관리팀', '현장관리팀'];
    const processTypes = ['기초', '골조', '마감', '설비'];
    
    for (let i = 0; i < 10; i++) {
      const workDate = new Date();
      workDate.setDate(workDate.getDate() - i);
      
      const { data, error } = await supabase
        .from('daily_reports')
        .insert({
          site_id: mainSite.id,
          work_date: workDate.toISOString().split('T')[0],
          member_name: memberNames[i % memberNames.length],
          process_type: processTypes[i % processTypes.length],
          total_workers: Math.floor(Math.random() * 20) + 5,
          npc1000_incoming: Math.floor(Math.random() * 100) + 50,
          npc1000_used: Math.floor(Math.random() * 80) + 20,
          npc1000_remaining: Math.floor(Math.random() * 50) + 10,
          issues: i % 3 === 0 ? '특이사항 없음' : null,
          status: 'submitted',
          created_by: customerProfile.id,
          created_at: workDate.toISOString(),
          updated_at: workDate.toISOString()
        });
      
      if (error) {
        console.error('Error creating work log:', memberNames[i % memberNames.length], error);
      } else {
        console.log('✓ Created work log:', memberNames[i % memberNames.length]);
      }
    }
    
    // Final verification
    console.log('\n=== Final Customer Data Summary ===');
    
    const { data: finalDocs } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', customerProfile.id);
    
    const { data: finalLogs } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('created_by', customerProfile.id);
    
    console.log(`Customer: ${customerProfile.email}`);
    console.log(`Total Documents: ${finalDocs?.length || 0}`);
    console.log(`Total Work Logs: ${finalLogs?.length || 0}`);
    console.log(`Connected Sites: ${sites.length}`);
    
    if (finalDocs && finalDocs.length > 0) {
      console.log('\nDocument Details:');
      finalDocs.forEach(doc => {
        console.log(`- ${doc.title} (${doc.document_type})`);
      });
      
      console.log('\nDocument Types Summary:');
      console.log('- Personal:', finalDocs?.filter(d => d.document_type === 'personal').length || 0);
      console.log('- Shared:', finalDocs?.filter(d => d.document_type === 'shared').length || 0);
      console.log('- Certificates:', finalDocs?.filter(d => d.document_type === 'certificate').length || 0);
    }
    
    if (finalLogs && finalLogs.length > 0) {
      console.log('\nWork Log Details:');
      finalLogs.forEach(log => {
        console.log(`- ${log.work_date}: ${log.member_name} - ${log.process_type}`);
      });
    }
    
    console.log('\nData creation completed successfully!');
    
  } catch (error) {
    console.error('Error creating customer data:', error);
  }
}

createCustomerData();