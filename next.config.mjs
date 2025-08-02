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
    // 병렬 라우트 빌드
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
    
    // 메모리 캐시 최적화
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
      'date-fns',
    ],
  },
  
  // 이미지 최적화
  images: {
    domains: ['localhost', 'your-supabase-url.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // 번들 크기 분석 (필요시에만 활성화)
  // bundleAnalyzer: process.env.ANALYZE === 'true',
}

export default nextConfig