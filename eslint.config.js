import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['node_modules/', 'dev/', 'dist/', 'build.js', 'dev.js'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // 💡 플러그인 등록 (Flat Config 방식)
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      // --- 기존 룰 ---
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'no-console': 'warn',
      curly: ['error', 'all'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // --- 🚀 새로 추가된 Import 관리 룰 ---

      // 1. Import 자동 정렬 (node 내장 모듈 -> 외부 패키지 -> 내부 파일 순으로 예쁘게 정렬됨)
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // 2. 안 쓰는 Import 및 변수 자동 제거
      // 주의: 기존 no-unused-vars를 끄고(off), unused-imports 플러그인 룰로 대체해야 충돌이 안 남!
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error', // 안 쓰는 import문은 아예 빨간줄 그고 fix 시 삭제
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
    },
  },

  // Prettier는 항상 맨 마지막에!
  eslintConfigPrettier,
];
