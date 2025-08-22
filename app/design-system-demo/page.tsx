'use client'

import { useState } from 'react'

export default function DesignSystemDemoPage() {
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
        {/* Emphasis Card */}
        <section className="section card card--emphasis">
          <h2 className="title-xl wrap">Emphasis Card</h2>
          <div className="stack">
            <p className="text-m15 wrap">0068FE 테두리(1.5px)와 제목 컬러가 적용된 강조 카드 예시입니다.</p>
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
        </section>

        {/* Buttons */}
        <section className="section card">
          <h2 className="title-xl wrap">Buttons</h2>
          <div className="stack">
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              <button className="btn btn--primary">저장</button>
              <button className="btn btn--cancel">취소</button>
              <button className="btn btn--detail">자세히</button>
            </div>
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              <button className="btn btn--primary btn--w343">저장(긴 · 343px)</button>
              <button className="btn btn--muted-solid btn--w147">중간(147px)</button>
            </div>
            {/* +추가하기 */}
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              <button className="btn btn--plus-outline btn--w343">추가하기</button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="section card">
          <h2 className="title-xl wrap">Tabs</h2>
          <nav className="tabs" role="tablist">
            <button className="tab is-active" role="tab" aria-selected="true">출력정보</button>
            <button className="tab" role="tab" aria-selected="false">급여정보</button>
          </nav>
          <div className="stack" style={{marginTop:'12px'}}>
            <p className="text-m15">선택된 탭 하단에 1.5px #0a84ff 인디케이터가 표시됩니다.</p>
          </div>
        </section>

        {/* Upload : + 업로드(규칙 = +추가하기와 동일) */}
        <section className="section card">
          <h2 className="title-xl wrap">Upload</h2>
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
            {/* 업로드 박스만 점선/포인트 컬러 적용 + Hover 배경 (라이트:F5F9FE / 다크:#0F1626) */}
            <button className="btn btn--plus-outline btn--w343 btn--upload">업로드</button>
          </div>
        </section>

        {/* Tags (강조 태그 항목 복원) */}
        <section className="section card">
          <h2 className="title-xl wrap">Tags</h2>
          <div className="stack">
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              <span className="tag tag--a">A · 검토중</span>
              <span className="tag tag--b">B · 완료</span>
              <span className="tag tag--d">D · 승인</span>
              <span className="tag tag--e">E · 취소</span>
            </div>
          </div>
        </section>

        {/* Select & Inputs */}
        <section className="section card">
          <h2 className="title-xl wrap">Select & Inputs</h2>
          <div className="stack">
            <label className="text-m18 wrap" htmlFor="site">현장</label>
            <div className="select-wrap">
              <select id="site" className="select">
                <option>현장 선택</option>
                <option>방배</option>
                <option>대치</option>
                <option>서초</option>
              </select>
            </div>

            <label className="text-m18 wrap" htmlFor="worker">작업자</label>
            <input id="worker" className="input" placeholder="작업자" />

            <label className="text-m18 wrap" htmlFor="memo">메모</label>
            <textarea id="memo" className="textarea" placeholder="메모"></textarea>
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
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="wrap">2025-08-22</td>
                <td className="wrap">방배</td>
                <td className="wrap">홍길동</td>
                <td className="wrap">2</td>
              </tr>
              <tr>
                <td className="wrap">2025-08-22</td>
                <td className="wrap">대치</td>
                <td className="wrap">김철수</td>
                <td className="wrap">1</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 기존 호환성 컴포넌트들 */}
        <section className="section card">
          <h2 className="title-xl wrap">기존 호환성 컴포넌트</h2>
          <div className="stack">
            <div>
              <h3 className="title-lg mb-3">기존 버튼 클래스</h3>
              <div className="btn-group">
                <button className="btn btn--primary">Primary</button>
                <button className="btn btn-secondary">Secondary</button>
                <button className="btn btn--cancel">Cancel</button>
              </div>
            </div>
            
            <div>
              <h3 className="title-lg mb-3">기존 칩 클래스</h3>
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                <span className="chip chip-a">Chip A</span>
                <span className="chip chip-b">Chip B</span>
                <span className="chip chip-d">Chip D</span>
                <span className="chip chip-e">Chip E</span>
              </div>
            </div>

            <div>
              <h3 className="title-lg mb-3">기존 상태 표시</h3>
              <div className="stack">
                <div className="status status-success">✓ 성공 상태</div>
                <div className="status status-warning">⚠ 경고 상태</div>
                <div className="status status-error">✕ 오류 상태</div>
                <div className="status status-info">ℹ 정보 상태</div>
              </div>
            </div>
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
              </div>
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
