// 扩展 Vue 全局属性类型声明
import 'vue';

declare module 'vue' {
  interface ComponentCustomProperties {
    $bbToast: (
      message: string,
      position?: 'top' | 'center' | 'bottom',
      duration?: number,
    ) => void;
  }
}
