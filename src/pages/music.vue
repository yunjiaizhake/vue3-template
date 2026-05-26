<template>
  <div class="music flex-col" @contextmenu="handleContextMenu">
    <div class="music-content">
      <div class="music-left flex-col">
        <music-btn />
        <router-view v-slot="{ Component }">
          <div class="router-view-wrapper">
            <transition name="music-fade">
              <keep-alive :include="cachedRoutes">
                <component :is="Component" class="router-view" />
              </keep-alive>
            </transition>
          </div>
        </router-view>
      </div>
      <div class="music-right">
        <lyric
          :lyric="lyric"
          :nolyric="nolyric"
          :lyric-index="lyricIndex"
          @seek="seekToLyric"
        />
      </div>
    </div>

    <!--播放器-->
    <div class="music-bar" :class="{ disable: !musicReady || !currentMusic.id }">
      <div class="music-bar-btns">
        <bb-icon
          class="pointer"
          type="prev"
          :size="30"
          title="上一曲 Ctrl + Left"
          @click="prev"
        />
        <div class="control-play pointer" title="播放暂停 Ctrl + Space" @click="play">
          <bb-icon
            :type="playing ? 'pause' : 'play'"
            :size="24"
            :class="{ 'play-shift': !playing }"
          />
        </div>
        <bb-icon
          class="pointer"
          type="next"
          :size="30"
          title="下一曲 Ctrl + Right"
          @click="next"
        />
      </div>
      <div class="music-music">
        <div class="music-bar-info">
          <template v-if="currentMusic && currentMusic.id">
            {{ currentMusic.name }}
            <span>- {{ currentMusic.singer }}</span>
          </template>
          <template v-else>欢迎使用BbPlayer在线音乐播放器</template>
        </div>
        <div v-if="currentMusic.id" class="music-bar-time">
          {{ format(currentTime) }}/{{ format(currentMusic.duration % 3600) }}
        </div>
        <bb-progress
          class="music-progress"
          :percent="percentMusic"
          :percent-progress="currentProgress"
          :markers="chorusMarkers"
          @percentChange="progressMusic"
          @percentChangeEnd="progressMusicEnd"
        />
      </div>

      <!-- 播放模式 -->
      <bb-icon
        class="icon-color pointer mode"
        :type="getModeIconType()"
        :title="getModeIconTitle()"
        :size="30"
        @click="modeChange"
      />

      <!-- 评论 -->
      <bb-icon
        class="icon-color pointer comment"
        type="comment"
        :size="28"
        @click="openComment"
      />

      <!-- 音量控制 -->
      <div class="music-bar-volume" title="音量加减 [Ctrl + Up / Down]">
        <volume :volume="volume" @volumeChange="volumeChange" ref="volumeRef" />
      </div>
    </div>

    <!--遮罩-->
    <div class="bbPlayer-bg" :style="{ backgroundImage: picUrl }"></div>
    <div class="bbPlayer-mask"></div>

    <!-- 右键菜单 -->
    <music-context-menu
      ref="contextMenuRef"
      :items="contextMenuItems"
      @select="handleContextMenuSelect"
    />
    <teleport to="body">
      <music-immersive
        :visible="isImmersive"
        :current-music="currentMusic"
        :lyric="lyric"
        :nolyric="nolyric"
        :lyric-index="lyricIndex"
        :playing="playing"
        @contextmenu="handleContextMenu"
      />
    </teleport>
    <!-- <ai-chat-voice v-if="isVoiceModalOpen" @close="isVoiceModalOpen = false" /> -->
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'music' });

import { usePlayerStore } from '@/stores/index.ts';
import { getLyric, getChorus, getMusicUrl_v1, getAIMusicLyric } from '@/api';
import bbPlayerMusic from './bbPlayer';
import {
  randomSortArray,
  parseLyric,
  parseAILyric,
  format,
  silencePromise,
} from '@/utils/util';
import { PLAY_MODE, BBPlayer_CONFIG } from '@/config';
import { getVolume, setVolume, addRecommendHistory } from '@/utils/storage';
import { recommendFromFavorites, toggleImmersive } from '@/utils/context-menu';
import { searchAndPlay } from '@/utils/aiplay';
import { flushPlaySession } from '@/utils/playBehavior';

import BbProgress from '@/base/bb-progress/index.vue';
import MusicBtn from '@/components/music-btn/index.vue';
import Lyric from '@/components/lyric/index.vue';
import Volume, { type ChildExpose } from '@/components/volume/index.vue';
import type { SongDetailItem, LyricLine } from '@/types/dataTypes';
import { useAiEventBusStore } from '@/stores/aiEventBus';
import MusicContextMenu from '@/components/music-context-menu/index.vue';
import MusicImmersive from '@/components/music-immersive/index.vue';
// import AiChatVoice from '@/pages/aiChatVoice/index.vue';
import type { ContextMenuItem } from '@/hooks/useContextMenu';

// ------------------------------ 数据 ------------------------------
const volume = ref<number>(getVolume());
const musicReady = ref<boolean>(false);
const currentTime = ref<number>(0);
const currentProgress = ref<number>(0);
const lyric = ref<LyricLine[]>([]);
const nolyric = ref<boolean>(false);
const lyricIndex = ref<number>(0);
const chorusMarkers = ref<number[]>([]);

const { proxy } = getCurrentInstance()!; // 拿到当前实例
const volumeRef = ref<ChildExpose | null>(null);
const contextMenuRef =
  useTemplateRef<InstanceType<typeof MusicContextMenu>>('contextMenuRef');
const isVoiceModalOpen = ref(false); // 打开语音识别
const isImmersive = ref(false); // 打开沉浸体验
const isAiRecommendActive = ref(false); // 是否开启为你推荐
const syncFullscreen = () => {
  if (!document.fullscreenElement && isImmersive.value) {
    isImmersive.value = false;
  }
};

// ------------------------------ 路由 & store ------------------------------
const route = useRoute();
const cachedRoutes = ref<string[]>([]);

watch(
  () => route.name,
  () => {
    if (!route.meta.keepAlive || typeof route.name !== 'string') return;
    if (!cachedRoutes.value.includes(route.name)) {
      cachedRoutes.value.push(route.name);
    }
  },
  { immediate: true },
);
const router = useRouter();
const store = usePlayerStore();
const aiBus = useAiEventBusStore();

const {
  audioEle,
  mode,
  playing,
  playlist,
  orderList,
  currentIndex,
  currentMusic,
  historyList,
} = storeToRefs(store);

// ------------------------------ 计算属性 ------------------------------
const picUrl = computed(() => {
  return currentMusic.value.id && currentMusic.value.image
    ? `url(${currentMusic.value.image}?param=300y300)`
    : `url(${BBPlayer_CONFIG.BACKGROUND})`;
});

// 副歌部分提示
const percentMusic = computed(() => {
  const duration = currentMusic.value.duration;
  return currentTime.value && duration ? currentTime.value / duration : 0;
});

// 自定义右键菜单数据
const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const hasMusic = Boolean(currentMusic.value?.id);
  return [
    {
      key: 'play',
      label: playing.value ? '暂停' : '播放',
      disabled: !hasMusic,
    },
    { key: 'prev', label: '上一曲', disabled: !hasMusic },
    { key: 'next', label: '下一曲', disabled: !hasMusic },
    { key: 'comment', label: '打开评论', disabled: !hasMusic },
    {
      key: 'ai_recommend',
      label: '为你推荐',
      disabled: false,
    },
    {
      key: 'immersive',
      label: isImmersive.value ? '回到主页面' : '打开沉浸式体验',
      disabled: !hasMusic && !isImmersive.value,
    },
    // 暂时屏蔽语音识别
    // {
    //   key: 'voice',
    //   label: `${isVoiceModalOpen.value ? '关闭语音识别' : '打开语音识别'}`,
    //   disabled: false,
    // },
  ];
});

// ------------------------------ watch ------------------------------
watch(currentMusic, async (newMusic, oldMusic) => {
  if (!newMusic.id) {
    lyric.value = [];
    return;
  }
  if (newMusic.id === oldMusic.id) return;

  if (!newMusic.url) {
    console.log('newMusic', toRaw(newMusic)); // toRaw 返回那个被 Proxy 包裹的原始对象
    const res = await getMusicUrl_v1(newMusic.id);
    newMusic.url = res.data?.[0]?.url || '';
  }

  audioEle.value!.src = newMusic.url;
  lyricIndex.value = currentTime.value = currentProgress.value = 0;
  silencePromise(audioEle.value!.play());
  nextTick(() => {
    _getLyric(newMusic);
    _getChorus(newMusic);
  });
});

watch(playing, (newPlaying) => {
  nextTick(() => {
    newPlaying ? silencePromise(audioEle.value!.play()) : audioEle.value!.pause();
    musicReady.value = true;
  });
});

function findLyricIndex(time: number) {
  let left = 0;
  let right = lyric.value.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;

    if (lyric.value[mid]!.time <= time) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return right;
}
// 使用二分查找判断当前应该高亮哪一句歌词
watch(currentTime, (newTime) => {
  if (nolyric.value) return;
  lyricIndex.value = findLyricIndex(newTime);
});

// ------------------------------ 生命周期 & 监听 ------------------------------
onMounted(() => {
  nextTick(() => {
    if (audioEle.value) {
      initPlayer();
    }
    initKeyDown();
    volumeChange(volume.value);
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  syncFullscreen();
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreen);
});

watch(audioEle, (newEle) => {
  if (newEle) {
    initPlayer();
  }
});

watch(
  () => aiBus.music_control,
  (event) => {
    if (!event) return;
    if (event.payload === 'prev') {
      prev();
    } else if (event.payload === 'next') {
      next();
    } else if (event.payload === 'play') {
      play();
    }
  },
);
// ws播放音乐
watch(
  () => aiBus.play_song,
  async (event) => {
    if (!event) return;
    const song = await searchAndPlay(event.payload as string);
    if (isAiRecommendActive.value && song) {
      const record = `${song.singer}：${song.name}`;
      addRecommendHistory(record);
      proxy?.$bbToast?.(`已经为您推荐歌曲：${song.name}`, 'center', 3000);
      isAiRecommendActive.value = false;
    }
  },
);
// ws控制音量
watch(
  () => aiBus.volume_control,
  (event) => {
    const action = event?.action || 'up';
    const value = event?.value || 0.2;
    const applyDelta = (delta: number) => {
      const nextValue = Math.max(0, Math.min(1, volume.value + delta));
      volumeChange(Number(nextValue.toFixed(2)));
    };
    switch (action) {
      case 'mute':
        if (!audioEle.value!.muted) volumeRef.value?.handleToggleVolume();
        break;
      case 'unmute':
        if (audioEle.value!.muted) volumeRef.value?.handleToggleVolume();
        break;
      case 'down': {
        applyDelta(-value);
        break;
      }
      case 'set': {
        volumeChange(value);
        break;
      }
      case 'up':
      default: {
        applyDelta(value);
      }
    }
  },
);

// ------------------------------ 方法 ------------------------------
function initPlayer() {
  bbPlayerMusic.initAudio({
    audioEle,
    currentMusic,
    currentTime,
    currentProgress,
    musicReady,
    mode,
    playlist,
    historyList,
    setPlaying: store.setPlaying,
    next,
    prev,
    loop,
    setHistory: store.setHistory,
    getLastSwitchAction: () => store.lastSwitchAction,
    toast: proxy?.$bbToast, // 传入全局toast
  });
}

function initKeyDown() {
  document.onkeydown = (e) => {
    if (e.ctrlKey) {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          play();
          break;

        case 'ArrowLeft':
          prev();
          break;

        case 'ArrowRight':
          next();
          break;

        case 'ArrowUp': {
          const plus = Math.min(1, Number((volume.value + 0.1).toFixed(1)));
          volumeChange(plus);
          break;
        }

        case 'ArrowDown': {
          const reduce = Math.max(0, Number((volume.value - 0.1).toFixed(1)));
          volumeChange(reduce);
          break;
        }

        case 'o':
        case 'O':
          modeChange();
          break;
      }
    }
  };
}

function prev(flag = false) {
  if (!isMusicPlay()) return;
  flushPlaySession();
  store.setLastSwitchAction('prev');
  if (playlist.value.length === 1) {
    if (flag) {
      store.setCurrentIndex(-1);
      store.setPlaying(false);
      return;
    }
    loop();
  } else {
    let index = currentIndex.value - 1;
    if (index < 0) index = playlist.value.length - 1;
    store.setCurrentIndex(index);
    if (!playing.value && musicReady.value) store.setPlaying(true);
    musicReady.value = false;
  }
}

function play() {
  if (!isMusicPlay()) return;
  store.setPlaying(!playing.value);
}

function next(flag = false) {
  if (!isMusicPlay()) return;
  flushPlaySession();
  store.setLastSwitchAction('next');

  const length = playlist.value.length;
  if (
    (length - 1 === currentIndex.value && mode.value === PLAY_MODE.ORDER) ||
    (length === 1 && flag)
  ) {
    store.setCurrentIndex(-1);
    store.setPlaying(false);
    return;
  }
  if (length === 1) {
    loop();
  } else {
    let index = currentIndex.value + 1;
    if (index === length) index = 0;
    if (!playing.value && musicReady.value) store.setPlaying(true);
    store.setCurrentIndex(index);
    musicReady.value = false;
  }
}

function loop() {
  audioEle.value!.currentTime = 0;
  silencePromise(audioEle.value!.play());
  store.setPlaying(true);
  if (lyric.value.length > 0) lyricIndex.value = 0;
}

function progressMusic(percent: number) {
  currentTime.value = currentMusic.value.duration * percent;
}

function progressMusicEnd(percent: number) {
  audioEle.value!.currentTime = currentMusic.value.duration * percent;
}

// 点击歌词进行时间跳转
function seekToLyric(time: number) {
  if (!audioEle.value || !currentMusic.value?.id) return;
  audioEle.value.currentTime = time;
  currentTime.value = time;
}

function modeChange() {
  const newMode = (mode.value + 1) % 4;
  store.setPlayMode(newMode);
  if (newMode === PLAY_MODE.LOOP) return;
  let list: SongDetailItem[] = [];
  switch (newMode) {
    case PLAY_MODE.LIST_LOOP:
    case PLAY_MODE.ORDER:
      list = orderList.value;
      break;
    case PLAY_MODE.RANDOM:
      list = randomSortArray(orderList.value) as SongDetailItem[];
      break;
  }
  resetCurrentIndex(list);
  store.setPlaylist(list);
}

function resetCurrentIndex(list: SongDetailItem[]) {
  const index = list.findIndex((item) => item.id === currentMusic.value.id);
  store.setCurrentIndex(index);
}

function openComment() {
  if (!isMusicPlay()) return;
  router.push(`/music/comment/${currentMusic.value.id}`);
}

function isMusicPlay() {
  if (!currentMusic.value.id) {
    proxy!.$bbToast?.('还没有播放歌曲哦,请先选择一首你喜欢的音乐吧！');
    return false;
  }
  return true;
}

function volumeChange(percent: number) {
  volume.value = percent;
  audioEle.value!.muted = percent === 0;
  audioEle.value!.volume = percent;
  setVolume(percent);
}

function getModeIconType() {
  return {
    [PLAY_MODE.LIST_LOOP]: 'loop',
    [PLAY_MODE.ORDER]: 'sequence',
    [PLAY_MODE.RANDOM]: 'random',
    [PLAY_MODE.LOOP]: 'loop-one',
  }[mode.value];
}

function getModeIconTitle() {
  const key = 'Ctrl + O';
  return {
    [PLAY_MODE.LIST_LOOP]: `列表循环 ${key}`,
    [PLAY_MODE.ORDER]: `顺序播放 ${key}`,
    [PLAY_MODE.RANDOM]: `随机播放 ${key}`,
    [PLAY_MODE.LOOP]: `单曲循环 ${key}`,
  }[mode.value];
}

function handleContextMenu(event: MouseEvent) {
  contextMenuRef.value?.open(event);
}
// 处理自定义右键菜单行为
async function handleContextMenuSelect(key: string) {
  switch (key) {
    case 'prev':
      prev();
      break;
    case 'next':
      next();
      break;
    case 'play':
      play();
      break;
    case 'comment':
      openComment();
      break;
    case 'ai_recommend':
      await recommendFromFavorites({
        isAiRecommendActive,
        toast: proxy?.$bbToast,
        aiBus,
      });
      break;
    case 'immersive':
      await toggleImmersive({ isImmersive, isMusicPlay });
      break;
    // case 'voice':
    //   isVoiceModalOpen.value = !isVoiceModalOpen.value;
    //   break;
  }
  contextMenuRef.value?.close();
}

function _getLyric(music: SongDetailItem) {
  if (music.isAIMusic) {
    _getAILyric(music);
    return;
  }
  getLyric(music.id).then((res) => {
    if (res.lrc && res.lrc.lyric) {
      nolyric.value = false;
      lyric.value = parseLyric(res.lrc.lyric);
    } else {
      nolyric.value = true;
    }
    silencePromise(audioEle.value!.play());
  });
}
// AI 获取歌词
function _getAILyric(music: SongDetailItem) {
  const { taskId, audioId } = music;
  if (!taskId || !audioId) {
    nolyric.value = true;
    silencePromise(audioEle.value!.play());
    return;
  }
  getAIMusicLyric(taskId, audioId)
    .then((res) => {
      if (res.code === 200 && res.data?.alignedWords?.length) {
        nolyric.value = false;
        lyric.value = parseAILyric(res.data.alignedWords);
      } else {
        nolyric.value = true;
      }
      silencePromise(audioEle.value!.play());
    })
    .catch(() => {
      nolyric.value = true;
      silencePromise(audioEle.value!.play());
    });
}

// 获取歌词副歌部分（AI 音乐不支持）
function _getChorus(music: SongDetailItem) {
  if (music.isAIMusic) {
    chorusMarkers.value = [];
    return;
  }
  const duration = currentMusic.value.duration || 0;
  if (!duration) {
    chorusMarkers.value = [];
    return;
  }
  getChorus(music.id)
    .then((res) => {
      const list = res.chorus || [];
      chorusMarkers.value = list
        .map((item) => item.startTime / 1000 / duration)
        .filter((value) => value >= 0 && value <= 1);
    })
    .catch(() => {
      chorusMarkers.value = [];
    });
}
</script>
<style lang="less">
.router-view-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
}

.router-view {
  position: absolute;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.music-fade-enter-active,
.music-fade-leave-active {
  transition: opacity 0.5s ease;
  position: absolute;
  inset: 0;
}

.music-fade-enter-from,
.music-fade-leave-to {
  opacity: 0;
}

.music {
  padding: 75px 25px 25px 25px;
  width: 100%;
  max-width: 1750px;
  margin: 0 auto;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  .music-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    width: 100%;
    .music-left {
      flex: 1;
      width: 100%;
      overflow: hidden;
    }
    .music-right {
      position: relative;
      width: 310px;
      margin-left: 10px;
      .close-lyric {
        position: absolute;
        top: 0;
        z-index: 1;
        cursor: pointer;
      }
    }
  }

  /*底部bbPlayer-bar*/
  .music-bar {
    display: flex;
    align-items: center;
    width: 100%;
    padding-top: 15px;
    color: #fff;
    &.disable {
      // pointer-events: none;
      opacity: 0.6;
    }
    .icon-color {
      color: #fff;
    }
    .music-bar-btns {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 180px;
      .control-play {
        .flex-center;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        // color: #fff;
        color: rgba(255, 255, 255, 0.7);
        background-color: rgba(255, 255, 255, 0.3);
        .play-shift {
          transform: translateX(2px);
        }
      }
    }

    .flex-center;
    .btn-prev {
      width: 19px;
      min-width: 19px;
      height: 20px;
    }
    .btn-play {
      width: 21px;
      min-width: 21px;
      height: 29px;
    }
    .btn-next {
      width: 19px;
      min-width: 19px;
      height: 20px;
    }
    .music-music {
      position: relative;
      width: 100%;
      flex: 1;
      box-sizing: border-box;
      padding-left: 40px;
      font-size: @font_size_small;
      color: @text_color_active;
      .music-bar-info {
        height: 15px;
        padding-right: 80px;
        line-height: 15px;
        text-overflow: ellipsis;
        overflow: hidden;
        display: -webkit-box;
        line-clamp: 1;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }
      .music-bar-time {
        position: absolute;
        top: 0;
        right: 5px;
      }
    }
    .mode,
    .comment,
    .music-bar-volume {
      margin-left: 20px;
    }

    // 音量控制
    .volume-wrapper {
      margin-left: 20px;
      width: 150px;
    }
  }

  /*遮罩*/
  .bbPlayer-mask,
  .bbPlayer-bg {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
  }

  .bbPlayer-mask {
    z-index: -1;
    background-color: @mask_color;
  }

  .bbPlayer-bg {
    z-index: -2;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: 50%;
    filter: blur(12px);
    opacity: 0.7;
    transition: all 0.8s;
    transform: scale(1.1);
  }

  @media (min-width: 960px) {
    .close-lyric {
      display: none;
    }
  }

  //当屏幕小于960时
  @media (max-width: 960px) {
    .music-right {
      display: none;
      // &.show {
      //   display: block;
      //   margin-left: 0;
      //   width: 100%;
      // }
    }
  }
  //当屏幕小于768时
  @media (max-width: 768px) {
    padding: 75px 15px 5px 15px;

    .music-bar {
      padding-top: 10px;
      .music-bar-info span,
      .music-bar-volume .bbprogress {
        display: none;
      }
    }
  }
  //当屏幕小于520时
  @media (max-width: 520px) {
    .music-bar {
      position: relative;
      flex-direction: column;
      .music-bar-btns {
        width: 60%;
        margin-top: 10px;
        order: 2;
      }
      .music-music {
        padding-left: 0;
        order: 1;
      }
      .mode,
      .comment {
        position: absolute;
        bottom: 20px;
        margin: 0;
      }
      .mode {
        left: 5px;
      }
      .comment {
        right: 5px;
      }
      .music-bar-volume {
        display: none;
      }
    }
  }
}
</style>
