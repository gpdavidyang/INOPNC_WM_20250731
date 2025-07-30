#!/bin/bash

# 보호 해제 (수정이 필요할 때만)
echo "🔓 Removing read-only protection..."

# 모든 보호된 파일들
ALL_PROTECTED_FILES=(
  # Level 1
  "lib/supabase/server.ts"
  "lib/supabase/client.ts"
  "middleware.ts"
  "app/auth/actions.ts"
  # Level 2
  "lib/auth/session.ts"
  "lib/auth/profile-manager.ts"
  "app/auth/callback/route.ts"
  "providers/auth-provider.tsx"
)

for file in "${ALL_PROTECTED_FILES[@]}"; do
  if [ -f "$file" ]; then
    chmod 644 "$file"  # 쓰기 권한 복원
    echo "✅ Unprotected: $file"
  fi
done

echo "
⚠️  WARNING: Protected files are now WRITABLE! 
===============================================
1. Make necessary changes carefully
2. Run 'npm run test:critical' to verify
3. Run 'npm run protect' to re-enable protection
===============================================
"