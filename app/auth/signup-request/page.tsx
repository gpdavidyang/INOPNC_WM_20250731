'use client'

import { requestSignupApproval } from '@/app/auth/actions'
import {
    ElevatedCard,
    EmailInput,
    INOPNCInput,
    PrimaryButton,
    ProminentCard,
    TelInput
} from '@/components/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupRequestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    jobTitle: '',
    phone: '',
    email: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted) {
      setError('이용약관 및 개인정보처리방침에 동의해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await requestSignupApproval(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSubmitted(true)
      }
    } catch (error: any) {
      console.error('Signup request error:', error)
      setError('승인 요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-full max-w-md">
          {/* 로고 및 타이틀 */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--primary)' }}>
              <span className="text-white text-2xl font-bold">IN</span>
            </div>
            <h1 className="title-xl" style={{ color: 'var(--text)' }}>INOPNC</h1>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>회원가입</p>
          </div>

          {/* 승인 완료 메시지 */}
          <ElevatedCard className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success-bg)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="title-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>승인요청 완료</h2>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>
              회원가입 승인요청이 성공적으로 제출되었습니다.<br/>
              관리자 승인 후 이메일로 안내드리겠습니다.
            </p>
            <Link href="/auth/login">
              <PrimaryButton size="field">
                로그인 화면으로
              </PrimaryButton>
            </Link>
          </ElevatedCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--primary)' }}>
            <span className="text-white text-2xl font-bold">IN</span>
          </div>
          <h1 className="title-xl" style={{ color: 'var(--text)' }}>INOPNC</h1>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>회원가입</p>
        </div>

        {/* 회원가입 승인요청 폼 */}
        <ProminentCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <INOPNCInput
              label="이름"
              type="text"
              placeholder="이름을 입력하세요"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
              fullWidth
            />

            {/* 소속(회사명) */}
            <INOPNCInput
              label="소속(회사명)"
              type="text"
              placeholder="회사명을 입력하세요"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              required
              fullWidth
            />

            {/* 직함 */}
            <INOPNCInput
              label="직함"
              type="text"
              placeholder="직함을 입력하세요"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              required
              fullWidth
            />

            {/* 핸드폰 번호 */}
            <TelInput
              label="핸드폰 번호"
              placeholder="010-0000-0000"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
              fullWidth
            />

            {/* 이메일 */}
            <EmailInput
              label="이메일"
              placeholder="example@company.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              fullWidth
            />

            {/* 이용약관 동의 */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                style={{
                  color: 'var(--primary)',
                  borderColor: 'var(--input-border)',
                  backgroundColor: 'var(--input-bg)'
                }}
              />
              <label htmlFor="terms" className="text-r12" style={{ color: 'var(--text)' }}>
                이용약관 및 개인정보처리방침에 동의합니다
              </label>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-md text-sm" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>
                {error}
              </div>
            )}

            {/* 승인요청 버튼 */}
            <PrimaryButton
              type="submit"
              disabled={loading || !termsAccepted}
              size="field"
              fullWidth
              loading={loading}
            >
              {loading ? '승인요청 중...' : '승인요청'}
            </PrimaryButton>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <span className="text-r12" style={{ color: 'var(--muted)' }}>이미 계정이 있으신가요? </span>
            <Link href="/auth/login" className="text-r12 font-medium transition-colors" style={{ color: 'var(--primary)' }}>
              로그인
            </Link>
          </div>
        </ProminentCard>
      </div>
    </div>
  )
}