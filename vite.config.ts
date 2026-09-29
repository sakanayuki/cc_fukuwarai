import { defineConfig } from 'vitest/config';

// GitHub Pages のサブパス(/<repo>/)でも動くよう、相対パスでビルドする
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  test: { include: ['src/**/*.test.ts'] },
});
