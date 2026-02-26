<template>
  <div id="app">
    <bb-header />
    <router-view />
    <audio ref="bbPlayer" crossorigin="anonymous"></audio>

    <!-- 显示当前播放歌曲 -->
    <div v-if="currentMusic.id">
      <p>当前播放: {{ currentMusic.name }} - {{ currentMusic.singer }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores/index';
import BbHeader from '@/components/music-header/index.vue';
import { getPlaylistDetail } from '@/api';
import { BBPlayer_CONFIG } from '@/config';
import type { SongDetailItem } from '@/types/dataTypes';
import { printLog } from './utils/util';

// ------------------------------ store ------------------------------
const playerStore = usePlayerStore();

// ------------------------------ refs ------------------------------
const bbPlayer = useTemplateRef<HTMLAudioElement | null>('bbPlayer');

// ------------------------------ computed ------------------------------
const currentMusic = computed<SongDetailItem>(() => playerStore.currentMusic);

const disableFullscreenKeys = (event: KeyboardEvent) => {
  if (event.key === 'F11') {
    event.preventDefault();
  }
};

// ------------------------------ 生命周期 ------------------------------
onMounted(async () => {
  window.addEventListener('keydown', disableFullscreenKeys);
  printLog();
  // 设置audio元素
  playerStore.setAudioEle(bbPlayer.value!);

  // 获取播放列表
  const playlist = await getPlaylistDetail(BBPlayer_CONFIG.PLAYLIST_ID);
  const list = playlist.tracks.slice(0, 100);
  playerStore.setPlaylist(list as SongDetailItem[]);

  // 设置title切换逻辑
  const OriginTitle = document.title;
  let titleTime: number;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.title = '死鬼去哪里了！';
      clearTimeout(titleTime);
    } else {
      document.title = '(つェ⊂)咦!又好了!';
      titleTime = setTimeout(() => {
        document.title = OriginTitle;
      }, 2000);
    }
  });

  // 加载动画处理
  let loadDOM = document.querySelector('#appLoading');
  if (loadDOM) {
    const animationendFunc = () => {
      loadDOM!.removeEventListener('animationend', animationendFunc);
      loadDOM!.removeEventListener('webkitAnimationEnd', animationendFunc);
      document.body.removeChild(loadDOM!);
      loadDOM = null;
    };
    loadDOM.addEventListener('animationend', animationendFunc);
    loadDOM.addEventListener('webkitAnimationEnd', animationendFunc);
    loadDOM.classList.add('removeAnimate');
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', disableFullscreenKeys);
});
</script>

<style lang="less">
#app {
  position: relative;
  width: 100%;
  height: 100%;
  color: @text_color;
  font-size: @font_size_medium;

  audio {
    position: fixed;
  }
}
</style>
