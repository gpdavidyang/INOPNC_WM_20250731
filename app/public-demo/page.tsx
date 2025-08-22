export default function PublicDemoPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold text-gray-900">
        공개 데모 페이지
      </h1>
      <p className="text-gray-600 mt-4">
        이 페이지는 인증 없이 접근할 수 있습니다.
      </p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            기본 UI 컴포넌트
          </h2>
          <div className="space-y-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
              기본 버튼
            </button>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              기본 카드
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-900 mb-4">
            색상 테스트
          </h2>
          <div className="space-y-2">
            <div className="h-8 bg-red-500 rounded"></div>
            <div className="h-8 bg-green-500 rounded"></div>
            <div className="h-8 bg-blue-500 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
