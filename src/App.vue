<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { Box, ChevronRight, Grid2X2, PanelsTopLeft, Sparkles } from '@lucide/vue';

const route = useRoute();
const navItems = [
  { label: 'Flex 布局', description: '一维布局模型', to: '/flex', icon: PanelsTopLeft },
  { label: 'Grid 布局', description: '二维网格系统', to: '/grid', icon: Grid2X2 },
];
const currentLabel = computed(() => (route.path.includes('grid') ? 'Grid 布局' : 'Flex 布局'));
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark"><Box :size="18" :stroke-width="2.5" /></div>
        <div><strong>Layout Lab</strong><span>CSS playground</span></div>
      </div>

      <div class="sidebar-section">
        <p class="eyebrow">课程目录</p>
        <nav class="course-nav" aria-label="布局课程">
          <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="course-link" :class="{ active: route.path === item.to }">
            <component :is="item.icon" :size="17" />
            <span class="course-link-copy"><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span>
            <ChevronRight class="course-link-arrow" :size="15" />
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-tip">
        <div class="tip-icon"><Sparkles :size="15" /></div>
        <div><strong>边改边学</strong><p>调整左侧属性，观察右侧布局的实时变化。</p></div>
      </div>
      <div class="sidebar-footer"><span class="status-dot"></span><span>交互式课程 · 进行中</span></div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div class="breadcrumb"><span>CSS 布局基础</span><ChevronRight :size="14" /><strong>{{ currentLabel }}</strong></div>
        <div class="topbar-badge"><span class="status-dot"></span> Live playground</div>
      </header>
      <div class="page-container"><RouterView /></div>
    </main>
  </div>
</template>
