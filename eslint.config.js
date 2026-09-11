import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

const threeOnlyInWebgl = {
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['src/webgl/**'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['three', 'three/*', '@react-three/*'], message: 'Only src/webgl may import three or @react-three/*. Keep the WebGL chunk out of the critical path.' },
        ],
      },
    ],
  },
}

export default tseslint.config(
  { ignores: ['dist', 'dist-ssr', 'node_modules', 'art', 'docs', '.claude', '.agents', '.impeccable'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  threeOnlyInWebgl,
)
