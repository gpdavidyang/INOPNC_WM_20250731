#!/bin/bash

echo "🚀 Claude 성능 최적화 스크립트"
echo "================================"

# 1. Next.js 빌드 캐시 정리
echo "1️⃣ Next.js 빌드 캐시 정리 중..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "   ✅ .next 디렉토리 삭제 완료"
fi

# 2. 불필요한 로그 파일 정리
echo "2️⃣ 오래된 로그 파일 정리 중..."
find . -name "*.log" -mtime +7 -delete 2>/dev/null
echo "   ✅ 7일 이상된 로그 파일 삭제 완료"

# 3. Node modules 캐시 정리
echo "3️⃣ Node modules 캐시 정리 중..."
npm cache clean --force 2>/dev/null
echo "   ✅ npm 캐시 정리 완료"

# 4. TypeScript 캐시 정리
echo "4️⃣ TypeScript 캐시 정리 중..."
rm -rf node_modules/.cache 2>/dev/null
echo "   ✅ TypeScript 캐시 정리 완료"

# 5. 백업 파일 이동
echo "5️⃣ 백업 파일 정리 중..."
mkdir -p ./backups
mv backup*.* ./backups/ 2>/dev/null
echo "   ✅ 백업 파일을 ./backups 디렉토리로 이동"

# 6. Git 저장소 최적화
echo "6️⃣ Git 저장소 최적화 중..."
git gc --aggressive --prune=now 2>/dev/null
echo "   ✅ Git 저장소 최적화 완료"

echo ""
echo "✨ 성능 최적화 완료!"
echo ""
echo "추가 권장사항:"
echo "- VSCode 재시작하여 TypeScript 서버 리셋"
echo "- 불필요한 브라우저 탭 닫기"
echo "- npm run dev 재시작"