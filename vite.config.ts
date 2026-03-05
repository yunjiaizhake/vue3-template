import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  console.log('当前运行模式 mode:', mode);

  const env = loadEnv(mode, process.cwd());
  console.log('加载到的环境变量 env:', env);

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/types/auto-imports.d.ts',
        eslintrc: { enabled: true, filepath: './.eslintrc-auto-import.json' },
      }),
    ],
    css: {
      preprocessorOptions: {
        less: {
          additionalData: `@import "src/styles/var.less"; @import "src/styles/mixin.less";`,
        },
      },
    },
    resolve: { alias: { '@': resolve(__dirname, './src') } },
  };
});
