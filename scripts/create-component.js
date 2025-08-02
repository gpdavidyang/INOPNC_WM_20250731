#!/usr/bin/env node

/**
 * UI 가이드라인을 준수하는 컴포넌트 자동 생성 스크립트
 * Usage: npm run create:component -- --name MyComponent --type card --mobile
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// UI 가이드라인 로드
const UI_GUIDELINES = require('../UI_Guidelines.json');

program
  .option('-n, --name <name>', 'Component name')
  .option('-t, --type <type>', 'Component type (button, card, form, list)', 'card')
  .option('-m, --mobile', 'Create mobile version')
  .option('-d, --domain <domain>', 'Domain (dashboard, daily-reports, materials)', 'dashboard')
  .parse();

const options = program.opts();

class ComponentGenerator {
  constructor(options) {
    this.name = options.name;
    this.type = options.type;
    this.isMobile = options.mobile;
    this.domain = options.domain;
    this.guidelines = UI_GUIDELINES;
  }

  generate() {
    if (!this.name) {
      console.error('❌ Component name is required');
      process.exit(1);
    }

    console.log(`🎨 Generating ${this.name} component...`);
    
    // 컴포넌트 디렉토리 생성
    const componentDir = this.getComponentPath();
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
    }

    // 파일 생성
    this.createComponentFile();
    this.createStyleFile();
    this.createTestFile();
    this.createStoryFile();

    console.log(`✅ Component ${this.name} created successfully!`);
    console.log(`📁 Location: ${componentDir}`);
  }

  getComponentPath() {
    const basePath = path.join(__dirname, '..', 'components');
    if (this.isMobile) {
      return path.join(basePath, 'mobile', this.domain);
    }
    return path.join(basePath, this.domain);
  }

  createComponentFile() {
    const template = this.getComponentTemplate();
    const filePath = path.join(this.getComponentPath(), `${this.name}.tsx`);
    fs.writeFileSync(filePath, template);
    console.log(`  ✓ Created ${this.name}.tsx`);
  }

  getComponentTemplate() {
    const { colorSystem, typography, spacing, components } = this.guidelines;
    
    // 타입별 기본 스타일 가져오기
    const baseStyles = this.getBaseStyles();
    
    return `'use client'

import { cn } from '@/lib/utils'
import { ${this.name}Props } from './types'

/**
 * ${this.name} 컴포넌트
 * UI Guidelines v${this.guidelines.version} 준수
 * 
 * @description ${this.type} 타입 컴포넌트
 * @domain ${this.domain}
 */
export function ${this.name}({ 
  className,
  children,
  variant = 'default',
  ...props 
}: ${this.name}Props) {
  return (
    <div
      className={cn(
        // Base styles from UI Guidelines
        "${baseStyles}",
        
        // Variant styles
        {
          'default': '',
          'emphasis': '${this.getEmphasisStyles()}',
        }[variant],
        
        // Dark mode support
        "dark:bg-gray-800 dark:border-gray-700",
        
        // Mobile optimization
        ${this.isMobile ? '"min-h-[56px] active:scale-95",' : ''}
        
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

${this.name}.displayName = '${this.name}'
`;
  }

  getBaseStyles() {
    const { components } = this.guidelines;
    
    switch (this.type) {
      case 'card':
        return components.cards.standard;
      case 'button':
        return components.buttonSystem.variants.primary;
      case 'form':
        return components.formControls.input;
      default:
        return "bg-white rounded-lg shadow-md p-4";
    }
  }

  getEmphasisStyles() {
    const { components } = this.guidelines;
    
    switch (this.type) {
      case 'card':
        return components.cards.emphasis;
      default:
        return "shadow-lg border-2";
    }
  }

  createStyleFile() {
    const template = `// ${this.name} 타입 정의
export interface ${this.name}Props {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'emphasis'
}

// 상수 정의
export const ${this.name.toUpperCase()}_VARIANTS = {
  default: 'default',
  emphasis: 'emphasis',
} as const

// 타입 export
export type ${this.name}Variant = keyof typeof ${this.name.toUpperCase()}_VARIANTS
`;

    const filePath = path.join(this.getComponentPath(), 'types.ts');
    fs.writeFileSync(filePath, template);
    console.log(`  ✓ Created types.ts`);
  }

  createTestFile() {
    const template = `import { render, screen } from '@testing-library/react'
import { ${this.name} } from './${this.name}'

describe('${this.name}', () => {
  it('renders correctly', () => {
    render(<${this.name}>Test Content</${this.name}>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<${this.name} className="custom-class">Test</${this.name}>)
    expect(screen.getByText('Test')).toHaveClass('custom-class')
  })

  it('renders with emphasis variant', () => {
    render(<${this.name} variant="emphasis">Test</${this.name}>)
    expect(screen.getByText('Test')).toHaveClass('shadow-lg')
  })

  // Accessibility tests
  it('meets accessibility standards', async () => {
    const { container } = render(<${this.name}>Accessible Content</${this.name}>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  ${this.isMobile ? `
  // Mobile-specific tests
  it('has minimum touch target size', () => {
    render(<${this.name}>Touch Target</${this.name}>)
    const element = screen.getByText('Touch Target')
    expect(element).toHaveClass('min-h-[56px]')
  })
  ` : ''}
})
`;

    const filePath = path.join(this.getComponentPath(), `${this.name}.test.tsx`);
    fs.writeFileSync(filePath, template);
    console.log(`  ✓ Created ${this.name}.test.tsx`);
  }

  createStoryFile() {
    const template = `import type { Meta, StoryObj } from '@storybook/react'
import { ${this.name} } from './${this.name}'

const meta = {
  title: '${this.domain}/${this.name}',
  component: ${this.name},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'UI Guidelines ${this.guidelines.version} 준수 ${this.type} 컴포넌트',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'emphasis'],
    },
  },
} satisfies Meta<typeof ${this.name}>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default ${this.name}',
  },
}

export const Emphasis: Story = {
  args: {
    children: 'Emphasis ${this.name}',
    variant: 'emphasis',
  },
}

export const DarkMode: Story = {
  args: {
    children: 'Dark Mode ${this.name}',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
}

${this.isMobile ? `
export const Mobile: Story = {
  args: {
    children: 'Mobile ${this.name}',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
` : ''}
`;

    const filePath = path.join(this.getComponentPath(), `${this.name}.stories.tsx`);
    fs.writeFileSync(filePath, template);
    console.log(`  ✓ Created ${this.name}.stories.tsx`);
  }
}

// 실행
const generator = new ComponentGenerator(options);
generator.generate();