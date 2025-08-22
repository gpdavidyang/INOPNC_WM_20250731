'use client'

import { ElevatedCard, getContainerClasses, getSectionClasses } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function TestAttendancePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testAttendance() {
      try {
        const supabase = createClient()
        
        // 로그인
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: 'manager@inopnc.com',
          password: 'password123'
        })
        
        if (authError) {
          setError(authError)
          setLoading(false)
          return
        }
        
        console.log('✅ Logged in:', authData.user?.email)
        
        // 출근 데이터 조회
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance_records')
          .select(`
            *,
            sites(id, name)
          `)
          .eq('user_id', authData.user?.id)
          .gte('work_date', '2025-08-01')
          .lte('work_date', '2025-08-31')
          .order('work_date', { ascending: true })
        
        if (attendanceError) {
          setError(attendanceError)
        } else {
          setData(attendance)
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    testAttendance()
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className={getContainerClasses()}>
        <div className="py-6">
          <div className={getSectionClasses()}>
            <ElevatedCard className="p-8">
              <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>Attendance Test Page</h1>
              
              {loading && <p style={{ color: 'var(--muted)' }}>Loading...</p>}
              
              {error && (
                <div className="p-4 rounded mb-4" style={{ backgroundColor: 'var(--error-bg)' }}>
                  <h2 className="font-bold mb-2" style={{ color: 'var(--error-text)' }}>Error:</h2>
                  <pre className="text-sm" style={{ color: 'var(--error-text)' }}>{JSON.stringify(error, null, 2)}</pre>
                </div>
              )}
              
              {data && (
                <div className="p-4 rounded mb-4" style={{ backgroundColor: 'var(--success-bg)' }}>
                  <h2 className="font-bold mb-2" style={{ color: 'var(--success-text)' }}>Found {data.length} records:</h2>
                  <pre className="text-sm" style={{ color: 'var(--success-text)' }}>{JSON.stringify(data, null, 2)}</pre>
                </div>
              )}
              
              <div className="mt-4">
                <p style={{ color: 'var(--muted)' }}>Check browser console for detailed logs</p>
              </div>
            </ElevatedCard>
          </div>
        </div>
      </div>
    </div>
  )
}