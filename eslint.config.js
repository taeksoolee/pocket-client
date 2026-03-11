import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // 1. 제외할 폴더들 (기존 .eslintignore 역할)
  {
    ignores: ['node_modules/', 'dev/', 'dist/', 'pocket-api/', 'build.js', 'dev.js'],
  },

  // 2. 기본 추천 룰셋 적용
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. 커스텀 룰 및 Prettier 충돌 방지
  {
    rules: {
      // 우리가 Hono JSX Layout 등에서 불가피하게 any를 쓸 때 에러 대신 경고만 띄움
      '@typescript-eslint/no-explicit-any': 'warn',
      // 안 쓰는 변수도 에러 대신 경고로 (개발 중 피로도 감소)
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  // 4. Prettier 룰을 맨 마지막에 덮어씌워서 포맷팅 충돌 방지
  eslintConfigPrettier
);
