#!/usr/bin/env node

/**
 * 문서 동기화 스크립트
 * USER_CUSTOMIZATIONS.md와 PRD.md 간의 일관성을 검증하고 동기화합니다.
 */

const fs = require('fs');
const path = require('path');

class DocumentSyncManager {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.prdPath = path.join(this.rootDir, 'PRD.md');
    this.customizationsPath = path.join(this.rootDir, 'USER_CUSTOMIZATIONS.md');
    this.changelogPath = path.join(this.rootDir, 'CHANGELOG.md');
  }

  async syncDocuments() {
    console.log('📋 문서 동기화 시작...\n');

    try {
      // 1. 파일 존재 확인
      this.verifyFiles();

      // 2. 문서 파싱
      const customizations = this.parseCustomizations();
      const prd = this.parsePRD();

      // 3. 일관성 검증
      const inconsistencies = this.findInconsistencies(customizations, prd);

      // 4. 결과 출력
      this.reportResults(inconsistencies);

      // 5. 자동 수정 제안
      if (inconsistencies.length > 0) {
        this.suggestFixes(inconsistencies);
      }

      // 6. CHANGELOG 업데이트
      this.updateChangelog(customizations);

    } catch (error) {
      console.error('❌ 문서 동기화 중 오류 발생:', error.message);
      process.exit(1);
    }
  }

  verifyFiles() {
    const files = [
      { path: this.prdPath, name: 'PRD.md' },
      { path: this.customizationsPath, name: 'USER_CUSTOMIZATIONS.md' }
    ];

    for (const file of files) {
      if (!fs.existsSync(file.path)) {
        throw new Error(`${file.name} 파일을 찾을 수 없습니다: ${file.path}`);
      }
    }

    console.log('✅ 모든 필수 문서 파일 확인 완료');
  }

  parseCustomizations() {
    const content = fs.readFileSync(this.customizationsPath, 'utf8');
    
    // 구현된 기능 추출
    const implementedFeatures = [];
    const lines = content.split('\n');
    
    let inImplementedSection = false;
    for (const line of lines) {
      if (line.includes('### ✅ 구현된 세부 기능')) {
        inImplementedSection = true;
        continue;
      }
      if (line.startsWith('###') && !line.includes('구현된 세부 기능')) {
        inImplementedSection = false;
      }
      if (inImplementedSection && line.startsWith('- [x]')) {
        const feature = line.replace('- [x]', '').trim();
        implementedFeatures.push(feature);
      }
    }

    // 해결된 기술 이슈 추출
    const resolvedIssues = [];
    let inResolvedSection = false;
    for (const line of lines) {
      if (line.includes('## 해결된 기술적 이슈들')) {
        inResolvedSection = true;
        continue;
      }
      if (line.startsWith('##') && !line.includes('해결된 기술적 이슈들')) {
        inResolvedSection = false;
      }
      if (inResolvedSection && line.startsWith('- **')) {
        const issue = line.replace('- **', '').split('**:')[0];
        resolvedIssues.push(issue);
      }
    }

    return {
      implementedFeatures,
      resolvedIssues,
      lastUpdate: this.extractLastUpdate(content)
    };
  }

  parsePRD() {
    const content = fs.readFileSync(this.prdPath, 'utf8');
    
    // PRD에서 주요 기능 추출 (향후 구현)
    const features = [];
    const requirements = [];

    return {
      features,
      requirements,
      lastUpdate: this.extractLastUpdate(content)
    };
  }

  extractLastUpdate(content) {
    const match = content.match(/\*마지막 업데이트: (.+)\*/);
    return match ? match[1] : 'Unknown';
  }

  findInconsistencies(customizations, prd) {
    const inconsistencies = [];

    // 날짜 비교
    if (customizations.lastUpdate !== prd.lastUpdate) {
      inconsistencies.push({
        type: 'date_mismatch',
        message: `문서 업데이트 날짜 불일치 - Customizations: ${customizations.lastUpdate}, PRD: ${prd.lastUpdate}`
      });
    }

    // TODO: 추가 일관성 검사 로직 구현

    return inconsistencies;
  }

  reportResults(inconsistencies) {
    console.log('\n📊 동기화 검증 결과:');
    console.log('─'.repeat(50));

    if (inconsistencies.length === 0) {
      console.log('✅ 모든 문서가 동기화되어 있습니다!');
    } else {
      console.log(`❌ ${inconsistencies.length}개의 불일치 발견:`);
      inconsistencies.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.message}`);
      });
    }
  }

  suggestFixes(inconsistencies) {
    console.log('\n🔧 자동 수정 제안:');
    console.log('─'.repeat(50));

    inconsistencies.forEach((issue, index) => {
      if (issue.type === 'date_mismatch') {
        console.log(`  ${index + 1}. 두 문서의 업데이트 날짜를 현재 시간으로 통일하시겠습니까?`);
      }
    });

    console.log('\n💡 수동으로 수정하거나 --fix 옵션을 사용하세요.');
  }

  updateChangelog(customizations) {
    const today = new Date().toISOString().split('T')[0];
    
    let changelog = '';
    if (fs.existsSync(this.changelogPath)) {
      changelog = fs.readFileSync(this.changelogPath, 'utf8');
    } else {
      changelog = '# CHANGELOG\n\n';
    }

    // 새로운 변경사항이 있는지 확인
    if (customizations.implementedFeatures.length > 0) {
      const newEntry = `## [${today}] - UI 개선 및 기능 구현\n\n### ✅ 완료된 기능\n`;
      const featureList = customizations.implementedFeatures
        .map(feature => `- ${feature}`)
        .join('\n');
      
      // 이미 오늘 날짜의 엔트리가 있는지 확인
      if (!changelog.includes(`## [${today}]`)) {
        changelog = changelog.replace('# CHANGELOG\n\n', `# CHANGELOG\n\n${newEntry}${featureList}\n\n`);
        
        fs.writeFileSync(this.changelogPath, changelog);
        console.log(`\n📝 CHANGELOG.md 업데이트 완료 (${today})`);
      }
    }
  }

  // Git hook용 간단한 검증 메서드
  async verifyOnly() {
    try {
      this.verifyFiles();
      const customizations = this.parseCustomizations();
      const prd = this.parsePRD();
      const inconsistencies = this.findInconsistencies(customizations, prd);
      
      if (inconsistencies.length > 0) {
        console.log(`⚠️  ${inconsistencies.length}개의 문서 불일치 발견 (커밋은 허용)`);
        return true; // Git hook에서는 경고만 하고 계속 진행
      }
      
      console.log('✅ 문서 동기화 상태 양호');
      return true;
    } catch (error) {
      console.error('❌ 문서 검증 실패:', error.message);
      return false;
    }
  }

  // Post-commit용 CHANGELOG만 업데이트
  async changelogOnly() {
    try {
      this.verifyFiles();
      const customizations = this.parseCustomizations();
      this.updateChangelog(customizations);
      return true;
    } catch (error) {
      console.error('❌ CHANGELOG 업데이트 실패:', error.message);
      return false;
    }
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const syncManager = new DocumentSyncManager();

  if (args.includes('--verify-only')) {
    // 검증만 수행 (Git hook용)
    syncManager.verifyOnly();
  } else if (args.includes('--changelog-only')) {
    // CHANGELOG만 업데이트 (post-commit용)
    syncManager.changelogOnly();
  } else {
    // 전체 동기화
    syncManager.syncDocuments();
  }
}

module.exports = DocumentSyncManager;