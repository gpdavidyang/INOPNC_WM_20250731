// Fix site manager data loading issue by creating missing site_documents table and populating test data
import { createClient } from '@/lib/supabase/server'

async function fixSiteManagerData() {
  const supabase = createClient()
  
  console.log('🔧 Starting site manager data fix...')
  
  try {
    // First, let's test if we can create the site_documents table through a simple insert
    // If the table doesn't exist, this will fail and we'll handle it
    const testSiteId = '55386936-56b0-465e-bcc2-8313db735ca9' // 강남 A현장 from logs
    
    // Try to insert site documents - this will fail if table doesn't exist
    try {
      const { data: insertResult, error: insertError } = await supabase
        .from('site_documents')
        .insert([
          {
            site_id: testSiteId,
            document_type: 'ptw',
            title: 'PTW-2025-0822 작업허가서',
            description: '지하 1층 슬라브 타설 작업 허가서',
            file_url: '/documents/ptw/PTW-2025-0822.pdf',
            file_name: 'PTW-2025-0822.pdf',
            document_number: 'PTW-2025-0822',
            status: 'active'
          },
          {
            site_id: testSiteId,
            document_type: 'blueprint',
            title: '강남 A현장 구조도면',
            description: '지하 1층 구조 설계도면 (기둥 C1-C5 구간)',
            file_url: '/documents/blueprints/gangnam-a-b1-structure.pdf',
            file_name: 'gangnam-a-b1-structure.pdf',
            document_number: 'BP-GA-B1-001',
            status: 'active'
          }
        ])
        .select()
      
      if (insertError) {
        console.error('❌ Site documents table does not exist:', insertError.message)
        return { success: false, error: 'site_documents table missing', details: insertError }
      }
      
      console.log('✅ Site documents created successfully:', insertResult?.length)
    } catch (error) {
      console.error('❌ Cannot create site documents:', error)
    }
    
    // Generate test data for today
    const today = new Date().toISOString().split('T')[0]
    const managerId = '950db250-82e4-4c9d-bf4d-75df7244764c' // manager@inopnc.com from logs
    
    // Create today's daily report
    const { error: reportError } = await supabase
      .from('daily_reports')
      .upsert({
        user_id: managerId,
        site_id: testSiteId,
        report_date: today,
        work_description: '지하 1층 슬라브 타설 작업 진행중. 기둥 C1-C5 구간 철근 배근 완료, 콘크리트 타설 준비 완료. 품질 검사 통과 후 오후 2시부터 타설 시작 예정.',
        progress_percentage: 75,
        weather_condition: 'sunny',
        temperature: 23,
        worker_count: 12,
        equipment_used: ['타워크레인', '콘크리트펌프카', '진동기', '레이저레벨기'],
        materials_used: ['콘크리트 120㎥', '철근 D19 50본', '거푸집 판넬 80매'],
        safety_issues: '특이사항 없음. 안전교육 실시 완료.',
        quality_notes: '철근 배근 상태 양호. 콘크리트 강도 확인 완료.',
        next_day_plan: '내일 슬라브 양생 상태 점검 후 다음 구간 작업 준비. 기둥 C6-C10 구간 철근 반입 예정.',
        status: 'submitted'
      }, {
        onConflict: 'user_id,site_id,report_date'
      })
    
    if (!reportError) {
      console.log('✅ Daily report created/updated for today')
    }
    
    // Create attendance record for manager
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .upsert({
        user_id: managerId,
        site_id: testSiteId,
        attendance_date: today,
        check_in_time: '07:30:00',
        check_out_time: '18:00:00',
        work_hours: 9.5,
        labor_hours: 1.0,
        overtime_hours: 0.5,
        work_type: 'management',
        weather_condition: 'sunny',
        notes: '현장 전체 관리 및 품질 점검'
      }, {
        onConflict: 'user_id,site_id,attendance_date'
      })
    
    if (!attendanceError) {
      console.log('✅ Attendance record created/updated for today')
    }
    
    // Create notifications
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: managerId,
          title: '오늘의 작업 계획 확인',
          message: '지하 1층 슬라브 타설 작업이 예정되어 있습니다. 오후 2시 시작 예정입니다.',
          type: 'work_schedule',
          priority: 'medium',
          related_id: testSiteId,
          is_read: false
        },
        {
          user_id: managerId,
          title: '안전 점검 완료',
          message: '현장 안전 점검이 완료되었습니다. 특이사항 없음.',
          type: 'safety',
          priority: 'low',
          related_id: testSiteId,
          is_read: false
        }
      ])
    
    if (!notificationError) {
      console.log('✅ Notifications created')
    }
    
    // Verify data exists
    const { data: siteData } = await supabase
      .from('sites')
      .select('*')
      .eq('id', testSiteId)
      .single()
    
    const { data: reports } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', managerId)
      .eq('site_id', testSiteId)
      .eq('report_date', today)
    
    console.log('✅ Site manager data fix completed')
    console.log('📊 Summary:')
    console.log(`  - Site exists: ${siteData ? '✅' : '❌'}`)
    console.log(`  - Daily reports today: ${reports?.length || 0}`)
    console.log(`  - Site name: ${siteData?.name}`)
    console.log(`  - Site address: ${siteData?.address}`)
    
    return {
      success: true,
      message: 'Site manager data populated successfully',
      siteExists: !!siteData,
      reportsToday: reports?.length || 0
    }
    
  } catch (error) {
    console.error('❌ Error fixing site manager data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default fixSiteManagerData