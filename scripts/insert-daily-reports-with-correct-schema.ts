import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertSampleDailyReports() {
  console.log('🔄 Inserting sample daily reports with correct schema...')
  
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
    
    // Insert sample daily reports with correct schema
    const today = new Date()
    const reports = []
    
    for (let i = 0; i < 5; i++) {
      const workDate = new Date(today)
      workDate.setDate(today.getDate() - i)
      
      reports.push({
        site_id: siteId,
        work_date: workDate.toISOString().split('T')[0],
        member_name: ['슬라브', '기둥', '거더', '기타'][i % 4],
        process_type: ['균열', '면', '마감', '기타'][i % 4],
        total_workers: 10 + i,
        npc1000_incoming: 100 + i * 10,
        npc1000_used: 50 + i * 5,
        npc1000_remaining: 50 + i * 5,
        issues: `작업 내용 ${i + 1}: 콘크리트 타설 및 철근 배근 작업 - ${i === 0 ? '진행 중' : '완료'}`,
        status: i === 0 ? 'draft' : 'submitted',
        created_by: managerProfile.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    console.log('📝 Attempting to insert', reports.length, 'reports...')
    
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
        member_name,
        process_type,
        issues,
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
        console.log(`  - ${report.work_date}: ${report.member_name}/${report.process_type} - ${report.issues?.substring(0, 30) || 'No issues'}... (${report.status})`)
        console.log(`    Site: ${report.sites?.name}, Created by: ${report.profiles?.full_name}`)
      })
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

insertSampleDailyReports()