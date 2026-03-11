import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // 1. Lint 검사에서 제외할 폴더 및 파일들
  {
    ignores: ['node_modules/', 'dev/', 'dist/', 'pocket-api/', 'build.js', 'dev.js'],
  },

  // 2. 기본 추천 룰셋 (ESLint & TypeScript-ESLint)
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. 커스텀 룰 (우리가 빡빡하게 잡을 규칙들)
  {
    rules: {
      // == 대신 무조건 === 사용 (JS의 기괴한 타입 변환 버그 원천 차단)
      eqeqeq: ['error', 'always'],

      // let으로 선언하고 재할당 안 한 변수를 자동으로 const로 변경 (메모리 최적화 및 의도 명확화)
      'prefer-const': 'error',

      // var 사용 금지 (호이스팅 지옥 방지, ES6 모던 JS의 기본)
      'no-var': 'error',

      // { data: data } 같은 형태를 { data } 로 짧게 쓰도록 강제 (코드 간결화 및 가독성 향상)
      'object-shorthand': 'error',

      // console.log 남겨두면 경고 (배포 전 디버깅 코드 지우기용. 에러로 막으면 개발할 때 짜증나니 warn 추천)
      'no-console': 'warn',

      // if문 등에서 중괄호 {} 생략 금지 (당장은 편해도 나중에 코드 한 줄 추가하다가 치명적인 버그 생기는 것 방지)
      curly: ['error', 'all'],

      // 타입만 가져올 때는 'import type' 사용 강제 (빌드 시 타입 코드를 깔끔하게 날려서 번들 용량 최적화)
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // any 타입 사용 시 에러 대신 경고만 (Hono JSX 레이아웃 등에서 불가피하게 any를 쓸 때 개발 피로도 감소)
      '@typescript-eslint/no-explicit-any': 'warn',

      // 선언해놓고 안 쓰는 변수 경고. 단, '_'로 시작하는 변수(예: _req)는 무시 (프레임워크 특성상 파라미터로 받아야만 하는 상황 대비)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // 4. Prettier 룰을 맨 마지막에 덮어씌워서 ESLint와 Prettier의 포맷팅 충돌 완벽 방지
  eslintConfigPrettier,
);
