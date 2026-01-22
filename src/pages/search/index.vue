<template>
  <!--搜索-->
  <div class="search flex-col">
    <bb-loading :value="bbLoadShow" />

    <div class="search-head">
      <span
        v-for="(item, index) in HotList"
        :key="index"
        @click="clickHot(item.first)"
      >
        {{ item.first }}
      </span>

      <input
        v-model.trim="searchValue"
        class="search-input"
        type="text"
        placeholder="音乐/歌手"
        @keyup.enter="onEnter"
      />
    </div>

    <div class="flex-1 overflow-hidden">
      <music-list
        ref="musicListRef"
        :list="list"
        list-type="pullup"
        @select="selectItem"
        @pullUp="pullUpLoad"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'music-search' });

import { usePlayerStore } from '@/stores';
import { search, searchHot, getMusicDetail } from '@/api';
import { formatSongs } from '@/utils/song';
import BbLoading from '@/base/bb-loading/index.vue';
import MusicList from '@/components/music-list/index.vue';
import { useLoad } from '@/hooks/useload';
import { toHttps } from '@/utils/util';
import type {
  HotItem,
  SongDetailItem,
  Track,
  SearchResponse,
} from '@/types/dataTypes';

// ------------------------------ store & hooks ------------------------------
const playerStore = usePlayerStore();
const { bbLoadShow, _hideLoad } = useLoad();

// ------------------------------ refs ------------------------------
const musicListRef = useTemplateRef('musicListRef');

// ------------------------------ 数据 ------------------------------
const searchValue = ref<string>('');
const HotList = ref<HotItem[]>([]);
const list = ref<SongDetailItem[]>([]);
const page = ref<number>(0);
const lockUp = ref(true);
const { proxy } = getCurrentInstance()!; // 拿到当前实例

// ------------------------------ computed ------------------------------

// ------------------------------ watch ------------------------------
watch(list, (newList, oldList) => {
  if (!oldList.length) return;

  if (newList.length !== oldList.length) {
    lockUp.value = false;
  } else if (
    newList[newList.length - 1]?.id !== oldList[oldList.length - 1]?.id
  ) {
    lockUp.value = false;
  }
});

// ------------------------------ 生命周期 ------------------------------
onMounted(() => {
  // 获取热搜
  searchHot().then(({ result }) => {
    HotList.value = result.hots.slice(0, 5);
    bbLoadShow.value = false;
  });
});

// ------------------------------ methods ------------------------------

// 点击热搜
function clickHot(name: string) {
  searchValue.value = name;
  onEnter();
}

// 搜索事件
function onEnter() {
  if (searchValue.value.replace(/(^\s+)|(\s+$)/g, '') === '') {
    proxy?.$bbToast && proxy?.$bbToast('搜索内容不能为空！');
    return;
  }

  bbLoadShow.value = true;
  page.value = 0;

  if (list.value.length > 0) {
    musicListRef.value?.scrollTo();
  }

  search(searchValue.value).then(({ result }) => {
    list.value = formatSongs(result.songs as Track[]);
    _hideLoad();
  });
}

// 滚动加载事件
function pullUpLoad() {
  page.value += 1;

  search(searchValue.value, page.value).then(({ result }: SearchResponse) => {
    if (!result.songs) {
      proxy?.$bbToast && proxy?.$bbToast('没有更多歌曲啦！');
      return;
    }
    list.value = [...list.value, ...formatSongs(result.songs as Track[])];
  });
}

// 播放歌曲
async function selectItem(music: SongDetailItem) {
  try {
    const image = await _getMusicDetail(music.id);
    music.image = toHttps(image);
    playerStore.selectAddPlay(music);
  } catch (error) {
    proxy?.$bbToast && proxy?.$bbToast('哎呀，出错啦~');
  }
}

// 获取歌曲详情
function _getMusicDetail(id: string) {
  return getMusicDetail(id).then((res) => res.songs[0]!.al.picUrl);
}
</script>

<style lang="less" scoped>
.search {
  overflow: hidden;
  height: 100%;
  .search-head {
    display: flex;
    height: 40px;
    padding: 10px 15px;
    overflow: hidden;
    background: @search_bg_color;
    span {
      line-height: 40px;
      margin-right: 15px;
      cursor: pointer;
      &:hover {
        color: @text_color_active;
      }
      @media (max-width: 640px) {
        & {
          display: none;
        }
      }
    }
    .search-input {
      flex: 1;
      height: 40px;
      box-sizing: border-box;
      padding: 0 15px;
      border: 1px solid @btn_color;
      outline: 0;
      background: transparent;
      color: @text_color_active;
      font-size: @font_size_medium;
      box-shadow: 0 0 1px 0 #fff inset;
      &::placeholder {
        color: @text_color;
      }
    }
  }
}
</style>
