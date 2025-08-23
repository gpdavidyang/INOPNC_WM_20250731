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
  
  // SWC 컴파일러 최적화 - 프로덕션 품질 향상
  swcMinify: true, // SWC minifier 활성화로 최적화된 빌드
  // 프로덕션 빌드 품질 개선을 위한 추가 설정
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production' && process.env.ENABLE_SOURCE_MAPS === 'true',
  
  // 프로덕션에서 적절한 압축 활성화 (성능과 품질 균형)
  compress: true, // gzip 압축 활성화
  poweredByHeader: false,
  generateEtags: true, // 캐싱 최적화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Webpack 설정 - 프로덕션 최적화 활성화
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // 프로덕션에서 필수 최적화만 적용
    if (!dev) {
      // 기본 최적화는 유지하되 과도한 압축은 제한
      config.optimization.minimize = true;
      
      // CSS 추출 플러그인 품질 보존 설정
      config.plugins = config.plugins.map((plugin) => {
        if (plugin.constructor.name === 'MiniCssExtractPlugin') {
          plugin.options = {
            ...plugin.options,
            // 프로덕션용 CSS 파일명 최적화
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].[contenthash].css',
            // CSS 품질 보존 옵션
            ignoreOrder: false,
          }
        }
        return plugin
      });
      
      // Terser 옵션 최적화 - 품질과 성능 균형
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                drop_console: true, // 프로덕션에서 콘솔 제거
                drop_debugger: true, // 디버거 제거
                pure_funcs: ['console.log', 'console.debug'], // 특정 함수만 제거
                passes: 2, // 압축 패스 횟수 증가로 최적화 향상
              },
              mangle: {
                safari10: true, // Safari 10 호환성
              },
              format: {
                ...minimizer.options.terserOptions?.format,
                comments: false,
                ascii_only: false, // Unicode 문자 보존
              },
              // 출력 품질 개선
              output: {
                ascii_only: false, // Unicode 보존
                comments: false,
                webkit: true, // WebKit 버그 회피
              },
            };
          }
        });
      }
    }
    
    return config
  },
  
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
    
    // Instrumentation hook 완전 비활성화 (성능 향상)
    instrumentationHook: false,
    
    // CSS 최적화 활성화 (프로덕션 품질 향상)
    optimizeCss: true,
    
    // 서버 최적화 활성화 (프로덕션 성능 향상)
    serverMinification: true,
    
    // 프리페치 최적화
    adjustFontFallbacks: true,
  },
  
  // 개발 서버 최적화
  devIndicators: {
    buildActivity: false, // 빌드 인디케이터 비활성화로 성능 향상
  },
  
  // 컴파일 성능 향상
  compiler: {
    // 프로덕션에서 콘솔 제거 (성능 향상)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info'] // error, warn, info는 유지
    } : false,
    // React 프로덕션 프로파일링 비활성화
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  
  // 이미지 최적화 - 프로덕션 품질 향상 설정
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost', 'yjtnpscnnsnvfsyvajku.supabase.co'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24시간 캐시
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false, // 최적화 활성화
    // 프로덕션 환경에서 최고 품질 보장을 위한 추가 설정
    loader: 'default',
    path: '/_next/image',
    // quality: 100, // Next.js 14에서 지원하지 않는 옵션 (주석 처리)
    // 배포 환경 품질 보장을 위한 추가 설정
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yjtnpscnnsnvfsyvajku.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
  
  // 프로덕션 폰트 렌더링 최적화 - 품질 보존을 위해 활성화
  optimizeFonts: true,
  
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

// Wrap the config with Bundle Analyzer only (Sentry 비활성화)
export default bundleAnalyzer(nextConfig)

// Sentry 래퍼 완전 제거하여 추가 최적화 방지
// export default bundleAnalyzer(
//   withSentryConfig(
//     nextConfig,
//     {
//       silent: true,
//       org: process.env.SENTRY_ORG,
//       project: process.env.SENTRY_PROJECT,
//     },
//     {
//       widenClientFileUpload: true,
//       transpileClientSDK: true,
//       hideSourceMaps: true,
//       disableLogger: true,
//       automaticVercelMonitors: true,
//     }
//   )
// )