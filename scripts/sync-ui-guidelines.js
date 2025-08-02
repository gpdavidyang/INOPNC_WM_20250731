#!/usr/bin/env node

/**
 * UI Guidelines 동기화 스크립트
 * UI_Guidelines.md 파일을 파싱하여 UI_Guidelines.json으로 변환
 */

const fs = require('fs');
const path = require('path');

const MD_FILE = path.join(__dirname, '..', 'UI_Guidelines.md');
const JSON_FILE = path.join(__dirname, '..', 'UI_Guidelines.json');

class UIGuidelinesSync {
  constructor() {
    this.jsonData = {
      title: "INOPNC Work Management System - UI Guidelines",
      version: "",
      lastUpdated: new Date().toISOString().split('T')[0],
      designPhilosophy: {},
      colorSystem: {},
      typography: {},
      spacing: {},
      components: {},
      animations: {},
      accessibility: {},
      constructionIndustrySpecifics: {},
      responsive: {},
      performance: {},
      implementation: {},
      dependencies: {}
    };
  }

  /**
   * MD 파일 읽기 및 파싱
   */
  async syncGuidelines() {
    try {
      console.log('📖 Reading UI_Guidelines.md...');
      const mdContent = fs.readFileSync(MD_FILE, 'utf8');
      
      console.log('🔄 Parsing markdown content...');
      this.parseMarkdown(mdContent);
      
      console.log('💾 Writing UI_Guidelines.json...');
      fs.writeFileSync(JSON_FILE, JSON.stringify(this.jsonData, null, 2));
      
      console.log('✅ UI Guidelines synchronized successfully!');
      console.log(`   Version: ${this.jsonData.version}`);
      console.log(`   Updated: ${this.jsonData.lastUpdated}`);
    } catch (error) {
      console.error('❌ Error syncing UI Guidelines:', error.message);
      process.exit(1);
    }
  }

  /**
   * Markdown 파싱 (간단한 구현)
   * 실제 프로젝트에서는 더 정교한 파싱이 필요할 수 있습니다.
   */
  parseMarkdown(content) {
    // 버전 추출
    const versionMatch = content.match(/v(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      this.jsonData.version = versionMatch[1];
    }

    // 섹션별 파싱 (예시)
    this.parseDesignPhilosophy(content);
    this.parseColorSystem(content);
    this.parseTypography(content);
    // ... 추가 섹션 파싱
  }

  parseDesignPhilosophy(content) {
    const philosophySection = this.extractSection(content, '## Design Philosophy', '## Color System');
    if (philosophySection) {
      // Core Principles 추출
      const principlesMatch = philosophySection.match(/### Core Principles([\s\S]*?)###/);
      if (principlesMatch) {
        const principles = principlesMatch[1].match(/\d+\.\s\*\*(.+?)\*\*:\s(.+)/g);
        if (principles) {
          this.jsonData.designPhilosophy.corePrinciples = principles.map(p => {
            const [, name, description] = p.match(/\d+\.\s\*\*(.+?)\*\*:\s(.+)/);
            return { name, description };
          });
        }
      }
    }
  }

  parseColorSystem(content) {
    const colorSection = this.extractSection(content, '## Color System', '## Typography');
    if (colorSection) {
      // Primary Palette 추출
      const primaryMatch = colorSection.match(/--toss-blue-500:\s*(#[A-F0-9]+);/);
      if (primaryMatch) {
        this.jsonData.colorSystem.coreBrand = {
          tossBlue: {
            "500": primaryMatch[1],
            "600": this.extractColor(colorSection, '--toss-blue-600'),
            "700": this.extractColor(colorSection, '--toss-blue-700')
          }
        };
      }

      // Semantic Colors 추출
      this.jsonData.colorSystem.semantic = {
        success: this.extractColor(colorSection, '--success'),
        error: this.extractColor(colorSection, '--error'),
        warning: this.extractColor(colorSection, '--warning'),
        info: this.extractColor(colorSection, '--info')
      };
    }
  }

  parseTypography(content) {
    const typographySection = this.extractSection(content, '## Typography', '## Spacing System');
    if (typographySection) {
      // Font Stack 추출
      const fontMatch = typographySection.match(/font-family:\s*(.+);/);
      if (fontMatch) {
        this.jsonData.typography.fontStack = fontMatch[1].trim();
      }
    }
  }

  /**
   * 섹션 추출 헬퍼
   */
  extractSection(content, startMarker, endMarker) {
    const startIndex = content.indexOf(startMarker);
    const endIndex = endMarker ? content.indexOf(endMarker, startIndex) : content.length;
    
    if (startIndex === -1) return null;
    
    return content.substring(startIndex, endIndex);
  }

  /**
   * 색상 값 추출 헬퍼
   */
  extractColor(content, colorVar) {
    const match = content.match(new RegExp(`${colorVar}:\\s*(#[A-F0-9]+);`, 'i'));
    return match ? match[1] : null;
  }
}

// 실행
const sync = new UIGuidelinesSync();
sync.syncGuidelines();