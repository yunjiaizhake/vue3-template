/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

// 定义环境变量类型,interface是追加类型，不会覆盖原有的，会在原有的后面追加
interface ImportMetaEnv {
  readonly VUE_APP_BASE_API_URL: string;
}
