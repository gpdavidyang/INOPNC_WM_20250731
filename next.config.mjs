import { withSentryConfig } from '@sentry/nextjs'
import withBundleAnalyzer from '@next/bundle-analyzer'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // CRITICAL: Disable all optimizations that degrade visual quality
  // This configuration prioritizes visual fidelity over file size
  
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
  
  // DISABLE SWC minification to prevent quality degradation
  swcMinify: false, // Disabled to maintain visual quality
  // 프로덕션 빌드 품질 개선을 위한 추가 설정
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production' && process.env.ENABLE_SOURCE_MAPS === 'true',
  
  // DISABLE compression to prevent quality loss
  compress: false, // Disabled - CDN transformation prevention
  poweredByHeader: false,
  generateEtags: true, // 캐싱 최적화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Webpack configuration - DISABLE aggressive optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    if (!dev) {
      // REDUCE optimization to prevent quality loss
      config.optimization.minimize = false; // Disable minification
      
      // DISABLE CSS extraction optimization
      config.plugins = config.plugins.filter(
        (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
      );
      
      // DISABLE Terser minification
      if (config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.filter(
          (minimizer) => minimizer.constructor.name !== 'TerserPlugin'
        );
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
    
    // DISABLE CSS optimization to prevent style loss
    optimizeCss: false,
    
    // DISABLE server minification
    serverMinification: false,
    
    // DISABLE font fallback adjustments
    adjustFontFallbacks: false,
  },
  
  // 개발 서버 최적화
  devIndicators: {
    buildActivity: false, // 빌드 인디케이터 비활성화로 성능 향상
  },
  
  // 컴파일 성능 향상
  compiler: {
    // KEEP console for debugging quality issues
    removeConsole: false,
    // KEEP React properties for debugging
    reactRemoveProperties: false,
  },
  
  
  // CRITICAL: Disable image optimization to prevent color/quality degradation
  images: {
    // REMOVE AVIF/WebP to prevent color space issues
    formats: ['image/png', 'image/jpeg'], // Original formats only
    domains: ['localhost', 'yjtnpscnnsnvfsyvajku.supabase.co'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24시간 캐시
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true, // DISABLE optimization - maintain original quality
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
  
  // DISABLE font optimization to prevent subsetting issues
  optimizeFonts: false,
  
  // PWA 지원을 위한 설정
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-transform', // Prevent CDN/proxy transformation
          },
          {
            key: 'Accept-CH',
            value: 'DPR, Viewport-Width, Width', // High DPI hints
          },
        ],
      },
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, no-transform',
          },
        ],
      },
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, no-transform',
          },
        ],
      },
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
            value: 'public, max-age=31536000, immutable, no-transform',
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