<template>
  <!--歌单详情-->
  <div class="details">
    <bb-loading :value="bbLoadShow" />
    <music-list :list="list" @select="selectItem" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'music-details' });

import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePlayerStore } from '@/stores/index.ts';
import { getPlaylistDetail } from '@/api';
import BbLoading from '@/base/bb-loading/index.vue';
import MusicList from '@/components/music-list/index.vue';
import { useLoad } from '@/hooks/useload';
import type { SongObjectType } from '@/types/dataTypes';

// ------------------------------ 路由 & hooks ------------------------------
const route = useRoute();
const { bbLoadShow, _hideLoad } = useLoad();
// ------------------------------ 数据管理 ------------------------------
const playerStore = usePlayerStore();

// ------------------------------ 数据 ------------------------------
const list = ref<SongObjectType[]>([]);

// ------------------------------ 生命周期 ------------------------------
onMounted(() => {
  // 获取歌单详情
  getPlaylistDetail(route.params.id as string)
    .then((playlist) => {
      document.title = `${playlist.name} - BbPlayer在线音乐播放器`;
      list.value = playlist.tracks as SongObjectType[];
      _hideLoad();
    })
    .catch(() => {
      _hideLoad();
    });
});

// ------------------------------ 方法 ------------------------------

// 播放暂停事件
function selectItem(_item: SongObjectType, index: number) {
  playerStore.selectPlay({
    list: list.value,
    index,
  });
}
</script>

<style lang="less" scoped>
.details {
  .music-list {
    height: 100%;
  }
}
</style>
