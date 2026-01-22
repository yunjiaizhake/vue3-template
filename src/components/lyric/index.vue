<template>
  <div>
    <!--封面-->
    <dl class="music-info">
      <dt>
        <img v-lazy="musicPicUrl" />
      </dt>

      <template v-if="currentMusic.id">
        <dd>歌曲名：{{ currentMusic.name }}</dd>
        <dd>歌手名：{{ currentMusic.singer }}</dd>
        <dd>专辑名：{{ currentMusic.album }}</dd>
      </template>

      <template v-else>
        <dd>BbPlayer在线音乐播放器</dd>
        <dd>
          <a
            class="hover github-link"
            target="_blank"
            href="https://github.com/yunjiaizhake/vue3-template/tree/Graduation-project"
          >
            <bb-icon type="github" :size="16" />
            &nbsp;波波
          </a>
        </dd>
      </template>
    </dl>

    <!--歌词-->
    <div ref="musicLyric" class="music-lyric">
      <div class="music-lyric-items" :style="lyricTop">
        <p v-if="!currentMusic.id">还没有播放音乐哦！</p>
        <p v-else-if="props.nolyric">暂无歌词！</p>

        <template v-else-if="props.lyric.length > 0">
          <p
            v-for="(item, index) in props.lyric"
            :key="index"
            :class="{ on: props.lyricIndex === index }"
          >
            {{ item.text }}
          </p>
        </template>

        <p v-else>歌词加载失败！</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores/index.ts';
import playerCover from '../../assets/img/player_cover.png';
import type { SongDetailItem } from '@/types/dataTypes';

// ------------------------------ props ------------------------------
type LyricLine = { text: string };
const props = withDefaults(
  defineProps<{
    lyric: LyricLine[]; // 当前播放歌曲的歌词内容
    nolyric: boolean; // 标识当前歌曲是否没有歌词
    lyricIndex: number; // 当前播放的歌词行索引
  }>(),
  {
    lyric: () => [],
    nolyric: false,
    lyricIndex: 0,
  },
);

// ------------------------------ store ------------------------------
const store = usePlayerStore();
const currentMusic = computed<SongDetailItem>(() => store.currentMusic || {});

// ------------------------------ state ------------------------------
const musicLyric = ref<HTMLDivElement | null>(null);
const top = ref(0);

// 封面
const musicPicUrl = computed(() => {
  return currentMusic.value.id
    ? `${currentMusic.value.image}?param=300y300`
    : playerCover;
});

// 歌词偏移
const lyricTop = computed(() => {
  return `transform: translate3d(0, ${-34 * (props.lyricIndex - top.value)}px, 0)`;
});

// ------------------------------ methods ------------------------------
const calcTop = () => {
  const dom = musicLyric.value;
  if (!dom) return;

  const { display = '' } = window.getComputedStyle(dom);
  if (display === 'none') return;

  const height = dom.offsetHeight;
  top.value = Math.floor(height / 34 / 2);
};

// ------------------------------ 生命周期 ------------------------------
let resizeTimer: number | null = null;

onMounted(() => {
  window.addEventListener('resize', () => {
    resizeTimer && clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(calcTop, 60);
  });

  nextTick(() => calcTop());
});

defineExpose({
  calcTop,
});
</script>

<style lang="less" scoped>
.music-info {
  padding-bottom: 20px;
  text-align: center;
  font-size: @font_size_medium;
  dt {
    position: relative;
    width: 186px;
    height: 186px;
    margin: 0 auto 15px;
    &:after {
      content: '';
      position: absolute;
      left: 9px;
      top: 0;
      width: 201px;
      height: 180px;
      background: url('~assets/img/album_cover_player.png') 0 0 no-repeat;
    }
    img {
      vertical-align: middle;
      width: 186px;
      height: 186px;
    }
  }
  dd {
    height: 30px;
    line-height: 30px;
    .no-wrap();
  }
  .github-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

/*歌词部分*/
.music-lyric {
  position: absolute;
  top: 315px;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  text-align: center;
  mask-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.6) 15%,
    rgba(255, 255, 255, 1) 25%,
    rgba(255, 255, 255, 1) 75%,
    rgba(255, 255, 255, 0.6) 85%,
    rgba(255, 255, 255, 0) 100%
  );
  .music-lyric-items {
    text-align: center;
    line-height: 34px;
    font-size: @font_size_small;
    transform: translate3d(0, 0, 0);
    transition: transform 0.6s ease-out;
    .no-wrap();
    .on {
      color: @lyric_color_active;
      transform: scale(1.5);
    }
  }
}

// 当屏幕小于 960 时
@media (max-width: 960px) {
  .music-info {
    display: none;
  }
  .music-lyric {
    top: 0;
  }
}
</style>
