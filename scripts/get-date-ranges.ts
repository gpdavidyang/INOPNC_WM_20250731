#!/usr/bin/env tsx
/**
 * Script to get date ranges for attendance records and work logs
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getDateRanges() {
  console.log('📅 출근 기록 및 작업일지 날짜 범위 조회\n')
  console.log('=' + '='.repeat(60))
  
  try {
    // 출근 기록 날짜 범위 및 월별 분포
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id, work_date, status')
      .order('work_date')
    
    if (attendanceError) throw attendanceError
    
    console.log('\n📅 출근 기록 날짜 분석:')
    console.log(`   전체 출근 기록: ${attendance?.length || 0}건`)
    
    if (attendance && attendance.length > 0) {
      const dates = attendance.map(a => a.work_date).filter(Boolean)
      const earliestDate = dates[0]
      const latestDate = dates[dates.length - 1]
      
      console.log(`   가장 이른 기록: ${earliestDate}`)
      console.log(`   가장 늦은 기록: ${latestDate}`)
      
      // 월별 분포
      const monthlyCount: Record<string, number> = {}
      dates.forEach(date => {
        const monthKey = date.substring(0, 7) // YYYY-MM 형식
        monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1
      })
      
      console.log(`\n   월별 분포:`)
      Object.entries(monthlyCount)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([month, count]) => {
          const [year, monthNum] = month.split('-')
          const monthName = `${year}년 ${parseInt(monthNum)}월`
          console.log(`   - ${monthName}: ${count}건`)
        })
      
      // 가장 많은 데이터가 있는 월
      const mostActiveMonth = Object.entries(monthlyCount)
        .sort(([,a], [,b]) => b - a)[0]
      
      if (mostActiveMonth) {
        const [month, count] = mostActiveMonth
        const [year, monthNum] = month.split('-')
        console.log(`\n   📈 출근 기록이 가장 많은 달: ${year}년 ${parseInt(monthNum)}월 (${count}건)`)
      }
    }
    
    // 작업일지 날짜 범위 및 월별 분포
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('id, work_date, status, created_at')
      .order('work_date')
    
    if (reportsError) throw reportsError
    
    console.log('\n📝 작업일지 날짜 분석:')
    console.log(`   전체 작업일지: ${reports?.length || 0}건`)
    
    if (reports && reports.length > 0) {
      const workDates = reports.map(r => r.work_date).filter(Boolean)
      const earliestWorkDate = workDates[0]
      const latestWorkDate = workDates[workDates.length - 1]
      
      console.log(`   가장 이른 작업일지: ${earliestWorkDate}`)
      console.log(`   가장 늦은 작업일지: ${latestWorkDate}`)
      
      // 월별 분포
      const monthlyWorkCount: Record<string, number> = {}
      workDates.forEach(date => {
        const monthKey = date.substring(0, 7) // YYYY-MM 형식
        monthlyWorkCount[monthKey] = (monthlyWorkCount[monthKey] || 0) + 1
      })
      
      console.log(`\n   월별 분포:`)
      Object.entries(monthlyWorkCount)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([month, count]) => {
          const [year, monthNum] = month.split('-')
          const monthName = `${year}년 ${parseInt(monthNum)}월`
          console.log(`   - ${monthName}: ${count}건`)
        })
      
      // 가장 많은 데이터가 있는 월
      const mostActiveWorkMonth = Object.entries(monthlyWorkCount)
        .sort(([,a], [,b]) => b - a)[0]
      
      if (mostActiveWorkMonth) {
        const [month, count] = mostActiveWorkMonth
        const [year, monthNum] = month.split('-')
        console.log(`\n   📈 작업일지가 가장 많은 달: ${year}년 ${parseInt(monthNum)}월 (${count}건)`)
      }
      
      // 상태별 분포
      const statusStats: Record<string, number> = {}
      reports.forEach(r => {
        statusStats[r.status] = (statusStats[r.status] || 0) + 1
      })
      
      console.log(`\n   상태별 분포:`)
      Object.entries(statusStats).forEach(([status, count]) => {
        const statusName = {
          'draft': '임시저장',
          'submitted': '제출완료',
          'approved': '승인완료'
        }[status] || status
        console.log(`   - ${statusName}: ${count}건 (${Math.round(count / reports.length * 100)}%)`)
      })
    }
    
    // 통합 추천 사항
    console.log('\n💡 조회 추천사항:')
    
    if (attendance && attendance.length > 0) {
      const attendanceDates = attendance.map(a => a.work_date).filter(Boolean)
      const attendanceMonths = [...new Set(attendanceDates.map(date => date.substring(0, 7)))]
        .sort()
      
      if (attendanceMonths.length > 0) {
        const latestMonth = attendanceMonths[attendanceMonths.length - 1]
        const [year, month] = latestMonth.split('-')
        console.log(`   📅 출근현황 조회: ${year}년 ${parseInt(month)}월을 중심으로 조회하세요`)
      }
    }
    
    if (reports && reports.length > 0) {
      const workDates = reports.map(r => r.work_date).filter(Boolean)
      const workMonths = [...new Set(workDates.map(date => date.substring(0, 7)))]
        .sort()
      
      if (workMonths.length > 0) {
        const latestWorkMonth = workMonths[workMonths.length - 1]
        const [year, month] = latestWorkMonth.split('-')
        console.log(`   📝 작업일지 조회: ${year}년 ${parseInt(month)}월을 중심으로 조회하세요`)
      }
    }
    
    // 전체 데이터 요약 정보
    if (attendance && reports) {
      const allDates = [
        ...attendance.map(a => a.work_date),
        ...reports.map(r => r.work_date)
      ].filter(Boolean).sort()
      
      if (allDates.length > 0) {
        const earliestOverall = allDates[0]
        const latestOverall = allDates[allDates.length - 1]
        const [earliestYear, earliestMonth] = earliestOverall.split('-')
        const [latestYear, latestMonth] = latestOverall.split('-')
        
        console.log(`\n📊 전체 데이터 기간:`)
        console.log(`   시작: ${earliestYear}년 ${parseInt(earliestMonth)}월`)
        console.log(`   종료: ${latestYear}년 ${parseInt(latestMonth)}월`)
        console.log(`   👉 주로 ${latestYear}년 ${parseInt(latestMonth)}월 데이터를 조회하시면 됩니다!`)
      }
    }
    
    console.log('\n' + '=' + '='.repeat(60))
    console.log('✅ 날짜 범위 조회 완료')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  }
}

// 실행
getDateRanges().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})