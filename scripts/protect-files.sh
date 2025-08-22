#!/bin/bash

# 중요 파일들을 읽기 전용으로 설정
echo "🔒 Setting critical files to read-only..."

# Level 1 - 절대 수정 금지 (읽기 전용)
LEVEL1_FILES=(
  "lib/supabase/server.ts"
  "lib/supabase/client.ts"
  "middleware.ts"
  "app/auth/actions.ts"
)

# Level 2 - 신중한 수정 필요 (읽기 전용)
LEVEL2_FILES=(
  "lib/auth/session.ts"
  "lib/auth/profile-manager.ts"
  "app/auth/callback/route.ts"
  "providers/auth-provider.tsx"
)

# Level 3 - 수정 가능하나 주의 (쓰기 가능 유지)
LEVEL3_FILES=(
  "app/auth/login/page.tsx"
  "app/auth/signup/page.tsx"
  "hooks/use-auth.ts"
  "lib/supabase/daily-reports.ts"
)

echo "🛡️  Level 1 - 절대 수정 금지:"
for file in "${LEVEL1_FILES[@]}"; do
  if [ -f "$file" ]; then
    chmod 444 "$file"  # 읽기 전용으로 설정
    echo "   ✅ $file"
  fi
done

echo ""
echo "🔐 Level 2 - 신중한 수정 필요:"
for file in "${LEVEL2_FILES[@]}"; do
  if [ -f "$file" ]; then
    chmod 444 "$file"  # 읽기 전용으로 설정
    echo "   ✅ $file"
  fi
done

echo ""
echo "⚠️  Level 3 - 수정 시 주의:"
for file in "${LEVEL3_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   📝 $file (쓰기 가능)"
  fi
done

echo "
===============================================
✅ Level 1, 2 파일들이 읽기 전용으로 보호되었습니다!
수정이 필요한 경우: npm run unprotect
===============================================
"