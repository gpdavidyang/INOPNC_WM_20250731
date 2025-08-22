#!/usr/bin/env node

/**
 * 파일 변경 감지 및 자동 문서 동기화
 * 개발 중 USER_CUSTOMIZATIONS.md 변경 시 자동으로 동기화 실행
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AutoSyncWatcher {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.watchedFiles = [
      path.join(this.rootDir, 'USER_CUSTOMIZATIONS.md'),
      path.join(this.rootDir, 'PRD.md')
    ];
    this.syncInProgress = false;
    this.syncCooldown = 5000; // 5초 쿨다운
    this.lastSyncTime = 0;
  }

  start() {
    console.log('🔍 문서 변경 감지 시작...');
    console.log('감시 중인 파일:');
    this.watchedFiles.forEach(file => {
      console.log(`  - ${path.basename(file)}`);
    });
    console.log('\n변경사항이 감지되면 자동으로 문서를 동기화합니다.');
    console.log('종료하려면 Ctrl+C를 누르세요.\n');

    this.watchedFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.watchFile(file, { interval: 1000 }, (curr, prev) => {
          if (curr.mtime > prev.mtime) {
            this.handleFileChange(file);
          }
        });
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 문서 감시 종료');
      process.exit(0);
    });
  }

  async handleFileChange(filePath) {
    const fileName = path.basename(filePath);
    const now = Date.now();

    // 쿨다운 체크
    if (now - this.lastSyncTime < this.syncCooldown) {
      return;
    }

    // 이미 동기화 중인 경우 스킵
    if (this.syncInProgress) {
      return;
    }

    console.log(`📝 ${fileName} 변경 감지`);
    
    this.syncInProgress = true;
    this.lastSyncTime = now;

    try {
      await this.runSync();
    } catch (error) {
      console.error('❌ 자동 동기화 실패:', error.message);
    } finally {
      this.syncInProgress = false;
    }
  }

  runSync() {
    return new Promise((resolve, reject) => {
      console.log('🔄 자동 문서 동기화 실행 중...');
      
      exec('npm run docs:sync', { cwd: this.rootDir }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        console.log(stdout);
        if (stderr) {
          console.warn(stderr);
        }
        
        console.log('✅ 자동 동기화 완료\n');
        resolve();
      });
    });
  }
}

// CLI 실행
if (require.main === module) {
  const watcher = new AutoSyncWatcher();
  watcher.start();
}

module.exports = AutoSyncWatcher;