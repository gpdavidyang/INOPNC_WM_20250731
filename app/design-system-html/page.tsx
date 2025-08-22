export default function DesignSystemHTMLPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header className="header" id="hdr">
        <button className="btn-icon" aria-label="뒤로">⟵</button>
        <h1 className="title">INOPNC 디자인 시스템 (HTML)</h1>
        <label className="switch" aria-label="다크모드 토글">
          <input id="themeCheckbox" type="checkbox" />
          <span className="slider"><span className="knob"></span></span>
        </label>
      </header>

      {/* Main Content */}
      <main className="app">
        <div className="section">
          
          {/* Emphasis Card */}
          <div className="card card--emphasis">
            <h2 className="title-xl wrap">Emphasis Card</h2>
            <div className="stack">
              <p className="text-m15 wrap">0068FE 테두리(1.5px)와 제목 컬러가 적용된 강조 카드 예시입니다.</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="title-xl wrap">Quick Actions</h2>
            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              <button className="tile-outline tile-green">출력일보</button>
              <button className="tile-outline tile-orange">나의 문서함</button>
              <button className="tile-outline tile-purple">현장조회</button>
              <button className="tile-outline tile-blue">현장 공도면</button>
            </div>
          </div>

          {/* Buttons */}
          <div className="card">
            <h2 className="title-xl wrap">Buttons</h2>
            <div className="stack">
              <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                <button className="btn btn--primary">저장</button>
                <button className="btn btn--cancel">취소</button>
                <button className="btn btn--detail">자세히</button>
              </div>
              <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                <button className="btn btn--primary btn--w343">저장(긴 · 343px)</button>
                <button className="btn btn--muted-solid btn--w147">중간(147px)</button>
              </div>
              <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                <button className="btn btn--plus-outline btn--w343">추가하기</button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <h2 className="title-xl wrap">Tabs</h2>
            <nav className="tabs" role="tablist">
              <button className="tab is-active" role="tab" aria-selected="true">출력정보</button>
              <button className="tab" role="tab" aria-selected="false">급여정보</button>
            </nav>
            <div className="stack" style={{marginTop: '12px'}}>
              <p className="text-m15">선택된 탭 하단에 1.5px #0a84ff 인디케이터가 표시됩니다.</p>
            </div>
          </div>

          {/* Upload */}
          <div className="card">
            <h2 className="title-xl wrap">Upload</h2>
            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              <button className="btn btn--plus-outline btn--w343 btn--upload">업로드</button>
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <h2 className="title-xl wrap">Tags</h2>
            <div className="stack">
              <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                <span className="tag tag--a">A · 검토중</span>
                <span className="tag tag--b">B · 완료</span>
                <span className="tag tag--d">D · 승인</span>
                <span className="tag tag--e">E · 취소</span>
              </div>
            </div>
          </div>

          {/* Select & Inputs */}
          <div className="card">
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
          </div>

          {/* Table */}
          <div className="card">
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
          </div>

          {/* Dashboard Preview */}
          <div className="card">
            <h2 className="title-xl wrap">대시보드 미리보기</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card">
                <div className="p-5">
                  <dt className="text-r12 font-medium" style={{color: 'var(--muted)'}}>전체 작업</dt>
                  <dd className="mt-1 text-3xl font-semibold" style={{color: 'var(--text)'}}>24</dd>
                </div>
              </div>
              <div className="card">
                <div className="p-5">
                  <dt className="text-r12 font-medium" style={{color: 'var(--primary)'}}>대기 중</dt>
                  <dd className="mt-1 text-3xl font-semibold" style={{color: 'var(--primary)'}}>8</dd>
                </div>
              </div>
              <div className="card">
                <div className="p-5">
                  <dt className="text-r12 font-medium" style={{color: '#f59e0b'}}>진행 중</dt>
                  <dd className="mt-1 text-3xl font-semibold" style={{color: '#f59e0b'}}>12</dd>
                </div>
              </div>
              <div className="card">
                <div className="p-5">
                  <dt className="text-r12 font-medium" style={{color: '#10b981'}}>완료됨</dt>
                  <dd className="mt-1 text-3xl font-semibold" style={{color: '#10b981'}}>4</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Task List Preview */}
          <div className="card">
            <h2 className="title-xl wrap">작업 목록 미리보기</h2>
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
              
              <div className="card p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="title-lg">방배 현장 기초공사</h3>
                      <span className="tag tag--a">진행 중</span>
                      <span className="tag tag--b">높음</span>
                    </div>
                    <p className="mb-3" style={{color: 'var(--muted)'}}>
                      방배 현장의 기초공사 작업을 진행합니다.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">프로젝트:</span>
                        <span className="ml-2" style={{color: 'var(--muted)'}}>방배</span>
                      </div>
                      <div>
                        <span className="font-medium">담당자:</span>
                        <span className="ml-2" style={{color: 'var(--muted)'}}>홍길동</span>
                      </div>
                      <div>
                        <span className="font-medium">마감일:</span>
                        <span className="ml-2" style={{color: 'var(--muted)'}}>2025-09-15</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="btn btn--detail">보기</button>
                    <button className="btn btn--detail">완료</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          document.addEventListener('scroll', onScroll, {passive: true});
          onScroll();

          // 데모용 탭 전환
          document.querySelectorAll('.tab').forEach(t => {
            t.addEventListener('click', () => {
              document.querySelectorAll('.tab').forEach(x => x.classList.remove('is-active'));
              t.classList.add('is-active');
            });
          });
        `
      }} />
    </div>
  )
}
