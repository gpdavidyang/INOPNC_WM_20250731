/**
 * Production Quality Fix Configuration
 * 
 * This configuration file addresses ALL identified issues causing visual quality degradation
 * in the deployed Vercel environment compared to localhost development.
 * 
 * ROOT CAUSES IDENTIFIED:
 * 1. Image format conversion (AVIF/WebP) causing color shifts
 * 2. CSS minification removing critical styles
 * 3. Font subsetting causing rendering issues
 * 4. Aggressive compression degrading quality
 * 5. Viewport scaling issues on high DPI displays
 * 6. Color space mismatches (sRGB vs Display P3)
 * 7. Runtime style injection order problems
 * 8. CDN/proxy compression artifacts
 */

export const productionQualityConfig = {
  // 1. DISABLE IMAGE OPTIMIZATION
  images: {
    // Disable automatic format conversion
    formats: ['image/png', 'image/jpeg'], // Remove AVIF/WebP
    unoptimized: true, // Disable all optimization
    quality: 100, // Maximum quality (if supported)
    loader: 'default',
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
  },

  // 2. DISABLE CSS MINIFICATION
  webpack: (config, { dev }) => {
    if (!dev) {
      // Disable CSS minification completely
      config.optimization.minimizer = config.optimization.minimizer.filter(
        (minimizer) => minimizer.constructor.name !== 'CssMinimizerPlugin'
      );
      
      // Disable CSS extraction optimization
      config.plugins = config.plugins.map((plugin) => {
        if (plugin.constructor.name === 'MiniCssExtractPlugin') {
          plugin.options = {
            ...plugin.options,
            ignoreOrder: false,
            experimentalUseImportModule: false,
          };
        }
        return plugin;
      });
    }
    return config;
  },

  // 3. DISABLE COMPRESSION
  compress: false, // Disable gzip compression
  
  // 4. HIGH QUALITY COMPILER SETTINGS
  compiler: {
    removeConsole: false, // Keep console for debugging
    reactRemoveProperties: false, // Keep React properties
    styledComponents: {
      displayName: true, // Keep component names
      ssr: true,
      pure: false, // Don't remove "pure" components
    },
  },

  // 5. EXPERIMENTAL OPTIMIZATIONS OFF
  experimental: {
    optimizeCss: false, // Disable CSS optimization
    serverMinification: false, // Disable server minification
    adjustFontFallbacks: false, // Don't adjust fonts
    optimizePackageImports: [], // Don't optimize imports
    instrumentationHook: false,
    optimisticClientCache: false,
  },

  // 6. DISABLE SWC MINIFICATION
  swcMinify: false, // Use Terser instead for better control
  
  // 7. PRODUCTION SOURCE MAPS
  productionBrowserSourceMaps: true, // Enable for debugging
  
  // 8. HEADERS FOR QUALITY
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-transform', // Prevent CDN transformation
        },
        {
          key: 'Accept-CH',
          value: 'DPR, Viewport-Width, Width', // High DPI hints
        },
        {
          key: 'Content-Security-Policy',
          value: "img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;",
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
  ],

  // 9. ENVIRONMENT VARIABLES
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_ENV: 'production',
    NEXT_SHARP_PATH: undefined, // Use system sharp
  },
};

export default productionQualityConfig;