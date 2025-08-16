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
  
  // SWC 컴파일러 최적화 - 품질 우선으로 변경
  swcMinify: false, // 품질 저하 방지를 위해 비활성화
  // 프로덕션 빌드 품질 개선을 위한 추가 설정
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production' && process.env.ENABLE_SOURCE_MAPS === 'true',
  
  // Webpack 설정으로 압축 최적화 제어
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // 프로덕션에서 CSS/JS 압축으로 인한 품질 저하 방지
    if (!dev) {
      config.optimization.minimizer = config.optimization.minimizer.map((minimizer) => {
        // Terser 압축기 설정 최적화
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: {
              ...minimizer.options.terserOptions.compress,
              // CSS 관련 압축 완전 비활성화
              pure_funcs: [],
              drop_console: false,
              drop_debugger: false,
              // 폰트 및 CSS 품질 보존
              keep_fnames: true,
              keep_classnames: true,
              // 색상값 압축 비활성화
              unsafe_arrows: false,
              unsafe_comps: false,
              unsafe_math: false,
              unsafe_proto: false,
              unsafe_regexp: false,
              unsafe_undefined: false,
            },
            mangle: {
              // 클래스명과 함수명 보존
              keep_classnames: true,
              keep_fnames: true,
            },
            format: {
              // 코드 포맷팅 품질 유지
              comments: false,
              beautify: false,
              // 세미콜론과 공백 보존
              semicolons: true,
              preserve_annotations: true,
            }
          }
        }
        
        // CSS 압축기 설정 최적화
        if (minimizer.constructor.name === 'CssMinimizerPlugin') {
          minimizer.options.minimizerOptions = {
            ...minimizer.options.minimizerOptions,
            preset: ['default', {
              // 폰트 및 색상 최적화 비활성화
              normalizeWhitespace: false,
              colormin: false,
              minifyFontValues: false,
              minifySelectors: false,
              reduceIdents: false,
              zindex: false,
              // 그라데이션 및 이미지 최적화 비활성화
              normalizeUrl: false,
              normalizeUnicode: false,
              mergeLonghand: false,
              mergeRules: false,
              convertValues: false,
              discardDuplicates: false,
            }]
          }
        }
        
        return minimizer
      })
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
    
    // Instrumentation hook 비활성화 (개발 모드에서)
    instrumentationHook: process.env.NODE_ENV === 'production',
    
    // CSS 최적화 비활성화 (품질 보존)
    optimizeCss: false,
  },
  
  // 개발 서버 최적화
  devIndicators: {
    buildActivity: false, // 빌드 인디케이터 비활성화로 성능 향상
  },
  
  // 컴파일 성능 향상
  compiler: {
    // 프로덕션에서도 중요한 로그는 유지하도록 개선
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'] // error, warn 로그는 프로덕션에서도 유지
    } : false,
    // 스타일 최적화 비활성화 (품질 보존)
    styledComponents: false,
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
  
  // 프로덕션 폰트 렌더링 최적화
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