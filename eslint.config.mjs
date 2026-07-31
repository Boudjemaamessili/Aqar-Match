import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Zero Tolerance: ممنوع any — إلا بتعليل موثّق في تعليق (تُراجع يدوياً)
      '@typescript-eslint/no-explicit-any': 'error'
    }
  },
  globalIgnores(['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'])
]);
