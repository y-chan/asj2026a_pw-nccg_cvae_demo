import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const config = [
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierRecommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: false,
        },
      ],
      'simple-import-sort/imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: ['./', '../', '~/'],
        },
      ],
    },
  },
]

export default config
