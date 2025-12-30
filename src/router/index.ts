// 1. 导入
import { createRouter, createWebHistory } from 'vue-router';
// 2. 创建路由对象
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      component: () => import('@/components/HelloWorld.vue'),
    },
  ],
});
// 3. 导出
export default router;
