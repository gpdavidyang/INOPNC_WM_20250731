'use client'

import { useState } from 'react'

export default function DesignSystemPreviewPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

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
          <h2 className="title-xl wrap">🎨 INOPNC 통합 디자인 시스템</h2>
          <div className="stack">
            <p className="text-m15 wrap">
              새로운 디자인 토큰과 규칙이 적용된 완벽한 시스템입니다. 
              모든 컴포넌트가 일관된 디자인 언어를 따릅니다.
            </p>
            <p className="text-r12 text-muted">
              현재 테마: <strong>{theme === 'light' ? '라이트 모드' : '다크 모드'}</strong>
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="section card">
          <h2 className="title-xl wrap">Quick Actions</h2>
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
            <button className="tile-outline tile-green">출력일보</button>
            <button className="tile-outline tile-orange">나의 문서함</button>
            <button className="tile-outline tile-purple">현장조회</button>
            <button className="tile-outline tile-blue">현장 공도면</button>
          </div>
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-r12 text-muted">
              <strong>Quick Actions 규칙:</strong> 147×48px, 1.5px 테두리, 볼드 텍스트, 
              호버 시 10% 컬러 배경
            </p>
          </div>
        </section>

        {/* Button System */}
        <section className="section card">
          <h2 className="title-xl wrap">Button System</h2>
          <div className="stack">
            <div>
              <h3 className="title-lg mb-3">기본 버튼</h3>
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                <button className="btn btn--primary">저장</button>
                <button className="btn btn--cancel">취소</button>
                <button className="btn btn--detail">자세히</button>
                <button className="btn btn--muted-solid">보조</button>
              </div>
            </div>
            
            <div>
              <h3 className="title-lg mb-3">크기별 버튼</h3>
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                <button className="btn btn--primary btn--w343">저장(긴 · 343px)</button>
                <button className="btn btn--muted-solid btn--w147">중간(147px)</button>
              </div>
            </div>

            <div>
              <h3 className="title-lg mb-3">특수 버튼</h3>
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                <button className="btn btn--plus-outline btn--w343">추가하기</button>
                <button className="btn btn--plus-outline btn--w343 btn--upload">업로드</button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-r12 text-muted">
                <strong>버튼 규칙:</strong> 높이 48px, 반지름 8px, 미디움(500) 폰트, 
                액티브 시 scale(0.97), 최소 터치 영역 44x44px
              </p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="section card">
          <h2 className="title-xl wrap">Tabs</h2>
          <nav className="tabs" role="tablist">
            <button className="tab is-active" role="tab" aria-selected="true">출력정보</button>
            <button className="tab" role="tab" aria-selected="false">급여정보</button>
            <button className="tab" role="tab" aria-selected="false">현장정보</button>
          </nav>
          <div className="stack" style={{marginTop:'12px'}}>
            <p className="text-m15">선택된 탭 하단에 1.5px #0a84ff 인디케이터가 표시됩니다.</p>
          </div>
        </section>

        {/* Tags */}
        <section className="section card">
          <h2 className="title-xl wrap">Tags</h2>
          <div className="stack">
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              <span className="tag tag--a">A · 검토중</span>
              <span className="tag tag--b">B · 완료</span>
              <span className="tag tag--d">D · 승인</span>
              <span className="tag tag--e">E · 취소</span>
            </div>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-r12 text-muted">
                <strong>태그 규칙:</strong> 높이 22px, 반지름 4px, 12px 폰트, 
                호버 시 10% 컬러 배경, 다크모드에서 특별한 스타일 적용
              </p>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="section card">
          <h2 className="title-xl wrap">Form Elements</h2>
          <div className="stack">
            <div>
              <label className="text-m18 wrap" htmlFor="site">현장</label>
              <div className="select-wrap">
                <select id="site" className="select">
                  <option>현장 선택</option>
                  <option>방배</option>
                  <option>대치</option>
                  <option>서초</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-m18 wrap" htmlFor="worker">작업자</label>
              <input id="worker" className="input" placeholder="작업자" />
            </div>

            <div>
              <label className="text-m18 wrap" htmlFor="memo">메모</label>
              <textarea id="memo" className="textarea" placeholder="메모"></textarea>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-r12 text-muted">
                <strong>폼 규칙:</strong> 높이 48px, 반지름 8px, 포커스 시 #0068FE 테두리와 링, 
                작업자/메모만 레귤러(400) 폰트
              </p>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="section card">
          <h2 className="title-xl wrap">Table</h2>
          <table>
            <thead>
              <tr>
                <th className="wrap">일자</th>
                <th className="wrap">현장</th>
                <th className="wrap">작업자</th>
                <th className="wrap">공수</th>
                <th className="wrap">상태</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="wrap">2025-08-22</td>
                <td className="wrap">방배</td>
                <td className="wrap">홍길동</td>
                <td className="wrap">2</td>
                <td className="wrap"><span className="tag tag--d">승인</span></td>
              </tr>
              <tr>
                <td className="wrap">2025-08-22</td>
                <td className="wrap">대치</td>
                <td className="wrap">김철수</td>
                <td className="wrap">1</td>
                <td className="wrap"><span className="tag tag--a">검토중</span></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-r12 text-muted">
              <strong>테이블 규칙:</strong> 헤더 행 위/아래만 1px 테두리, 
              라이트모드에서만 헤더 배경, 14px 폰트, 중앙 정렬
            </p>
          </div>
        </section>

        {/* CSS Variables Display */}
        <section className="section card">
          <h2 className="title-xl wrap">CSS 변수 시스템</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="title-lg mb-3">라이트 모드</h3>
              <div className="stack">
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--bg:</strong> #F5F9FE
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--text:</strong> #0B1220
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--card-bg:</strong> #FFFFFF
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--btn-main:</strong> #1A254F
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--point:</strong> #0068FE
                </div>
              </div>
            </div>
            <div>
              <h3 className="title-lg mb-3">다크 모드</h3>
              <div className="stack">
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--bg:</strong> #0E1422
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--text:</strong> #E8EDF6
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--card-bg:</strong> #191E2F
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--input-bg:</strong> #0F1626
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <strong>--muted:</strong> #FFFFFF
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Responsive Design */}
        <section className="section card">
          <h2 className="title-xl wrap">Responsive Design</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="title-lg mb-3">모바일 기준</h3>
              <ul className="text-m15 space-y-1">
                <li>• 기준 폭: 360~390px</li>
                <li>• 370px 이하: 자동 보정</li>
                <li>• 버튼 높이: 44px</li>
                <li>• 폰트 크기: 0.875rem</li>
              </ul>
            </div>
            <div>
              <h3 className="title-lg mb-3">디자인 토큰</h3>
              <ul className="text-m15 space-y-1">
                <li>• 간격: 8px, 12px, 16px, 20px, 24px</li>
                <li>• 반지름: 4px, 6px, 8px, 12px</li>
                <li>• 전환: 0.2s ease</li>
                <li>• 그림자: var(--elev-1)</li>
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

          // 데모용 탭 전환
          document.querySelectorAll('.tab').forEach(t=>{
            t.addEventListener('click',()=>{
              document.querySelectorAll('.tab').forEach(x=>x.classList.remove('is-active'));
              t.classList.add('is-active');
            });
          });
        `
      }} />
    </div>
  )
}
