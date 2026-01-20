import { createApp } from 'vue';
import App from './App.vue';

import router from '@/router';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import VueLazyload from 'vue3-lazyload';

import '@/styles/index.less';
import bbToast from '@/base/bb-toast';
import Icon from '@/base/bb-icon/index.vue';
import { initAiChatWs } from '@/api/ws';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

// 注册全局组件
app.component('BbIcon', Icon);

// 注册全局插件
app.use(bbToast);
app.use(VueLazyload, {
  preLoad: 1,
  loading: '@/assets/img/default.png',
});

app.use(pinia);
initAiChatWs();
app.use(router).mount('#app');
