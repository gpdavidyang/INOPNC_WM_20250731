#!/bin/bash

# 코드 스냅샷 저장 스크립트
# 중요 파일들의 현재 상태를 저장합니다.

SNAPSHOT_DIR=".code-snapshots/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$SNAPSHOT_DIR"

# 보호할 파일 목록
FILES=(
  "lib/supabase/server.ts"
  "lib/supabase/client.ts"
  "middleware.ts"
  "app/auth/actions.ts"
  "app/dashboard/page.tsx"
)

echo "📸 Creating code snapshot..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$SNAPSHOT_DIR/"
    echo "✅ Saved: $file"
  fi
done

# 메타데이터 저장
cat > "$SNAPSHOT_DIR/metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'no-git')",
  "reason": "$1"
}
EOF

echo "✅ Snapshot saved to: $SNAPSHOT_DIR"