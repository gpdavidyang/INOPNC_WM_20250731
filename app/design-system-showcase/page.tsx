'use client'

import {
    ChipA,
    ChipB,
    ChipD,
    ElevatedCard,
    INOPNCInput,
    MainButton,
    MutedButton,
    PrimaryButton,
    SecondaryButton
} from '@/components/ui'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useState } from 'react'

export default function DesignSystemShowcasePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [activeTab, setActiveTab] = useState('components')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header className="header" id="hdr">
        <button className="btn-icon" aria-label="뒤로">⟵</button>
        <h1 className="title">INOPNC 디자인 시스템</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <label className="switch" aria-label="다크모드 토글">
            <input 
              type="checkbox" 
              checked={theme === 'dark'} 
              onChange={toggleTheme} 
            />
            <span className="slider"><span className="knob"></span></span>
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="app">
        <div className="section">
          
          {/* Navigation Tabs */}
          <div className="card">
            <nav className="tabs" role="tablist">
              <button 
                className={`tab ${activeTab === 'components' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('components')}
              >
                컴포넌트
              </button>
              <button 
                className={`tab ${activeTab === 'pages' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('pages')}
              >
                페이지 미리보기
              </button>
              <button 
                className={`tab ${activeTab === 'tokens' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('tokens')}
              >
                디자인 토큰
              </button>
            </nav>
          </div>

          {/* Components Tab */}
          {activeTab === 'components' && (
            <div className="space-y-6">
              
              {/* Typography */}
              <div className="card">
                <h2 className="title-xl mb-4">Typography</h2>
                <div className="space-y-3">
                  <h1 className="title-xl">Title XL - 20px/700</h1>
                  <h2 className="title-lg">Title LG - 18px/500</h2>
                  <p className="text-m18">Text M18 - 18px/500</p>
                  <p className="text-m15">Text M15 - 15px/500</p>
                  <p className="text-r12">Text R12 - 12px/400</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="card">
                <h2 className="title-xl mb-4">Buttons</h2>
                <div className="space-y-4">
                  <div className="flex gap-3 flex-wrap">
                    <PrimaryButton>Primary Button</PrimaryButton>
                    <SecondaryButton>Secondary Button</SecondaryButton>
                    <MainButton>Main Button</MainButton>
                    <MutedButton>Muted Button</MutedButton>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <PrimaryButton size="compact">Compact</PrimaryButton>
                    <SecondaryButton size="compact">Compact</SecondaryButton>
                    <MainButton size="compact">Compact</MainButton>
                    <MutedButton size="compact">Compact</MutedButton>
                  </div>
                </div>
              </div>

              {/* Chips */}
              <div className="card">
                <h2 className="title-xl mb-4">Chips</h2>
                <div className="flex gap-3 flex-wrap">
                  <ChipA>Chip A - 검토중</ChipA>
                  <ChipB>Chip B - 완료</ChipB>
                  <ChipD>Chip D - 승인</ChipD>
                </div>
              </div>

              {/* Inputs */}
              <div className="card">
                <h2 className="title-xl mb-4">Inputs</h2>
                <div className="space-y-4">
                  <INOPNCInput
                    label="기본 입력"
                    placeholder="텍스트를 입력하세요"
                    fullWidth
                  />
                  <div className="select-wrap">
                    <select className="select">
                      <option>옵션 1</option>
                      <option>옵션 2</option>
                      <option>옵션 3</option>
                    </select>
                  </div>
                  <textarea 
                    className="textarea" 
                    placeholder="여러 줄 텍스트를 입력하세요"
                    rows={3}
                  />
                </div>
              </div>

              {/* Cards */}
              <div className="card">
                <h2 className="title-xl mb-4">Cards</h2>
                <div className="space-y-4">
                  <ElevatedCard>
                    <h3 className="title-lg mb-2">Elevated Card</h3>
                    <p>일반적인 카드 컴포넌트입니다.</p>
                  </ElevatedCard>
                  <div className="card card--emphasis">
                    <h3 className="title-lg mb-2">Emphasis Card</h3>
                    <p>강조된 카드 컴포넌트입니다.</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h2 className="title-xl mb-4">Quick Actions</h2>
                <div className="flex gap-3 flex-wrap">
                  <button className="tile-outline tile-green">출력일보</button>
                  <button className="tile-outline tile-orange">나의 문서함</button>
                  <button className="tile-outline tile-purple">현장조회</button>
                  <button className="tile-outline tile-blue">현장 공도면</button>
                </div>
              </div>

              {/* Upload Button */}
              <div className="card">
                <h2 className="title-xl mb-4">Upload Button</h2>
                <button className="btn btn--plus-outline btn--w343 btn--upload">
                  업로드
                </button>
              </div>

              {/* Table */}
              <div className="card">
                <h2 className="title-xl mb-4">Table</h2>
                <table>
                  <thead>
                    <tr>
                      <th>일자</th>
                      <th>현장</th>
                      <th>작업자</th>
                      <th>공수</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2025-08-22</td>
                      <td>방배</td>
                      <td>홍길동</td>
                      <td>2</td>
                    </tr>
                    <tr>
                      <td>2025-08-22</td>
                      <td>대치</td>
                      <td>김철수</td>
                      <td>1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pages Preview Tab */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              
              {/* Dashboard Preview */}
              <div className="card">
                <h2 className="title-xl mb-4">대시보드 미리보기</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <ElevatedCard>
                      <div className="p-5">
                        <dt className="text-r12 font-medium" style={{ color: 'var(--muted)' }}>
                          전체 작업
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                          24
                        </dd>
                      </div>
                    </ElevatedCard>
                    <ElevatedCard>
                      <div className="p-5">
                        <dt className="text-r12 font-medium" style={{ color: 'var(--primary)' }}>
                          대기 중
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold" style={{ color: 'var(--primary)' }}>
                          8
                        </dd>
                      </div>
                    </ElevatedCard>
                    <ElevatedCard>
                      <div className="p-5">
                        <dt className="text-r12 font-medium" style={{ color: '#f59e0b' }}>
                          진행 중
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold" style={{ color: '#f59e0b' }}>
                          12
                        </dd>
                      </div>
                    </ElevatedCard>
                    <ElevatedCard>
                      <div className="p-5">
                        <dt className="text-r12 font-medium" style={{ color: '#10b981' }}>
                          완료됨
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold" style={{ color: '#10b981' }}>
                          4
                        </dd>
                      </div>
                    </ElevatedCard>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="title-lg mb-4">빠른 작업</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <PrimaryButton size="field">새 작업 만들기</PrimaryButton>
                      <SecondaryButton size="field">일일 보고서 작성</SecondaryButton>
                      <MainButton size="field">자재 관리</MainButton>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task List Preview */}
              <div className="card">
                <h2 className="title-xl mb-4">작업 목록 미리보기</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-r12 font-medium mb-2">상태</label>
                      <div className="select-wrap">
                        <select className="select">
                          <option>모든 상태</option>
                          <option>대기 중</option>
                          <option>진행 중</option>
                          <option>완료됨</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-r12 font-medium mb-2">프로젝트</label>
                      <div className="select-wrap">
                        <select className="select">
                          <option>모든 프로젝트</option>
                          <option>방배 프로젝트</option>
                          <option>대치 프로젝트</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-r12 font-medium mb-2">담당자</label>
                      <div className="select-wrap">
                        <select className="select">
                          <option>모든 담당자</option>
                          <option>홍길동</option>
                          <option>김철수</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <ElevatedCard className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="title-lg">방배 현장 기초공사</h3>
                          <ChipA>진행 중</ChipA>
                          <ChipB>높음</ChipB>
                        </div>
                        <p className="mb-3" style={{ color: 'var(--muted)' }}>
                          방배 현장의 기초공사 작업을 진행합니다.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">프로젝트:</span>
                            <span className="ml-2" style={{ color: 'var(--muted)' }}>방배</span>
                          </div>
                          <div>
                            <span className="font-medium">담당자:</span>
                            <span className="ml-2" style={{ color: 'var(--muted)' }}>홍길동</span>
                          </div>
                          <div>
                            <span className="font-medium">마감일:</span>
                            <span className="ml-2" style={{ color: 'var(--muted)' }}>2025-09-15</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <SecondaryButton size="compact">보기</SecondaryButton>
                        <SecondaryButton size="compact">완료</SecondaryButton>
                      </div>
                    </div>
                  </ElevatedCard>
                </div>
              </div>

              {/* Auth Forms Preview */}
              <div className="card">
                <h2 className="title-xl mb-4">인증 폼 미리보기</h2>
                <div className="space-y-4">
                  <INOPNCInput
                    label="이메일"
                    type="email"
                    placeholder="email@example.com"
                    fullWidth
                  />
                  <div>
                    <label className="block text-r12 font-medium mb-2">비밀번호</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="비밀번호를 입력하세요"
                    />
                  </div>
                  <PrimaryButton size="field" fullWidth>
                    로그인
                  </PrimaryButton>
                </div>
              </div>
            </div>
          )}

          {/* Design Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              
              {/* Color Tokens */}
              <div className="card">
                <h2 className="title-xl mb-4">Color Tokens</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg" style={{ backgroundColor: 'var(--primary)' }}></div>
                    <p className="text-r12 font-medium">Primary</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>#0a84ff</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg" style={{ backgroundColor: 'var(--point)' }}></div>
                    <p className="text-r12 font-medium">Point</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>#0068FE</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg" style={{ backgroundColor: 'var(--btn-main)' }}></div>
                    <p className="text-r12 font-medium">Btn Main</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>#1A254F</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg" style={{ backgroundColor: 'var(--btn-muted)' }}></div>
                    <p className="text-r12 font-medium">Btn Muted</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>#99A4BE</p>
                  </div>
                </div>
              </div>

              {/* Quick Action Colors */}
              <div className="card">
                <h2 className="title-xl mb-4">Quick Action Colors</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg" style={{ backgroundColor: 'var(--c-green)' }}></div>
                    <p className="text-r12 font-medium">Green</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>#16A34A</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg" style={{ backgroundColor: 'var(--c-orange)' }}></div>
                    <p className="text-r12 font-medium">Orange</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>#EA580C</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg" style={{ backgroundColor: 'var(--c-purple)' }}></div>
                    <p className="text-r12 font-medium">Purple</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>#7C3AED</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg" style={{ backgroundColor: 'var(--c-blue)' }}></div>
                    <p className="text-r12 font-medium">Blue</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>#2563EB</p>
                  </div>
                </div>
              </div>

              {/* Spacing Tokens */}
              <div className="card">
                <h2 className="title-xl mb-4">Spacing Tokens</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: 'var(--space-2)' }}></div>
                    <span className="text-r12">--space-2: 8px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded" style={{ backgroundColor: 'var(--space-3)' }}></div>
                    <span className="text-r12">--space-3: 12px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded" style={{ backgroundColor: 'var(--space-4)' }}></div>
                    <span className="text-r12">--space-4: 16px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded" style={{ backgroundColor: 'var(--space-5)' }}></div>
                    <span className="text-r12">--space-5: 20px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded" style={{ backgroundColor: 'var(--space-6)' }}></div>
                    <span className="text-r12">--space-6: 24px</span>
                  </div>
                </div>
              </div>

              {/* Border Radius Tokens */}
              <div className="card">
                <h2 className="title-xl mb-4">Border Radius Tokens</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2" style={{ backgroundColor: 'var(--primary)', borderRadius: 'var(--r4)' }}></div>
                    <p className="text-r12 font-medium">--r4</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>4px</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2" style={{ backgroundColor: 'var(--primary)', borderRadius: 'var(--r6)' }}></div>
                    <p className="text-r12 font-medium">--r6</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>6px</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2" style={{ backgroundColor: 'var(--primary)', borderRadius: 'var(--r8)' }}></div>
                    <p className="text-r12 font-medium">--r8</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>8px</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2" style={{ backgroundColor: 'var(--primary)', borderRadius: 'var(--r12)' }}></div>
                    <p className="text-r12 font-medium">--r12</p>
                    <p className="text-r12" style={{ color: 'var(--muted)' }}>12px</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Theme toggle functionality
          const themeToggle = document.querySelector('input[type="checkbox"]');
          const html = document.documentElement;
          
          themeToggle.addEventListener('change', () => {
            const isDark = themeToggle.checked;
            html.setAttribute('data-theme', isDark ? 'dark' : '');
          });

          // Header scroll effect
          const header = document.getElementById('hdr');
          const onScroll = () => {
            if (window.scrollY > 2) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
          };
          document.addEventListener('scroll', onScroll, {passive: true});
          onScroll();
        `
      }} />
    </div>
  )
}
