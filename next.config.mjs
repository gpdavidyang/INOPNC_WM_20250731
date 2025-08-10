import { withSentryConfig } from '@sentry/nextjs'
import withBundleAnalyzer from '@next/bundle-analyzer'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // TypeScript 빌드 최적화
  typescript: {
    // 빌드 중 타입 에러 무시 (개발 중에만 체크)
    ignoreBuildErrors: true,
  },
  
  // ESLint 빌드 최적화
  eslint: {
    // 빌드 중 ESLint 에러 무시 (개발 중에만 체크)
    ignoreDuringBuilds: true,
  },
  
  // SWC 컴파일러 최적화
  swcMinify: true,
  
  // 실험적 기능으로 빌드 성능 향상
  experimental: {
    
    // 메모리 캐시 최적화 - 더 많은 패키지 추가
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@supabase/ssr',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
    ],
    
    // 개발 서버 성능 향상
    serverComponentsExternalPackages: ['canvas', 'sharp'],
    
    // Fast Refresh 최적화
    optimisticClientCache: true,
    
    // Instrumentation hook 비활성화 (개발 모드에서)
    instrumentationHook: process.env.NODE_ENV === 'production',
  },
  
  // 개발 서버 최적화
  devIndicators: {
    buildActivity: false, // 빌드 인디케이터 비활성화로 성능 향상
  },
  
  // 컴파일 성능 향상
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  
  // 이미지 최적화
  images: {
    domains: ['localhost', 'your-supabase-url.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // PWA 지원을 위한 설정
  headers: async () => {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // 번들 크기 분석 (필요시에만 활성화)
  // bundleAnalyzer: process.env.ANALYZE === 'true',
}

// Wrap the config with Sentry and Bundle Analyzer
export default bundleAnalyzer(
  withSentryConfig(
    nextConfig,
    {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    },
    {
      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
      widenClientFileUpload: true,
      transpileClientSDK: true,
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    }
  )
)