#!/bin/bash

# Supabase 프로필 자동 생성 문제 해결 스크립트
# 이 스크립트는 Supabase CLI가 설치되어 있어야 합니다

echo "🔧 Supabase 프로필 자동 생성 문제 해결 중..."

# Supabase CLI 확인
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI가 설치되어 있지 않습니다."
    echo "👉 설치 방법: brew install supabase/tap/supabase"
    exit 1
fi

# 현재 디렉토리 확인
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ supabase/config.toml 파일을 찾을 수 없습니다."
    echo "👉 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

echo "📝 SQL 마이그레이션 실행 중..."

# 마이그레이션 실행
supabase db push

echo "✅ 마이그레이션 완료!"
echo ""
echo "🧪 프로필 생성 테스트 중..."

# 테스트 쿼리 실행
supabase db execute -f supabase/test-profile-creation.sql

echo ""
echo "✅ 모든 작업이 완료되었습니다!"
echo "👉 이제 로그인을 시도해보세요."