import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts', // 生成 TS 类型声明
      eslintrc: {
        enabled: true, // 生成 eslint 配置
        filepath: './.eslintrc-auto-import.json',
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "src/styles/var.less"; @import "src/styles/mixin.less";`,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
