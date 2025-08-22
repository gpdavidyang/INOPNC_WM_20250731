#!/bin/bash

# Quick Status Check Script - 현재 상태 즉시 파악
# Usage: ./scripts/quick-status-check.sh

echo "🔍 INOPNC 프로젝트 현재 상태 체크"
echo "=================================="

# 1. Vercel 환경변수 확인
echo ""
echo "1️⃣ Vercel 환경변수 상태:"
if grep -q "NEXT_PUBLIC_SUPABASE_URL" vercel.json; then
    echo "   ✅ SUPABASE_URL 설정됨"
else
    echo "   ❌ SUPABASE_URL 누락"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" vercel.json; then
    echo "   ✅ SUPABASE_ANON_KEY 설정됨"
else
    echo "   ❌ SUPABASE_ANON_KEY 누락"
fi

# 2. 로컬 환경변수 확인
echo ""
echo "2️⃣ 로컬 환경변수 상태:"
if [ -f .env.local ]; then
    echo "   ✅ .env.local 파일 존재"
else
    echo "   ❌ .env.local 파일 없음"
fi

# 3. 빌드 상태 확인
echo ""
echo "3️⃣ 빌드 상태:"
if [ -d ".next" ]; then
    echo "   ✅ .next 디렉토리 존재 (빌드됨)"
else
    echo "   ❌ .next 디렉토리 없음 (빌드 필요)"
fi

# 4. 핵심 파일 상태
echo ""
echo "4️⃣ 핵심 파일 상태:"
FILES=("lib/supabase/client.ts" "lib/supabase/server.ts" "middleware.ts" "app/auth/actions.ts")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file 누락"
    fi
done

# 5. Git 상태
echo ""
echo "5️⃣ Git 상태:"
if git status --porcelain | grep -q .; then
    echo "   ⚠️ 변경사항 있음:"
    git status --porcelain
else
    echo "   ✅ 작업 디렉토리 깨끗함"
fi

echo ""
echo "=================================="
echo "🎯 체크 완료 - $(date)"