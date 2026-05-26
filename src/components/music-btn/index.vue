<template>
  <!--选项-->
  <div class="music-btn">
    <router-link to="/music/playlist" custom v-slot="{ navigate, isActive }">
      <span :class="{ active: isActive }" @click="navigate">正在播放</span>
    </router-link>
    <router-link to="/music/toplist" custom v-slot="{ navigate, isActive }">
      <span :class="{ active: isActive }" @click="navigate">推荐</span>
    </router-link>
    <router-link to="/music/search" custom v-slot="{ navigate, isActive }">
      <span :class="{ active: isActive }" @click="navigate">搜索</span>
    </router-link>
    <router-link to="/music/userlist" custom v-slot="{ navigate, isActive }">
      <span :class="{ active: isActive }" @click="navigate">我的歌单</span>
    </router-link>
    <span class="show-960" @click="$emit('onClickLyric')">歌词</span>
    <router-link to="/music/historylist" custom v-slot="{ navigate, isActive }">
      <span :class="{ active: isActive }" @click="navigate">我听过的</span>
    </router-link>
    <router-link to="/music/favoritelist" custom v-slot="{ navigate, isActive }">
      <span :class="{ active: isActive }" @click="navigate">我收藏的</span>
    </router-link>
    <router-link to="/music/creative-workshop" custom v-slot="{ navigate, isActive }">
      <span :class="{ active: isActive }" @click="navigate">创意工坊</span>
    </router-link>
    <router-link to="/music/ai-chat-online" custom v-slot="{ navigate, isActive }">
      <span :class="{ active: isActive }" @click="navigate">{{
        isOnline ? '音乐小助手' : '音乐小助手(离线)'
      }}</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
const isOnline = ref(navigator.onLine);

function handleOnline() {
  isOnline.value = true;
}

function handleOffline() {
  isOnline.value = false;
}

onMounted(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});
</script>

<style lang="less" scoped>
.music-btn {
  width: 100%;
  height: 60px;
  font-size: 0;
  white-space: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  span {
    display: inline-block;
    height: 40px;
    box-sizing: border-box;
    margin-right: 8px;
    padding: 0 23px;
    border: 1px solid @btn_color;
    color: @btn_color;
    border-radius: @btn_border_radius;
    font-size: 14px;
    line-height: 40px;
    overflow: hidden;
    cursor: pointer;
    &:nth-last-of-type(1) {
      margin: 0;
    }
    &:hover,
    &.active {
      border-color: @btn_color_active;
      color: @btn_color_active;
    }
  }
  @media (min-width: 960px) {
    span.show-960 {
      display: none;
    }
  }
  @media (max-width: 960px) {
    span.show-960 {
      display: inline-block;
    }
  }
  @media (max-width: 768px) {
    height: 50px;
    span {
      height: 35px;
      padding: 0 10px;
      margin-right: 6px;
      line-height: 35px;
    }
  }
}
</style>
