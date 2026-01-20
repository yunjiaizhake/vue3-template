import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/music',
  },
  {
    path: '/music',
    component: () => import('@/pages/music.vue'),
    redirect: '/music/playlist',
    children: [
      {
        path: '/music/playlist', // 正在播放列表
        component: () => import('@/pages/playList/index.vue'),
        meta: {
          keepAlive: true,
        },
      },
      {
        path: '/music/userlist', // 我的歌单
        component: () => import('@/pages/userList/index.vue'),
        meta: {
          title: '我的歌单',
          keepAlive: true,
        },
      },
      {
        path: '/music/toplist', // 排行榜列表
        component: () => import('@/pages/topList/index.vue'),
        meta: {
          title: '排行榜',
          keepAlive: true,
        },
      },
      {
        path: '/music/details/:id', // 音乐详情列表
        component: () => import('@/pages/details/index.vue'),
      },
      {
        path: '/music/historylist', // 我听过的列表
        component: () => import('@/pages/historyList/index.vue'),
        meta: {
          title: '我听过的',
        },
      },
      {
        path: '/music/favoritelist', // 收藏列表
        component: () => import('@/pages/favoriteList/index.vue'),
        meta: {
          title: '我收藏的',
        },
      },
      {
        path: '/music/search', // 搜索
        component: () => import('@/pages/search/index.vue'),
        meta: {
          title: '搜索',
          keepAlive: true,
        },
      },
      {
        path: '/music/comment/:id', // 音乐评论
        component: () => import('@/pages/comment/index.vue'),
        meta: {
          title: '评论详情',
          keepAlive: true,
        },
      },
      {
        path: '/music/ai-chat', // AI 聊天 (本地)
        component: () => import('@/pages/aiChatLocal/index.vue'),
        meta: {
          title: 'AI 助手(本地)',
          keepAlive: true,
        },
      },
      {
        path: '/music/ai-chat-online', // AI 聊天 (在线)
        component: () => import('@/pages/aiChatOnline/index.vue'),
        meta: {
          title: 'AI 助手(在线)',
          keepAlive: true,
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 匹配到当前路由后给 router-link 设置active类
  linkActiveClass: 'active',
  linkExactActiveClass: 'active',
});
// 3. 导出
export default router;
