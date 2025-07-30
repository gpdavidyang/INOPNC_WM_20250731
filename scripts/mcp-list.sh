#!/bin/bash

echo "🔧 MCP 서버 목록"
echo "================"
echo ""
jq -r '.mcpServers | to_entries[] | "• \(.key)"' /Users/davidyang/workspace/.mcp.json
echo ""
echo "자세한 정보: cat ~/.mcp.json | jq"