'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSalaryInfo(params: {
  worker_id: string
  site_id?: string
  month?: string
}) {
  try {
    const supabase = createClient()
    
    // For now, return mock data since salary tables don't exist yet
    // In a real implementation, this would query salary calculation tables
    
    const mockData = []
    
    if (params.month) {
      // Return data for specific month across all sites
      mockData.push({
        month: params.month,
        site_id: 'mock-site-1',
        site_name: '강남 A현장',
        base_salary: 2800000,
        overtime_pay: 420000,
        allowances: 150000,
        deductions: 337000,
        net_salary: 3033000,
        total_days: 22,
        total_hours: 176,
        overtime_hours: 20,
        status: 'paid'
      })
    } else if (params.site_id) {
      // Return data for specific site across months
      const months = ['2024-11', '2024-12', '2025-01']
      months.forEach(month => {
        mockData.push({
          month,
          site_id: params.site_id,
          site_name: '강남 A현장',
          base_salary: 2800000,
          overtime_pay: Math.floor(Math.random() * 500000),
          allowances: 150000,
          deductions: 337000,
          net_salary: 2800000 + Math.floor(Math.random() * 500000) + 150000 - 337000,
          total_days: 20 + Math.floor(Math.random() * 5),
          total_hours: 160 + Math.floor(Math.random() * 40),
          overtime_hours: Math.floor(Math.random() * 30),
          status: month === '2025-01' ? 'pending' : 'paid'
        })
      })
    }

    return { success: true, data: mockData }
  } catch (error) {
    console.error('Error in getSalaryInfo:', error)
    return { success: false, error: 'Failed to fetch salary info' }
  }
}

export async function getCompanySalarySummary(params: {
  organization_id: string
  site_id?: string
  month?: string
}) {
  try {
    const supabase = createClient()
    
    // Mock data for partner company view
    const mockWorkers = [
      { name: '김철수', id: 'worker1' },
      { name: '이영희', id: 'worker2' },
      { name: '박민수', id: 'worker3' },
      { name: '정수진', id: 'worker4' },
      { name: '최동훈', id: 'worker5' }
    ]
    
    const details = mockWorkers.map(worker => ({
      worker_id: worker.id,
      worker_name: worker.name,
      site_id: params.site_id || 'site1',
      site_name: '강남 A현장',
      month: params.month || '2025-01',
      base_salary: 2800000 + Math.floor(Math.random() * 500000),
      overtime_pay: Math.floor(Math.random() * 500000),
      allowances: 150000,
      deductions: 337000,
      net_salary: 2800000 + Math.floor(Math.random() * 1000000),
      total_days: 20 + Math.floor(Math.random() * 5),
      total_hours: 160 + Math.floor(Math.random() * 40),
      overtime_hours: Math.floor(Math.random() * 30),
      status: Math.random() > 0.7 ? 'pending' : 'paid'
    }))
    
    const totalAmount = details.reduce((sum, d) => sum + d.net_salary, 0)
    const pendingAmount = details
      .filter(d => d.status === 'pending')
      .reduce((sum, d) => sum + d.net_salary, 0)
    const paidAmount = details
      .filter(d => d.status === 'paid')
      .reduce((sum, d) => sum + d.net_salary, 0)

    return { 
      success: true, 
      data: {
        details,
        totalWorkers: mockWorkers.length,
        totalAmount,
        pendingAmount,
        paidAmount
      }
    }
  } catch (error) {
    console.error('Error in getCompanySalarySummary:', error)
    return { success: false, error: 'Failed to fetch company salary summary' }
  }
}

export async function getPayslips(params: {
  worker_id: string
  limit?: number
}) {
  try {
    const supabase = createClient()
    
    // Mock payslip data
    const months = [
      '2024-08', '2024-09', '2024-10', 
      '2024-11', '2024-12', '2025-01'
    ]
    
    const mockPayslips = months.slice(0, params.limit || 6).map(month => ({
      id: `payslip-${month}`,
      worker_id: params.worker_id,
      month,
      site_id: 'site1',
      site_name: '강남 A현장',
      gross_amount: 3370000,
      deductions: 337000,
      net_amount: 3033000,
      status: month === '2025-01' ? 'pending' : 'paid',
      issued_date: `${month}-25`,
      payment_date: month !== '2025-01' ? `${month}-25` : null
    }))

    return { success: true, data: mockPayslips }
  } catch (error) {
    console.error('Error in getPayslips:', error)
    return { success: false, error: 'Failed to fetch payslips' }
  }
}

export async function downloadPayslip(payslipId: string) {
  try {
    // In a real implementation, this would generate or fetch a PDF
    // For now, return a mock URL
    return { 
      success: true, 
      data: {
        url: `/api/payslips/${payslipId}/download`,
        filename: `payslip-${payslipId}.pdf`
      }
    }
  } catch (error) {
    console.error('Error in downloadPayslip:', error)
    return { success: false, error: 'Failed to download payslip' }
  }
}