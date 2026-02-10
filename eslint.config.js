import jsdoc from 'eslint-plugin-jsdoc';

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'src/types/supabase.ts', 'src/types/supabase.d.ts'] },

  // Configuração base para todos os arquivos TS/TSX
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // no-explicit-any como warning (335 ocorrências - refatoração gradual)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Permitir variáveis prefixadas com _ (padrão para não-usadas intencionalmente)
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },

  // JSDoc apenas para services e hooks (pragmático)
  {
    files: ['src/services/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}'],
    plugins: {
      'jsdoc': jsdoc,
    },
    rules: {
      'jsdoc/require-jsdoc': ['warn', {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
          FunctionExpression: false,
        },
        publicOnly: true,
      }],
      'jsdoc/require-description': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns-description': 'warn',
    },
  },
);
