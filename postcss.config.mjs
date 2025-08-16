/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // 프로덕션에서 CSS 최적화 비활성화 (품질 보존)
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          // CSS 압축 최소화로 품질 보존
          normalizeWhitespace: false,
          colormin: false,
          minifyFontValues: false,
          minifySelectors: false,
          reduceIdents: false,
          zindex: false,
        }]
      }
    })
  },
};

export default config;