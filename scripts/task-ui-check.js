#!/usr/bin/env node

/**
 * Task Master와 UI 검증 통합 스크립트
 * 작업 완료 시 자동으로 UI 가이드라인 검증 실행
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

class TaskUIChecker {
  constructor() {
    this.taskId = process.argv[2];
  }

  async run() {
    if (!this.taskId) {
      console.error(chalk.red('❌ Task ID is required'));
      console.log('Usage: npm run task:check <task-id>');
      process.exit(1);
    }

    console.log(chalk.blue(`🔍 Checking UI compliance for Task ${this.taskId}`));
    
    try {
      // 1. Task 정보 가져오기
      console.log(chalk.gray('\n1. Getting task information...'));
      const taskInfo = execSync(`task-master show ${this.taskId}`, { encoding: 'utf8' });
      console.log(taskInfo);

      // 2. 변경된 파일 확인
      console.log(chalk.gray('\n2. Checking modified files...'));
      const modifiedFiles = execSync('git diff --name-only', { encoding: 'utf8' });
      const componentFiles = modifiedFiles
        .split('\n')
        .filter(file => file.includes('components/') && file.endsWith('.tsx'));

      if (componentFiles.length === 0) {
        console.log(chalk.yellow('No component files modified.'));
        return;
      }

      console.log(`Found ${componentFiles.length} modified component files:`);
      componentFiles.forEach(file => console.log(`  - ${file}`));

      // 3. UI 가이드라인 검증
      console.log(chalk.gray('\n3. Running UI Guidelines validation...'));
      try {
        execSync('node scripts/validate-ui-guidelines.js', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('\n❌ UI Guidelines validation failed!'));
        console.log(chalk.yellow('\nPlease fix the errors before marking the task as complete.'));
        process.exit(1);
      }

      // 4. 스크린샷 생성 제안
      console.log(chalk.gray('\n4. Generating component previews...'));
      this.suggestScreenshots(componentFiles);

      // 5. Task 완료 제안
      console.log(chalk.green('\n✅ All UI checks passed!'));
      console.log(chalk.gray('\nTo mark task as complete:'));
      console.log(chalk.cyan(`  task-master set-status --id=${this.taskId} --status=done`));

      // 6. 체크리스트 생성
      this.generateChecklist();

    } catch (error) {
      console.error(chalk.red('Error during UI check:'), error.message);
      process.exit(1);
    }
  }

  suggestScreenshots(componentFiles) {
    console.log(chalk.yellow('\n📸 Suggested screenshots for review:'));
    componentFiles.forEach(file => {
      const componentName = file.split('/').pop().replace('.tsx', '');
      console.log(`  - ${componentName}: http://localhost:6006/?path=/story/${componentName.toLowerCase()}--default`);
    });
    console.log(chalk.gray('\nRun "npm run storybook" to view components'));
  }

  generateChecklist() {
    console.log(chalk.blue('\n📋 UI Review Checklist:'));
    const checklist = [
      '[ ] Colors match UI Guidelines palette',
      '[ ] Typography follows the type scale',
      '[ ] Spacing uses 4px base unit',
      '[ ] Dark mode is properly implemented',
      '[ ] Mobile optimization (if applicable)',
      '[ ] Accessibility standards met',
      '[ ] Touch targets are at least 44x44px',
      '[ ] Focus states are visible',
      '[ ] Component has proper documentation',
      '[ ] Storybook stories are updated',
    ];

    checklist.forEach(item => console.log(`  ${item}`));

    // Task Master에 체크리스트 추가
    console.log(chalk.gray('\nSaving checklist to task...'));
    try {
      const checklistNote = checklist.join('\\n');
      execSync(
        `task-master update-subtask --id=${this.taskId} --prompt="UI Checklist:\\n${checklistNote}"`,
        { stdio: 'inherit' }
      );
    } catch (error) {
      console.warn(chalk.yellow('Could not save checklist to task'));
    }
  }
}

// 실행
const checker = new TaskUIChecker();
checker.run().catch(console.error);