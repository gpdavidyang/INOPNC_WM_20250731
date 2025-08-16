# Task Master AI - Minimal Configuration

## 🚫 LOOP PREVENTION FIRST
**CRITICAL**: This file is REFERENCE-ONLY. Claude should NOT auto-load or auto-execute Task Master commands.

**FORBIDDEN AUTO-BEHAVIORS:**
- ❌ Auto-loading this file as context
- ❌ Auto-executing Task Master commands
- ❌ Auto-updating TODOs or summaries
- ❌ Proactive task management

**USER EXPLICIT REQUEST ONLY**: Claude should only use Task Master when user specifically asks.

## 🎯 Essential Commands Only

### ✅ Fast Daily Workflow (1-2 seconds)
```bash
task-master list                                   # Show all tasks with status
task-master next                                   # Get next available task to work on
task-master show <id>                             # View task details
task-master set-status --id=<id> --status=done    # Mark task complete
```

### ⚠️ Simple Management (3-5 seconds)
```bash
task-master add-task --prompt="description"       # Add new task (NO --research)
task-master move --from=<id> --to=<id>           # Reorganize tasks
```

## Key Files & Project Structure

### Core Files

- `.taskmaster/tasks/tasks.json` - Main task data file (auto-managed)
- `.taskmaster/config.json` - AI model configuration (use `task-master models` to modify)
- `.taskmaster/docs/prd.txt` - Product Requirements Document for parsing
- `.taskmaster/tasks/*.txt` - Individual task files (auto-generated from tasks.json)
- `.env` - API keys for CLI usage

### Claude Code Integration Files

- `CLAUDE.md` - Reference-only context for Claude Code (this file)
- `.claude/settings.json` - Claude Code tool allowlist and preferences
- `.claude/commands/` - Custom slash commands for repeated workflows
- `.mcp.json` - MCP server configuration (project-specific)

### Directory Structure

```
project/
├── .taskmaster/
│   ├── tasks/              # Task files directory
│   │   ├── tasks.json      # Main task database
│   │   ├── task-1.md      # Individual task files
│   │   └── task-2.md
│   ├── docs/              # Documentation directory
│   │   ├── prd.txt        # Product requirements
│   ├── reports/           # Analysis reports directory
│   │   └── task-complexity-report.json
│   ├── templates/         # Template files
│   │   └── example_prd.txt  # Example PRD template
│   └── config.json        # AI models & settings
├── .claude/
│   ├── settings.json      # Claude Code configuration
│   └── commands/         # Custom slash commands
├── .env                  # API keys
├── .mcp.json            # MCP configuration
└── CLAUDE.md            # This file - reference-only by Claude Code
```

## MCP Integration

Task Master provides an MCP server that Claude Code can connect to. Configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_API_KEY_HERE"
      }
    }
  }
}
```

### Essential MCP Tools

```javascript
help; // = shows available taskmaster commands
// Project setup
initialize_project; // = task-master init
parse_prd; // = task-master parse-prd

// Daily workflow
get_tasks; // = task-master list
next_task; // = task-master next
get_task; // = task-master show <id>
set_task_status; // = task-master set-status

// Task management
add_task; // = task-master add-task
expand_task; // = task-master expand
update_task; // = task-master update-task
update_subtask; // = task-master update-subtask
update; // = task-master update

// Analysis
analyze_project_complexity; // = task-master analyze-complexity
complexity_report; // = task-master complexity-report
```

## Claude Code Workflow Integration

### Standard Development Workflow

#### 1. Project Initialization

```bash
# Initialize Task Master
task-master init

# Create or obtain PRD, then parse it
task-master parse-prd .taskmaster/docs/prd.txt

# Analyze complexity and expand tasks
task-master analyze-complexity --research
task-master expand --all --research
```

If tasks already exist, another PRD can be parsed (with new information only!) using parse-prd with --append flag. This will add the generated tasks to the existing list of tasks..

#### 2. Daily Development Loop

```bash
# Start each session
task-master next                           # Find next available task
task-master show <id>                     # Review task details

# During implementation, check in code context into the tasks and subtasks
task-master update-subtask --id=<id> --prompt="implementation notes..."

# Complete tasks
task-master set-status --id=<id> --status=done
```

#### 3. Multi-Claude Workflows

For complex projects, use multiple Claude Code sessions:

```bash
# Terminal 1: Main implementation
cd project && claude

# Terminal 2: Testing and validation
cd project-test-worktree && claude

# Terminal 3: Documentation updates
cd project-docs-worktree && claude
```

### Custom Slash Commands

Create `.claude/commands/taskmaster-next.md`:

```markdown
Find the next available Task Master task and show its details.

Steps:

1. Run `task-master next` to get the next task
2. If a task is available, run `task-master show <id>` for full details
3. Provide a summary of what needs to be implemented
4. Suggest the first implementation step
```

Create `.claude/commands/taskmaster-complete.md`:

```markdown
Complete a Task Master task: $ARGUMENTS

Steps:

1. Review the current task with `task-master show $ARGUMENTS`
2. Verify all implementation is complete
3. Run any tests related to this task
4. Mark as complete: `task-master set-status --id=$ARGUMENTS --status=done`
5. Show the next available task with `task-master next`
```

## Tool Allowlist Recommendations

Add to `.claude/settings.json`:

```json
{
  "allowedTools": [
    "Edit",
    "Bash(task-master *)",
    "Bash(git commit:*)",
    "Bash(git add:*)",
    "Bash(npm run *)",
    "mcp__task_master_ai__*"
  ]
}
```

## Configuration & Setup

### API Keys Required

At least **one** of these API keys must be configured:

- `ANTHROPIC_API_KEY` (Claude models) - **Required**

Additional API keys (optional for advanced features):
- `OPENAI_API_KEY` (GPT models)
- `GOOGLE_API_KEY` (Gemini models)
- `MISTRAL_API_KEY` (Mistral models)
- `OPENROUTER_API_KEY` (Multiple models)
- `XAI_API_KEY` (Grok models)

An API key is required for any provider used across any of the 3 roles defined in the `models` command.

### Model Configuration

```bash
# Interactive setup (recommended)
task-master models --setup

# Set specific models
task-master models --set-main claude-3-5-sonnet-20241022
task-master models --set-fallback gpt-4o-mini
```

## Task Structure & IDs

### Task ID Format

- Main tasks: `1`, `2`, `3`, etc.
- Subtasks: `1.1`, `1.2`, `2.1`, etc.
- Sub-subtasks: `1.1.1`, `1.1.2`, etc.

### Task Status Values

- `pending` - Ready to work on
- `in-progress` - Currently being worked on
- `done` - Completed and verified
- `deferred` - Postponed
- `cancelled` - No longer needed
- `blocked` - Waiting on external factors

### Task Fields

```json
{
  "id": "1.2",
  "title": "Implement user authentication",
  "description": "Set up JWT-based auth system",
  "status": "pending",
  "priority": "high",
  "dependencies": ["1.1"],
  "details": "Use bcrypt for hashing, JWT for tokens...",
  "testStrategy": "Unit tests for auth functions, integration tests for login flow",
  "subtasks": []
}
```

## Claude Code Best Practices with Task Master

### Context Management

- Use `/clear` between different tasks to maintain focus
- This CLAUDE.md file is reference-only for context when requested
- Use `task-master show <id>` to pull specific task context when needed

### Iterative Implementation

1. `task-master show <subtask-id>` - Understand requirements
2. Explore codebase and plan implementation
3. `task-master update-subtask --id=<id> --prompt="detailed plan"` - Log plan
4. `task-master set-status --id=<id> --status=in-progress` - Start work
5. Implement code following logged plan
6. `task-master update-subtask --id=<id> --prompt="what worked/didn't work"` - Log progress
7. `task-master set-status --id=<id> --status=done` - Complete task

### Complex Workflows with Checklists

For large migrations or multi-step processes:

1. Create a markdown PRD file describing the new changes: `touch task-migration-checklist.md` (prds can be .txt or .md)
2. Use Taskmaster to parse the new prd with `task-master parse-prd --append` (also available in MCP)
3. Use Taskmaster to expand the newly generated tasks into subtasks. Consdier using `analyze-complexity` with the correct --to and --from IDs (the new ids) to identify the ideal subtask amounts for each task. Then expand them.
4. Work through items systematically, checking them off as completed
5. Use `task-master update-subtask` to log progress on each task/subtask and/or updating/researching them before/during implementation if getting stuck

### Git Integration

Task Master works well with `gh` CLI:

```bash
# Create PR for completed task
gh pr create --title "Complete task 1.2: User authentication" --body "Implements JWT auth system as specified in task 1.2"

# Reference task in commits
git commit -m "feat: implement JWT auth (task 1.2)"
```

### Parallel Development with Git Worktrees

```bash
# Create worktrees for parallel task development
git worktree add ../project-auth feature/auth-system
git worktree add ../project-api feature/api-refactor

# Run Claude Code in each worktree
cd ../project-auth && claude    # Terminal 1: Auth work
cd ../project-api && claude     # Terminal 2: API work
```

## Troubleshooting

### AI Commands Failing

```bash
# Check API keys are configured
cat .env                           # For CLI usage

# Verify model configuration
task-master models

# Test with different model
task-master models --set-fallback gpt-4o-mini
```

### MCP Connection Issues

- Check `.mcp.json` configuration
- Verify Node.js installation
- Use `--mcp-debug` flag when starting Claude Code
- Use CLI as fallback if MCP unavailable

### Task File Sync Issues

```bash
# Regenerate task files from tasks.json
task-master generate

# Fix dependency issues
task-master fix-dependencies
```

DO NOT RE-INITIALIZE. That will not do anything beyond re-adding the same Taskmaster core files.

## Important Notes

### AI-Powered Operations

These commands make AI calls and may take up to a minute:

- `parse_prd` / `task-master parse-prd`
- `analyze_project_complexity` / `task-master analyze-complexity`
- `expand_task` / `task-master expand`
- `expand_all` / `task-master expand --all`
- `add_task` / `task-master add-task`
- `update` / `task-master update`
- `update_task` / `task-master update-task`
- `update_subtask` / `task-master update-subtask`

### File Management

- Never manually edit `tasks.json` - use commands instead
- Never manually edit `.taskmaster/config.json` - use `task-master models`
- Task markdown files in `tasks/` are auto-generated
- Run `task-master generate` after manual changes to tasks.json

### Claude Code Session Management

- Use `/clear` frequently to maintain focused context
- Create custom slash commands for repeated Task Master workflows
- Configure tool allowlist to streamline permissions
- Use headless mode sparingly: `claude -p "task-master next"` (user request only)

### Multi-Task Updates

- Use `update --from=<id>` to update multiple future tasks
- Use `update-task --id=<id>` for single task updates
- Use `update-subtask --id=<id>` for implementation logging

### Research Mode

- Add `--research` flag for research-based AI enhancement
- Uses the configured ANTHROPIC_API_KEY for enhanced analysis
- Provides more informed task creation and updates
- Recommended for complex technical tasks

---

## Task Master AI 최소 기능 사용 가이드

### 🎯 목적: 워크플로 관리 & 완료 기록 전용

성능에 영향을 주지 않으면서 워크플로 관리 용도로만 사용하는 최적화 가이드입니다.

### ✅ 권장 사용 명령어 (빠르고 효율적)

#### 1. 일상 워크플로 명령어
```bash
# 작업 목록 확인 (즉시 응답)
task-master list
mcp__task_master_ai__get_tasks

# 다음 작업 확인 (즉시 응답)  
task-master next
mcp__task_master_ai__next_task

# 특정 작업 상세보기 (즉시 응답)
task-master show <id>
mcp__task_master_ai__get_task

# 작업 완료 기록 (즉시 응답)
task-master set-status --id=<id> --status=done
mcp__task_master_ai__set_task_status
```

#### 2. 간단한 작업 관리
```bash
# 새 작업 추가 (간단한 것만, --research 금지)
task-master add-task --prompt="간단한 작업 설명"

# 작업 이동 (즉시 응답)
task-master move --from=<id> --to=<id>

# 종속성 추가/제거 (즉시 응답)
task-master add-dependency --id=<id> --depends-on=<id>
task-master remove-dependency --id=<id> --depends-on=<id>
```

### ❌ 피해야 할 명령어 (성능에 영향)

```bash
# 이런 명령어들은 사용 금지:
task-master analyze-complexity --research     # 30초-1분 소요
task-master expand --all --research          # 1-3분 소요  
task-master expand --id=<id> --research      # 30초-1분 소요
task-master update --from=<id> --research    # 30초-1분 소요

# --research 플래그 사용 금지
task-master add-task --prompt="..." --research    # 느림
task-master update-task --id=<id> --research      # 느림
```

### 🚀 최적 사용 패턴

#### 개발 세션 시작
```bash
1. task-master next                    # 다음 작업 확인
2. task-master show <id>              # 작업 상세 확인
3. task-master set-status --id=<id> --status=in-progress
```

#### 개발 완료
```bash
1. task-master set-status --id=<id> --status=done
2. task-master next                   # 다음 작업 확인
```

### 📊 성능 영향 비교

| 명령어 유형 | 응답 시간 | MCP 호출 | AI 사용 | 권장도 |
|------------|----------|----------|---------|--------|
| **list, next, show** | 즉시 (1-2초) | 최소 | 없음 | ✅ 적극 권장 |
| **set-status** | 즉시 (1-2초) | 최소 | 없음 | ✅ 적극 권장 |
| **add-task (단순)** | 3-5초 | 보통 | 최소 | ⚠️ 필요시만 |
| **expand --research** | 30초-3분 | 높음 | 높음 | ❌ 금지 |
| **analyze-complexity** | 30초-1분 | 높음 | 높음 | ❌ 금지 |

### 🎯 핵심 원칙

1. **속도 우선**: AI 분석이 필요한 기능은 피하기
2. **단순 관리**: 작업 상태 관리와 기록에만 집중
3. **수동 생성**: 복잡한 작업은 수동으로 생성하고 Task Master는 추적만
4. **즉시 응답**: 1-2초 내 응답되는 명령어만 사용

**핵심**: Task Master AI를 "할일 목록 관리자"로만 사용하고, "AI 분석가"로는 사용하지 않기.

---

## 🚫 END OF TASKMASTER CLAUDE.MD - LOOP TERMINATION

**CRITICAL REMINDER**: This file should ONLY be referenced when user explicitly requests Task Master functionality.

### ANTI-LOOP SAFEGUARDS
1. **NO AUTO-LOADING**: Claude should not load this file automatically
2. **NO PROACTIVE ACTIONS**: Claude should not run Task Master commands without explicit user request
3. **NO CONTEXT CHAINING**: This file should not trigger loading of other files
4. **REFERENCE ONLY**: Treat as documentation, not auto-executable instructions

**This is the END of TaskMaster configuration - NO FURTHER AUTO-ACTIONS**
