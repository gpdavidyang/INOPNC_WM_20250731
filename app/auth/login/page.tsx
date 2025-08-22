'use client'

import { signIn } from '@/app/auth/actions'
import {
    PrimaryButton,
    ProminentCard
} from '@/components/ui'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const message = searchParams.get('message')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    message === 'password-updated' ? '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.' : null
  )
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleLogin = async (formData: FormData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    setError(null)
    
    startTransition(async () => {
      try {
        const result = await signIn(email, password)
        if (result?.error) {
          setError(result.error === 'Invalid login credentials' 
            ? '이메일 또는 비밀번호가 올바르지 않습니다.' 
            : result.error)
        } else if (result?.success) {
          // Use window.location for a full page refresh to ensure auth state is updated
          window.location.href = redirectTo
        }
      } catch (error) {
        console.error('Login error:', error)
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(59,130,246,0.02)_50%,transparent_51%)] bg-[length:20px_20px]" />
      
      <div className="w-full max-w-md relative z-10">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 mb-6 sm:mb-8 flex items-center justify-center rounded-[2rem] shadow-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <Image
              src="/INOPNC_logo.png"
              alt="INOPNC 로고"
              width={56}
              height={56}
              className="object-contain sm:w-[64px] sm:h-[64px] drop-shadow-sm"
            />
          </div>
        </div>

        {/* 로그인 폼 */}
        <ProminentCard className="p-8 sm:p-12">
          <h2 className="title-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center tracking-tight" style={{ color: 'var(--text)' }}>
            로그인
          </h2>
          
          <form action={handleLogin} className="space-y-3 sm:space-y-6">
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-r12 font-medium" style={{ color: 'var(--text)' }}>
                이메일
              </label>
              <input
                name="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input h-14 px-4 text-base font-medium placeholder-gray-500 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text)'
                }}
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="block text-r12 font-medium" style={{ color: 'var(--text)' }}>
                비밀번호
              </label>
              <div className="relative group">
                {/* Password Lock Icon */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                {/* Password Input Field */}
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  defaultValue={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input h-14 pl-12 pr-14 text-base font-medium placeholder-gray-500 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text)',
                    paddingLeft: '3rem',
                    paddingRight: '3.5rem'
                  }}
                  placeholder="비밀번호를 입력하세요"
                />

                {/* Password Visibility Toggle Button */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="relative group/btn p-2.5 rounded-xl focus:outline-none focus:ring-1 transition-all duration-300 active:scale-95"
                    style={{
                      color: 'var(--muted)',
                      backgroundColor: 'var(--input-bg)'
                    }}
                    tabIndex={-1}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {/* Icon with smooth transition */}
                    <div className="w-5 h-5 relative">
                      {showPassword ? (
                        <svg className="w-5 h-5 absolute inset-0 transition-all duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 absolute inset-0 transition-all duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {successMessage && (
              <div className="px-5 sm:px-6 py-4 sm:py-5 rounded-2xl text-sm sm:text-base flex items-center space-x-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 duration-300" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success-text)' }}>
                <svg className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="px-5 sm:px-6 py-4 sm:py-5 rounded-2xl text-sm sm:text-base flex items-center space-x-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 duration-300" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>
                <svg className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" style={{ color: 'var(--error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <PrimaryButton
              type="submit"
              disabled={isPending}
              size="field"
              fullWidth
              loading={isPending}
            >
              {isPending ? '로그인 중...' : '로그인'}
            </PrimaryButton>
          </form>

          <div className="mt-4 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--card-border)' }} />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--muted)' }}>또는</span>
              </div>
            </div>

            <div className="mt-3 sm:mt-6 space-y-1.5 sm:space-y-3 text-center">
              <Link 
                href="/auth/signup-request" 
                className="block text-sm font-medium transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                계정이 없으신가요? 회원가입 승인요청
              </Link>
              <Link 
                href="/auth/reset-password" 
                className="block text-sm transition-colors"
                style={{ color: 'var(--muted)' }}
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>

        </ProminentCard>
      </div>
    </div>
  )
}