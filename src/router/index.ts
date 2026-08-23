import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/flex' },
    { path: '/home', redirect: '/flex' },
    { path: '/flex', component: () => import('@/views/FlexPlayground.vue') },
    { path: '/grid', component: () => import('@/views/GridPlayground.vue') },
  ],
});

export default router;
