'use client'

import { useState, useTransition } from 'react'
import { signIn } from '@/app/auth/actions'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleLogin = async (formData: FormData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    startTransition(async () => {
      const result = await signIn(email, password)
      if (result?.error) {
        setError(result.error === 'Invalid login credentials' 
          ? '이메일 또는 비밀번호가 올바르지 않습니다.' 
          : result.error)
      } else if (result?.success) {
        // Use window.location for a full page refresh to ensure auth state is updated
        window.location.href = redirectTo
      }
    })
  }

  const handleSeedData = async () => {
    setSeedLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/seed')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '데모 데이터 생성 실패')
      }
      
      alert('데모 데이터가 생성되었습니다. 아래 계정으로 로그인하세요.')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSeedLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">IN</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">INOPNC</h1>
          <p className="text-gray-600 mt-2">건설 작업일지 관리 시스템</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">로그인</h2>
          
          <form action={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  defaultValue={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-center">
              <Link href="/auth/signup" className="block text-sm text-blue-600 hover:text-blue-500">
                계정이 없으신가요? 회원가입
              </Link>
              <Link href="/auth/reset-password" className="block text-sm text-gray-600 hover:text-gray-800">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>

          {/* 데모 계정 정보 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-600">데모 계정:</p>
              <button
                type="button"
                onClick={handleSeedData}
                disabled={seedLoading}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                {seedLoading ? '생성 중...' : '데모 데이터 생성'}
              </button>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <p>작업자: worker@inopnc.com / password123</p>
              <p>현장관리자: manager@inopnc.com / password123</p>
              <p>파트너사: customer@partner.com / password123</p>
              <p>관리자: admin@inopnc.com / password123</p>
              <p>시스템관리자: system@inopnc.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}