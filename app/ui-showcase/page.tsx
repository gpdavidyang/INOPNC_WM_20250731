'use client'

import { useState } from 'react'

export default function UIShowcasePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme === 'light' ? 'dark' : 'light')
    }
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">INOPNC 전체 UI 시스템 쇼케이스</h1>
            <div className="flex gap-2">
              <button 
                onClick={toggleTheme}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {theme === 'light' ? '🌙' : '☀️'} 테마 변경
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="py-6">
          
          {/* 컨트롤 패널 */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">🎛️ 전체 컨트롤 패널</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 터치 모드 */}
                <div>
                  <label className="block text-sm font-medium mb-2">👆 터치 모드</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="normal">일반</option>
                    <option value="glove">장갑</option>
                    <option value="precision">정밀</option>
                  </select>
                </div>

                {/* 환경 조건 */}
                <div>
                  <label className="block text-sm font-medium mb-2">🌍 환경 조건</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="normal">일반</option>
                    <option value="bright-sun">강한 햇빛</option>
                    <option value="rain">비</option>
                    <option value="cold">추위</option>
                    <option value="dust">먼지</option>
                  </select>
                </div>

                {/* 글자 크기 */}
                <div>
                  <label className="block text-sm font-medium mb-2">📝 글자 크기</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="small">작게</option>
                    <option value="normal">보통</option>
                    <option value="large">크게</option>
                    <option value="xlarge">매우 크게</option>
                  </select>
                </div>

                {/* 현재 설정 표시 */}
                <div>
                  <label className="block text-sm font-medium mb-2">⚙️ 현재 설정</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                    테마: {theme === 'light' ? '라이트' : '다크'}<br/>
                    터치: 일반<br/>
                    환경: 일반<br/>
                    글자: 보통
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 카드 시스템 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">🃏 카드 시스템</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 기본 카드 */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">기본 카드</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  기본적인 정보를 표시하는 카드입니다.
                </p>
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  액션
                </button>
              </div>

              {/* 강조 카드 */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">강조 카드</h3>
                <p className="text-blue-100 mb-4">
                  중요한 정보나 액션을 강조하는 카드입니다.
                </p>
                <button className="px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                  주요 액션
                </button>
              </div>

              {/* 정보 카드 */}
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">정보 카드</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  부가 정보나 설명을 제공하는 카드입니다.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  업데이트: 2024년 1월 15일
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 시스템 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">🔘 버튼 시스템</h2>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium">
                  Primary Button
                </button>
                <button className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium">
                  Secondary Button
                </button>
                <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
                  Outline Button
                </button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm">
                  Success
                </button>
                <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm">
                  Warning
                </button>
                <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm">
                  Danger
                </button>
              </div>
            </div>
          </div>

          {/* 폼 요소 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">📋 폼 요소</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">텍스트 입력</label>
                <input 
                  type="text" 
                  placeholder="텍스트를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">이메일 입력</label>
                <input 
                  type="email" 
                  placeholder="이메일을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">선택 박스</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>옵션 1</option>
                  <option>옵션 2</option>
                  <option>옵션 3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">체크박스</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>동의합니다</span>
                </div>
              </div>
            </div>
          </div>

          {/* 상태 표시 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">📊 상태 표시</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-green-800 dark:text-green-200">성공</span>
              </div>
              
              <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-yellow-800 dark:text-yellow-200">경고</span>
              </div>
              
              <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-red-800 dark:text-red-200">오류</span>
              </div>
              
              <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-blue-800 dark:text-blue-200">정보</span>
              </div>
            </div>
          </div>

          {/* 리스트 시스템 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">📝 리스트 시스템</h2>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold">프로젝트 목록</h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">프로젝트 A</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">진행 중</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs rounded-full">
                      활성
                    </span>
                  </div>
                </div>
                
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">프로젝트 B</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">계획 중</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      계획
                    </span>
                  </div>
                </div>
                
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">프로젝트 C</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">완료</p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                      완료
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 환경 적응 모드 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">🌍 환경 적응 모드</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">현재 환경</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>테마:</span>
                    <span className="font-medium">{theme === 'light' ? '라이트' : '다크'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>터치 모드:</span>
                    <span className="font-medium">일반</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>환경 조건:</span>
                    <span className="font-medium">일반</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>글자 크기:</span>
                    <span className="font-medium">보통</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">접근성 기능</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>고대비 모드</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>큰 글자 모드</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>키보드 네비게이션</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>스크린 리더 지원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

