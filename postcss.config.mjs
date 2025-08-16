/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // 개발 환경과 완전히 동일하게 - 모든 CSS 압축 비활성화
    // cssnano 완전히 제거하여 개발환경과 동일한 품질 보장
  },
};

export default config;