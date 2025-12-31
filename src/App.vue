<template>
  <div id="app">
    <mm-header />
    <router-view />
    <audio ref="mmPlayer"></audio>

    <!-- 显示当前播放歌曲 -->
    <div v-if="currentMusic.id">
      <p>当前播放: {{ currentMusic.name }} - {{ currentMusic.artist }}</p>
    </div>
  </div>
</template>

<script setup>
import { usePlayerStore } from '@/stores/index';
import MmHeader from '@/components/music-header/index.vue';
import MmDialog from '@/base/mm-dialog/index.vue';
import { getPlaylistDetail } from '@/api';
import { MMPLAYER_CONFIG } from '@/config';
import { getVersion, setVersion } from '@/utils/storage';

// 初始化 store
const playerStore = usePlayerStore();

// refs
const mmPlayer = ref(null);

// getter 使用
const currentMusic = computed(() => playerStore.currentMusic);

// 初始化逻辑
onMounted(async () => {
  // 设置audio元素
  playerStore.setAudioEle(mmPlayer.value);

  // 获取播放列表
  const playlist = await getPlaylistDetail(MMPLAYER_CONFIG.PLAYLIST_ID);
  const list = playlist.tracks.slice(0, 100);
  playerStore.setPlaylist({ list });

  // 设置title切换逻辑
  const OriginTitle = document.title;
  let titleTime;
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
      loadDOM.removeEventListener('animationend', animationendFunc);
      loadDOM.removeEventListener('webkitAnimationEnd', animationendFunc);
      document.body.removeChild(loadDOM);
      loadDOM = null;
    };
    loadDOM.addEventListener('animationend', animationendFunc);
    loadDOM.addEventListener('webkitAnimationEnd', animationendFunc);
    loadDOM.classList.add('removeAnimate');
  }
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
