// Add sample data for partner work logs testing
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSampleData() {
  try {
    console.log('🚀 Adding sample partner work logs data...')
    
    // Get existing sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .limit(3)
    
    if (sitesError) {
      throw sitesError
    }
    
    if (!sites || sites.length === 0) {
      console.log('No sites found, creating sample sites...')
      // Create sample sites if none exist
      const { data: newSites, error: createSitesError } = await supabase
        .from('sites')
        .insert([
          { name: '강남 A현장', address: '서울시 강남구', status: 'active' },
          { name: '송파 B현장', address: '서울시 송파구', status: 'active' },
          { name: '송파 C현장', address: '서울시 송파구', status: 'active' }
        ])
        .select()
      
      if (createSitesError) {
        throw createSitesError
      }
      sites.push(...(newSites || []))
    }
    
    console.log(`Found ${sites.length} sites`)
    
    // Get existing workers
    const { data: workers, error: workersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'worker')
      .limit(5)
    
    if (workersError) {
      throw workersError
    }
    
    if (!workers || workers.length === 0) {
      console.log('No workers found, cannot create sample data without workers')
      return
    }
    
    console.log(`Found ${workers.length} workers`)
    
    // Generate sample daily reports
    const sampleReports = []
    const today = new Date()
    
    for (let i = 0; i < 15; i++) {
      const workDate = new Date(today)
      workDate.setDate(today.getDate() - Math.floor(Math.random() * 30))
      
      const site = sites[Math.floor(Math.random() * sites.length)]
      const worker = workers[Math.floor(Math.random() * workers.length)]
      
      const memberNames = ['기초 콘크리트', '철골 조립', '방수', '내부 마감', '외벽 미장', '배관 설치', '전기 배선', '슬라브', '천장 마감']
      const processTypes = ['균열', '면', '마감', '기타']
      const issues = [null, '작업 순조롭게 진행', '우천으로 인한 일부 지연', '자재 배송 지연', '특이사항 없음']
      
      sampleReports.push({
        site_id: site.id,
        work_date: workDate.toISOString().split('T')[0],
        member_name: memberNames[Math.floor(Math.random() * memberNames.length)],
        process_type: processTypes[Math.floor(Math.random() * processTypes.length)],
        total_workers: Math.floor(Math.random() * 15) + 5,
        npc1000_incoming: Math.floor(Math.random() * 400) + 100,
        npc1000_used: Math.floor(Math.random() * 200) + 50,
        npc1000_remaining: Math.floor(Math.random() * 200) + 50,
        issues: issues[Math.floor(Math.random() * issues.length)],
        status: 'submitted',
        created_by: worker.id
      })
    }
    
    // Insert sample reports
    const { data: insertedReports, error: insertError } = await supabase
      .from('daily_reports')
      .upsert(sampleReports, { 
        onConflict: 'site_id,work_date,created_by',
        ignoreDuplicates: true 
      })
      .select()
    
    if (insertError) {
      throw insertError
    }
    
    console.log(`✅ Successfully added ${insertedReports?.length || 0} sample daily reports`)
    
    // Verify data
    const { data: verifyData, error: verifyError } = await supabase
      .from('daily_reports')
      .select('id, work_date, member_name, status')
      .eq('status', 'submitted')
      .order('work_date', { ascending: false })
      .limit(10)
    
    if (verifyError) {
      throw verifyError
    }
    
    console.log(`📊 Total submitted reports: ${verifyData?.length || 0}`)
    if (verifyData && verifyData.length > 0) {
      console.log('Sample data:')
      verifyData.forEach(report => {
        console.log(`  - ${report.work_date}: ${report.member_name} (${report.status})`)
      })
    }
    
    console.log('🎉 Sample data setup complete!')
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error)
    process.exit(1)
  }
}

addSampleData()