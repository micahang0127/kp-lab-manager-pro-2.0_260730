/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Tailwind 기본 브레이크포인트(sm/md/lg/xl/2xl)를 전부 제거하고
    // 프로젝트 반응형 기준(모바일/태블릿/웹) 3단계로 완전 교체.
    // - mobile: 최소 360px (~767px, 태블릿 시작 전까지)
    // - tablet: 최소 768px (~1023px, 웹 시작 전까지)
    // - web:    최소 1024px (최대 제한 없음)
    // 360px 미만은 별도 강제(min-width 등) 없이 자연 축소되도록 둔다.
    screens: {
      mobile: '360px',
      tablet: '768px',
      web: '1024px',
    },
    extend: {},
  },
  plugins: [],
}
