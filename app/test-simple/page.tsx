'use client'

import { useState } from 'react'

export default function TestSimplePage() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        간단한 테스트 페이지
      </h1>
      
      <div className="max-w-md mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            카운터 테스트
          </h2>
          
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-blue-600">{count}</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCount(count - 1)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              감소
            </button>
            
            <button
              onClick={() => setCount(count + 1)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              증가
            </button>
          </div>
          
          <button
            onClick={() => setCount(0)}
            className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            리셋
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            이 페이지가 정상적으로 렌더링되면 기본 React 기능은 작동합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
