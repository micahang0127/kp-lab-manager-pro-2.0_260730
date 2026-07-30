import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts', 'coverage', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'src/test/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔒 보안/안정성 규칙 (error - 필수)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // Promise 처리 강제
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // 타입 안전성
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',        // ✅ 엄격 (API 응답)
      '@typescript-eslint/no-unsafe-member-access': 'warn',      // ⚠️ 유연 (외부 lib 타입 불완전)
      '@typescript-eslint/no-unsafe-return': 'warn',             // ⚠️ 유연 (외부 lib 반환 타입)

      // 코드 주입 방지
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // 디버깅 코드 제거 (프로덕션 배포 시 필수)
      'no-debugger': 'error',

      // 타입 안전한 비교
      'eqeqeq': ['error', 'always'],

      // 의도하지 않은 코드 실행 방지
      'unused-imports/no-unused-imports': 'error',

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⚡ 개발 생산성 (warn - 유연함)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // 콘솔 출력 제한 (warn - 개발/배포 모두 지원)
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Import/Export 정렬 (자동 수정 가능)
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',

      // 사용하지 않는 변수
      'unused-imports/no-unused-vars': ['warn', {
        vars: 'all', varsIgnorePattern: '^_',
        args: 'after-used', argsIgnorePattern: '^_',
      }],

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔧 기타 규칙
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      // TanStack Router의 redirect() 패턴 고려
      '@typescript-eslint/only-throw-error': 'warn',
    },
  },
])
