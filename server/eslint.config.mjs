import antfu from '@antfu/eslint-config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default antfu(
  {
    typescript: true,
    lessOpinionated: true,
    isInEditor: false,
    stylistic: {
      semi: true,
    },
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', 'generated'],
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    rules: {
      'ts/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'perfectionist/sort-imports': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      'style/brace-style': ['error', '1tbs'],
      'node/prefer-global/process': 'off',
    },
  },
);
