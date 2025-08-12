'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugEnvPage() {
  const [envCheck, setEnvCheck] = useState<any>({})
  const [connectionTest, setConnectionTest] = useState<any>({})
  
  useEffect(() => {
    // Check environment variables
    const envData = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
      nodeEnv: process.env.NODE_ENV
    }
    setEnvCheck(envData)

    // Test Supabase connection
    const testConnection = async () => {
      try {
        const supabase = createClient()
        
        // Simple connection test
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .single()
        
        if (error) {
          setConnectionTest({
            status: 'error',
            error: error.message,
            code: error.code,
            details: error.details
          })
        } else {
          setConnectionTest({
            status: 'success',
            message: 'Supabase connection successful'
          })
        }
      } catch (err: any) {
        setConnectionTest({
          status: 'catch_error',
          error: err.message,
          stack: err.stack
        })
      }
    }
    
    testConnection()
  }, [])

  const testLogin = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'manager@inopnc.com',
        password: 'password123'
      })
      
      if (error) {
        setConnectionTest(prev => ({
          ...prev,
          loginTest: {
            status: 'error',
            error: error.message,
            code: error.code
          }
        }))
      } else {
        setConnectionTest(prev => ({
          ...prev,
          loginTest: {
            status: 'success',
            user: data.user?.email
          }
        }))
      }
    } catch (err: any) {
      setConnectionTest(prev => ({
        ...prev,
        loginTest: {
          status: 'catch_error',
          error: err.message
        }
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">환경 변수 및 연결 테스트</h1>
        
        {/* Environment Variables */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">환경 변수</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(envCheck, null, 2)}
          </pre>
        </div>

        {/* Connection Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">연결 테스트</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(connectionTest, null, 2)}
          </pre>
        </div>

        {/* Login Test Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">로그인 테스트</h2>
          <button
            onClick={testLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            테스트 로그인 실행
          </button>
          {connectionTest.loginTest && (
            <div className="mt-4">
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(connectionTest.loginTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-blue-600 hover:text-blue-800">
            로그인 페이지로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}