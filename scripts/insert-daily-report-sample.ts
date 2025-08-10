import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertSampleDailyReports() {
  console.log('🔄 Inserting sample daily reports...')
  
  try {
    // Get manager user ID
    const { data: managerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', 'manager@inopnc.com')
      .single()
    
    if (profileError) {
      console.error('Error fetching manager profile:', profileError)
      return
    }
    
    console.log('✅ Found manager profile:', managerProfile)
    
    // Get site ID
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .limit(1)
    
    if (sitesError || !sites || sites.length === 0) {
      console.error('Error fetching sites:', sitesError)
      return
    }
    
    const siteId = sites[0].id
    console.log('✅ Using site:', sites[0])
    
    // Insert sample daily reports
    const today = new Date()
    const reports = []
    
    for (let i = 0; i < 5; i++) {
      const workDate = new Date(today)
      workDate.setDate(today.getDate() - i)
      
      reports.push({
        site_id: siteId,
        work_date: workDate.toISOString().split('T')[0],
        work_content: `작업 내용 ${i + 1}: 콘크리트 타설 및 철근 배근 작업`,
        weather: '맑음',
        temperature_high: 28 + i,
        temperature_low: 20 + i,
        notes: `오늘 작업 진행 상황: ${i + 1}층 슬라브 타설 완료`,
        status: i === 0 ? 'draft' : 'submitted',
        created_by: managerProfile.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // 부재명과 공정 정보 추가
        member_name: ['슬라브', '기둥', '거더', '기타'][i % 4],
        process_type: ['균열', '면', '마감', '기타'][i % 4],
        total_workers: 10 + i
      })
    }
    
    const { data: insertedReports, error: insertError } = await supabase
      .from('daily_reports')
      .insert(reports)
      .select()
    
    if (insertError) {
      console.error('Error inserting reports:', insertError)
      return
    }
    
    console.log('✅ Successfully inserted', insertedReports?.length, 'daily reports')
    
    // Verify the data
    const { data: verifyData, error: verifyError } = await supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        work_content,
        status,
        sites(name),
        profiles!daily_reports_created_by_fkey(full_name)
      `)
      .order('work_date', { ascending: false })
      .limit(10)
    
    if (verifyError) {
      console.error('Error verifying data:', verifyError)
    } else {
      console.log('\n📊 Verification - Daily reports in database:')
      verifyData?.forEach(report => {
        console.log(`  - ${report.work_date}: ${report.work_content?.substring(0, 30)}... (${report.status})`)
        console.log(`    Site: ${report.sites?.name}, Created by: ${report.profiles?.full_name}`)
      })
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

insertSampleDailyReports()