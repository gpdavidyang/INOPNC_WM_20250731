#!/usr/bin/env node

/**
 * UI 가이드라인 검증 스크립트
 * 컴포넌트가 UI 가이드라인을 준수하는지 자동 검증
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

const UI_GUIDELINES = require('../UI_Guidelines.json');

class UIGuidelinesValidator {
  constructor() {
    this.guidelines = UI_GUIDELINES;
    this.errors = [];
    this.warnings = [];
    this.targetPath = process.argv[2] || 'components'; // 대상 경로 지정 가능
  }

  async validate() {
    const isModuleValidation = this.targetPath !== 'components';
    const validationScope = isModuleValidation ? `[${this.targetPath}]` : '[All Components]';
    
    console.log(chalk.blue(`🔍 UI Guidelines Validator v2.0 ${validationScope}`));
    console.log(chalk.gray(`Checking against UI Guidelines v${this.guidelines.version}\n`));

    // 컴포넌트 파일 찾기 - 경로 기반 필터링
    let searchPattern;
    if (this.targetPath === 'components') {
      searchPattern = 'components/**/*.tsx';
    } else {
      searchPattern = `${this.targetPath}/**/*.tsx`;
    }

    const componentFiles = glob.sync(searchPattern, {
      ignore: ['**/*.test.tsx', '**/*.stories.tsx'],
    });

    const scopeDescription = isModuleValidation ? 
      `${this.targetPath.replace('components/', '')} module` : 
      'all components';
    
    console.log(`Found ${componentFiles.length} files in ${scopeDescription} to validate\n`);

    if (componentFiles.length === 0) {
      console.log(chalk.yellow(`No component files found in ${this.targetPath}`));
      return;
    }

    // 각 파일 검증
    for (const file of componentFiles) {
      await this.validateFile(file);
    }

    // 결과 출력
    this.printResults(scopeDescription);
  }

  async validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(chalk.gray(`Checking ${filePath}...`));

    // 검증 규칙들
    this.checkColorUsage(content, filePath);
    this.checkTypography(content, filePath);
    this.checkSpacing(content, filePath);
    this.checkAccessibility(content, filePath);
    this.checkMobileOptimization(content, filePath);
    this.checkDarkModeSupport(content, filePath);
  }

  checkColorUsage(content, filePath) {
    const { colorSystem } = this.guidelines;
    
    // 하드코딩된 색상 검사
    const hardcodedColors = content.match(/#[0-9A-Fa-f]{6}/g) || [];
    const allowedColors = [
      colorSystem.coreBrand.tossBlue['500'],
      colorSystem.coreBrand.tossBlue['600'],
      colorSystem.coreBrand.tossBlue['700'],
      colorSystem.semantic.success,
      colorSystem.semantic.error,
      colorSystem.semantic.warning,
      colorSystem.semantic.info,
    ];

    hardcodedColors.forEach(color => {
      if (!allowedColors.includes(color.toUpperCase())) {
        this.warnings.push({
          file: filePath,
          type: 'color',
          message: `Hardcoded color "${color}" not in UI Guidelines. Use Tailwind classes or design tokens.`,
        });
      }
    });

    // Tailwind 클래스 검사
    if (!content.includes('text-gray-') && content.includes('className')) {
      this.warnings.push({
        file: filePath,
        type: 'color',
        message: 'Missing text color classes. Ensure proper text color is applied.',
      });
    }
  }

  checkTypography(content, filePath) {
    const { typography } = this.guidelines;
    
    // 폰트 크기 검사
    const textSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
    const hasTextSize = textSizes.some(size => content.includes(size));
    
    if (content.includes('<h') || content.includes('heading')) {
      if (!hasTextSize) {
        this.errors.push({
          file: filePath,
          type: 'typography',
          message: 'Heading elements must have appropriate text size classes.',
        });
      }
    }

    // 폰트 weight 검사
    if (content.includes('font-') && !content.match(/font-(normal|medium|semibold|bold)/)) {
      this.warnings.push({
        file: filePath,
        type: 'typography',
        message: 'Use standard font weights: normal, medium, semibold, bold.',
      });
    }
  }

  checkSpacing(content, filePath) {
    const { spacing } = this.guidelines;
    
    // 모바일 또는 컴팩트 컴포넌트는 더 작은 간격 허용
    const isMobileComponent = filePath.includes('/mobile/') || filePath.includes('Compact') || filePath.includes('Enhanced');
    const baseUnit = isMobileComponent ? 2 : 4;
    
    // 패딩/마진 검사
    const spacingPattern = /[pm][tlbrxy]?-(\d+)/g;
    const matches = content.match(spacingPattern) || [];
    
    matches.forEach(match => {
      const value = parseInt(match.split('-')[1]);
      
      // 모바일은 더 유연한 간격 허용
      if (isMobileComponent) {
        // 모바일에서는 1, 1.5, 2, 3 등 작은 값도 허용
        if (value > 8 && value % baseUnit !== 0) {
          this.warnings.push({
            file: filePath,
            type: 'spacing',
            message: `Non-standard mobile spacing "${match}". Use ${baseUnit}px base unit multiples for values > 8.`,
          });
        }
      } else {
        if (value > 24 && value % baseUnit !== 0) {
          this.warnings.push({
            file: filePath,
            type: 'spacing',
            message: `Non-standard spacing "${match}". Use ${baseUnit}px base unit multiples.`,
          });
        }
      }
    });
    
    // 컴팩트 레이아웃 검사
    if ((isMobileComponent || filePath.includes('compact')) && content.includes('p-5')) {
      this.warnings.push({
        file: filePath,
        type: 'spacing',
        message: 'Compact components should use p-3 (12px) or smaller padding, not p-5 (20px).',
      });
    }
  }

  checkAccessibility(content, filePath) {
    const { accessibility } = this.guidelines;
    
    // 버튼/클릭 가능한 요소의 최소 크기 검사
    if (content.includes('button') || content.includes('onClick')) {
      if (!content.includes('min-h-') && !content.includes('h-')) {
        this.warnings.push({
          file: filePath,
          type: 'accessibility',
          message: 'Interactive elements should have minimum height of 44px (min-h-[44px] or h-11+).',
        });
      }
    }

    // Focus visible 검사
    if (content.includes('focus:') && !content.includes('focus-visible:')) {
      this.warnings.push({
        file: filePath,
        type: 'accessibility',
        message: 'Use focus-visible instead of focus for keyboard-only focus styles.',
      });
    }

    // ARIA 라벨 검사
    if ((content.includes('<button') || content.includes('<input')) && 
        !content.includes('aria-') && 
        !content.includes('children')) {
      this.warnings.push({
        file: filePath,
        type: 'accessibility',
        message: 'Interactive elements should have appropriate ARIA labels.',
      });
    }
  }

  checkMobileOptimization(content, filePath) {
    // 모바일 컴포넌트 검사
    if (filePath.includes('/mobile/')) {
      // 터치 타겟 크기
      if (!content.includes('min-h-[56px]') && !content.includes('h-14')) {
        this.errors.push({
          file: filePath,
          type: 'mobile',
          message: 'Mobile components should have minimum height of 56px.',
        });
      }

      // Active 상태
      if (!content.includes('active:')) {
        this.warnings.push({
          file: filePath,
          type: 'mobile',
          message: 'Mobile components should have active state feedback.',
        });
      }
    }
  }

  checkDarkModeSupport(content, filePath) {
    // 다크모드 지원 검사
    if (content.includes('bg-white') && !content.includes('dark:bg-')) {
      this.errors.push({
        file: filePath,
        type: 'dark-mode',
        message: 'Components with light backgrounds must include dark mode variants.',
      });
    }

    if (content.includes('text-gray-900') && !content.includes('dark:text-')) {
      this.errors.push({
        file: filePath,
        type: 'dark-mode',
        message: 'Text colors must include dark mode variants.',
      });
    }
  }

  printResults(scopeDescription = 'all components') {
    console.log('\n' + chalk.bold(`Validation Results for ${scopeDescription}:`));
    console.log(chalk.gray('─'.repeat(60)));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green(`✅ All components in ${scopeDescription} follow UI Guidelines!`));
      
      // 모듈 검증일 경우 다음 단계 제안
      if (scopeDescription !== 'all components') {
        console.log(chalk.blue('\n📝 Next steps:'));
        console.log(chalk.gray('  - Continue implementing other modules'));
        console.log(chalk.gray('  - Run full validation when all modules complete: npm run validate:ui:full'));
      }
      return;
    }

    // 에러 출력
    if (this.errors.length > 0) {
      console.log(chalk.red(`\n❌ Errors in ${scopeDescription} (${this.errors.length}):`));
      this.errors.forEach(error => {
        console.log(chalk.red(`  • ${error.file.replace('components/', '')}`));
        console.log(chalk.red(`    [${error.type}] ${error.message}`));
      });
    }

    // 경고 출력
    if (this.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Warnings in ${scopeDescription} (${this.warnings.length}):`));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning.file.replace('components/', '')}`));
        console.log(chalk.yellow(`    [${warning.type}] ${warning.message}`));
      });
    }

    // 요약
    console.log('\n' + chalk.gray('─'.repeat(60)));
    console.log(chalk.bold('Summary:'));
    console.log(`  Scope: ${scopeDescription}`);
    console.log(`  Errors: ${chalk.red(this.errors.length)}`);
    console.log(`  Warnings: ${chalk.yellow(this.warnings.length)}`);

    // 수정 제안
    if (this.errors.length > 0 || this.warnings.length > 0) {
      console.log(chalk.blue('\n🔧 Quick fixes:'));
      console.log(chalk.gray('  - Auto-fix issues: npm run ui:fix'));
      console.log(chalk.gray(`  - Re-validate module: npm run validate:ui:${scopeDescription.split(' ')[0]}`));
    }

    // 에러가 있으면 실패
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

// 실행
const validator = new UIGuidelinesValidator();
validator.validate().catch(console.error);