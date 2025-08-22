export default function SimpleTestPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header className="header" id="hdr">
        <button className="btn-icon" aria-label="뒤로">⟵</button>
        <h1 className="title">간단한 디자인 시스템 테스트</h1>
        <label className="switch" aria-label="다크모드 토글">
          <input id="themeCheckbox" type="checkbox" />
          <span className="slider"><span className="knob"></span></span>
        </label>
      </header>

      {/* Main Content */}
      <main className="app">
        <div className="section">
          
          {/* Basic Card */}
          <div className="card">
            <h2 className="title-xl">기본 카드</h2>
            <p className="text-m15">이것은 기본 카드입니다. 새로운 디자인 시스템이 적용되었습니다.</p>
          </div>

          {/* Emphasis Card */}
          <div className="card card--emphasis">
            <h2 className="title-xl">강조 카드</h2>
            <p className="text-m15">이것은 강조된 카드입니다. 0068FE 테두리가 적용되었습니다.</p>
          </div>

          {/* Buttons */}
          <div className="card">
            <h2 className="title-xl">버튼들</h2>
            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              <button className="btn btn--primary">Primary</button>
              <button className="btn btn--cancel">Cancel</button>
              <button className="btn btn--detail">Detail</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="title-xl">빠른 작업</h2>
            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              <button className="tile-outline tile-green">출력일보</button>
              <button className="tile-outline tile-orange">나의 문서함</button>
              <button className="tile-outline tile-purple">현장조회</button>
              <button className="tile-outline tile-blue">현장 공도면</button>
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <h2 className="title-xl">태그들</h2>
            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              <span className="tag tag--a">A · 검토중</span>
              <span className="tag tag--b">B · 완료</span>
              <span className="tag tag--d">D · 승인</span>
              <span className="tag tag--e">E · 취소</span>
            </div>
          </div>

          {/* Inputs */}
          <div className="card">
            <h2 className="title-xl">입력 필드들</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div>
                <label className="text-m18" htmlFor="test-input">테스트 입력</label>
                <input id="test-input" className="input" placeholder="텍스트를 입력하세요" />
              </div>
              <div>
                <label className="text-m18" htmlFor="test-select">테스트 선택</label>
                <div className="select-wrap">
                  <select id="test-select" className="select">
                    <option>옵션 1</option>
                    <option>옵션 2</option>
                    <option>옵션 3</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-m18" htmlFor="test-textarea">테스트 텍스트에어리어</label>
                <textarea id="test-textarea" className="textarea" placeholder="여러 줄 텍스트를 입력하세요" rows={3} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <h2 className="title-xl">테이블</h2>
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>상태</th>
                  <th>날짜</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>홍길동</td>
                  <td>활성</td>
                  <td>2025-08-22</td>
                </tr>
                <tr>
                  <td>김철수</td>
                  <td>대기</td>
                  <td>2025-08-22</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Typography */}
          <div className="card">
            <h2 className="title-xl">타이포그래피</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <h1 className="title-xl">Title XL - 20px/700</h1>
              <h2 className="title-lg">Title LG - 18px/500</h2>
              <p className="text-m18">Text M18 - 18px/500</p>
              <p className="text-m15">Text M15 - 15px/500</p>
              <p className="text-r12">Text R12 - 12px/400</p>
            </div>
          </div>

        </div>
      </main>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Dark mode toggle
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

          // Header scroll effect
          const onScroll = () => {
            if (window.scrollY > 2) hdr.classList.add('scrolled');
            else hdr.classList.remove('scrolled');
          };
          document.addEventListener('scroll', onScroll, {passive: true});
          onScroll();
        `
      }} />
    </div>
  )
}
