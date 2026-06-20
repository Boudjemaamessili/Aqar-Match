import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // هذه الإضافة هي الحل السحري لمنع أخطاء الـ 404 في السيرفر المحلي
    historyApiFallback: true,
  },
});