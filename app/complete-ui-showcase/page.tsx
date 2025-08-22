'use client'

import { useState } from 'react'

export default function CompleteUIShowcasePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedSite, setSelectedSite] = useState('')
  const [worker, setWorker] = useState('')
  const [memo, setMemo] = useState('')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="header" id="hdr">
        <button className="btn-icon" aria-label="뒤로">⟵</button>
        <h1 className="title">INOPNC</h1>
        <label className="switch" aria-label="다크모드 토글">
          <input 
            id="themeCheckbox" 
            type="checkbox" 
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
          <span className="slider"><span className="knob"></span></span>
        </label>
      </header>

      {/* Main Content */}
      <main className="app">
        {/* Welcome Section */}
        <section className="section card card--emphasis">
          <h2 className="title-xl wrap">🎨 INOPNC 통합 UI 시스템</h2>
          <div className="stack">
            <p className="text-m15 wrap">
              새로운 디자인 시스템이 적용된 완전한 UI 페이지입니다. 
              실제 업무 환경과 동일한 레이아웃과 컴포넌트를 확인할 수 있습니다.
            </p>
            <p className="text-r12 text-muted">
              현재 테마: <strong>{theme === 'light' ? '라이트 모드' : '다크 모드'}</strong>
            </p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <section className="section card">
          <nav className="tabs" role="tablist">
            <button 
              className={`tab ${activeTab === 'dashboard' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              대시보드
            </button>
            <button 
              className={`tab ${activeTab === 'attendance' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              출근관리
            </button>
            <button 
              className={`tab ${activeTab === 'reports' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              일일보고
            </button>
            <button 
              className={`tab ${activeTab === 'equipment' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('equipment')}
            >
              장비관리
            </button>
          </nav>
        </section>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Quick Actions */}
            <section className="section card">
              <h2 className="title-xl wrap">Quick Actions</h2>
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                <button className="tile-outline tile-green">출력일보</button>
                <button className="tile-outline tile-orange">나의 문서함</button>
                <button className="tile-outline tile-purple">현장조회</button>
                <button className="tile-outline tile-blue">현장 공도면</button>
              </div>
            </section>

            {/* Statistics Cards */}
            <section className="section card">
              <h2 className="title-xl wrap">통계 현황</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="card card--emphasis">
                  <h3 className="title-lg">총 작업자</h3>
                  <p className="text-2xl font-bold">24명</p>
                </div>
                <div className="card card--emphasis">
                  <h3 className="title-lg">현재 현장</h3>
                  <p className="text-2xl font-bold">3개</p>
                </div>
              </div>
            </section>

            {/* Recent Activities */}
            <section className="section card">
              <h2 className="title-xl wrap">최근 활동</h2>
              <div className="stack">
                <div className="row">
                  <span className="tag tag--a">검토중</span>
                  <span className="text-m15">방배 현장 일일보고 제출</span>
                  <span className="text-r12 text-muted">2시간 전</span>
                </div>
                <div className="row">
                  <span className="tag tag--d">승인</span>
                  <span className="text-m15">대치 현장 장비 점검 완료</span>
                  <span className="text-r12 text-muted">5시간 전</span>
                </div>
                <div className="row">
                  <span className="tag tag--b">완료</span>
                  <span className="text-m15">서초 현장 안전교육 진행</span>
                  <span className="text-r12 text-muted">1일 전</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Attendance Tab Content */}
        {activeTab === 'attendance' && (
          <>
            {/* Attendance Form */}
            <section className="section card">
              <h2 className="title-xl wrap">출근 등록</h2>
              <div className="stack">
                <div>
                  <label className="text-m18 wrap" htmlFor="site-select">현장</label>
                  <div className="select-wrap">
                    <select 
                      id="site-select" 
                      className="select"
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                    >
                      <option value="">현장 선택</option>
                      <option value="bangbae">방배</option>
                      <option value="daechi">대치</option>
                      <option value="seocho">서초</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-m18 wrap" htmlFor="worker-input">작업자</label>
                  <input 
                    id="worker-input" 
                    className="input" 
                    placeholder="작업자명을 입력하세요"
                    value={worker}
                    onChange={(e) => setWorker(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-m18 wrap" htmlFor="memo-textarea">메모</label>
                  <textarea 
                    id="memo-textarea" 
                    className="textarea" 
                    placeholder="특이사항이나 메모를 입력하세요"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>

                <div className="btn-group">
                  <button className="btn btn--primary btn--w343">출근 등록</button>
                  <button className="btn btn--cancel">취소</button>
                </div>
              </div>
            </section>

            {/* Attendance Table */}
            <section className="section card">
              <h2 className="title-xl wrap">오늘 출근 현황</h2>
              <table>
                <thead>
                  <tr>
                    <th className="wrap">시간</th>
                    <th className="wrap">현장</th>
                    <th className="wrap">작업자</th>
                    <th className="wrap">상태</th>
                    <th className="wrap">작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="wrap">08:00</td>
                    <td className="wrap">방배</td>
                    <td className="wrap">홍길동</td>
                    <td className="wrap"><span className="tag tag--d">출근</span></td>
                    <td className="wrap">
                      <button className="btn btn--detail btn--w147">상세</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="wrap">08:15</td>
                    <td className="wrap">대치</td>
                    <td className="wrap">김철수</td>
                    <td className="wrap"><span className="tag tag--d">출근</span></td>
                    <td className="wrap">
                      <button className="btn btn--detail btn--w147">상세</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="wrap">08:30</td>
                    <td className="wrap">서초</td>
                    <td className="wrap">이영희</td>
                    <td className="wrap"><span className="tag tag--a">지각</span></td>
                    <td className="wrap">
                      <button className="btn btn--detail btn--w147">상세</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </>
        )}

        {/* Reports Tab Content */}
        {activeTab === 'reports' && (
          <>
            {/* Report Creation */}
            <section className="section card">
              <h2 className="title-xl wrap">일일보고 작성</h2>
              <div className="stack">
                <div>
                  <label className="text-m18 wrap" htmlFor="report-site">현장</label>
                  <div className="select-wrap">
                    <select id="report-site" className="select">
                      <option>현장 선택</option>
                      <option>방배</option>
                      <option>대치</option>
                      <option>서초</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-m18 wrap" htmlFor="report-date">작업일자</label>
                  <input 
                    id="report-date" 
                    type="date" 
                    className="input"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="text-m18 wrap" htmlFor="report-content">작업 내용</label>
                  <textarea 
                    id="report-content" 
                    className="textarea" 
                    placeholder="오늘 진행한 작업 내용을 상세히 작성하세요"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-m18 wrap" htmlFor="report-issues">특이사항</label>
                  <textarea 
                    id="report-issues" 
                    className="textarea" 
                    placeholder="발생한 문제나 특이사항을 기록하세요"
                    rows={3}
                  />
                </div>

                <div className="btn-group">
                  <button className="btn btn--primary btn--w343">보고서 저장</button>
                  <button className="btn btn--plus-outline btn--w343">+ 파일 첨부</button>
                </div>
              </div>
            </section>

            {/* Report List */}
            <section className="section card">
              <h2 className="title-xl wrap">보고서 목록</h2>
              <div className="stack">
                <div className="row">
                  <span className="tag tag--a">검토중</span>
                  <div>
                    <h3 className="title-lg">방배 현장 일일보고</h3>
                    <p className="text-m15 text-muted">2025-08-22 · 홍길동</p>
                  </div>
                  <button className="btn btn--detail btn--w147">상세보기</button>
                </div>
                <div className="row">
                  <span className="tag tag--d">승인</span>
                  <div>
                    <h3 className="title-lg">대치 현장 일일보고</h3>
                    <p className="text-m15 text-muted">2025-08-21 · 김철수</p>
                  </div>
                  <button className="btn btn--detail btn--w147">상세보기</button>
                </div>
                <div className="row">
                  <span className="tag tag--b">완료</span>
                  <div>
                    <h3 className="title-lg">서초 현장 일일보고</h3>
                    <p className="text-m15 text-muted">2025-08-20 · 이영희</p>
                  </div>
                  <button className="btn btn--detail btn--w147">상세보기</button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Equipment Tab Content */}
        {activeTab === 'equipment' && (
          <>
            {/* Equipment Status */}
            <section className="section card">
              <h2 className="title-xl wrap">장비 현황</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="title-lg">정상 작동</h3>
                  <p className="text-2xl font-bold text-green-600">18대</p>
                </div>
                <div className="card">
                  <h3 className="title-lg">점검 필요</h3>
                  <p className="text-2xl font-bold text-orange-600">3대</p>
                </div>
                <div className="card">
                  <h3 className="title-lg">수리 중</h3>
                  <p className="text-2xl font-bold text-red-600">1대</p>
                </div>
                <div className="card">
                  <h3 className="title-lg">총 장비</h3>
                  <p className="text-2xl font-bold">22대</p>
                </div>
              </div>
            </section>

            {/* Equipment Management */}
            <section className="section card">
              <h2 className="title-xl wrap">장비 관리</h2>
              <div className="stack">
                <div className="btn-group">
                  <button className="btn btn--plus-outline btn--w343">+ 새 장비 등록</button>
                  <button className="btn btn--upload btn--w343">장비 정보 업로드</button>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th className="wrap">장비명</th>
                      <th className="wrap">현장</th>
                      <th className="wrap">상태</th>
                      <th className="wrap">마지막 점검</th>
                      <th className="wrap">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="wrap">굴삭기 1호</td>
                      <td className="wrap">방배</td>
                      <td className="wrap"><span className="tag tag--d">정상</span></td>
                      <td className="wrap">2025-08-20</td>
                      <td className="wrap">
                        <button className="btn btn--detail btn--w147">상세</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="wrap">크레인 2호</td>
                      <td className="wrap">대치</td>
                      <td className="wrap"><span className="tag tag--a">점검필요</span></td>
                      <td className="wrap">2025-08-15</td>
                      <td className="wrap">
                        <button className="btn btn--detail btn--w147">상세</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="wrap">불도저 1호</td>
                      <td className="wrap">서초</td>
                      <td className="wrap"><span className="tag tag--e">수리중</span></td>
                      <td className="wrap">2025-08-10</td>
                      <td className="wrap">
                        <button className="btn btn--detail btn--w147">상세</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* System Information */}
        <section className="section card">
          <h2 className="title-xl wrap">시스템 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="title-lg mb-3">디자인 토큰</h3>
              <div className="stack">
                <div className="p-2 bg-gray-100 rounded">
                  <strong>Primary:</strong> #0a84ff
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>Point:</strong> #0068FE
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>Button Main:</strong> #1A254F
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>Button Muted:</strong> #99A4BE
                </div>
              </div>
            </div>
            <div>
              <h3 className="title-lg mb-3">컴포넌트 규칙</h3>
              <ul className="text-m15 space-y-1">
                <li>• 버튼 높이: 48px</li>
                <li>• 버튼 반지름: 8px</li>
                <li>• 입력 필드 높이: 48px</li>
                <li>• 카드 패딩: 20px</li>
                <li>• 간격 시스템: 8px, 12px, 16px, 20px, 24px</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Dark mode toggle + sticky header shadow on scroll
          const cb = document.getElementById('themeCheckbox');
          const html = document.documentElement;
          const hdr = document.getElementById('hdr');
          const sync = () => cb.checked = html.getAttribute('data-theme') === 'dark';
          cb.addEventListener('change', () => {
            const dark = html.getAttribute('data-theme') === 'dark';
            html.setAttribute('data-theme', dark ? '' : 'dark');
            sync();
          });
          sync();

          const onScroll = () => {
            if (window.scrollY > 2) hdr.classList.add('scrolled');
            else hdr.classList.remove('scrolled');
          };
          document.addEventListener('scroll', onScroll, {passive:true});
          onScroll();
        `
      }} />
    </div>
  )
}
