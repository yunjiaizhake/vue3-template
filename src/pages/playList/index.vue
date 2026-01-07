<template>
  <div class="playList">
    <music-list
      :list="playlist"
      list-type="duration"
      @select="selectItem"
      @del="deleteItem"
    >
      <template #listBtn>
        <div class="list-btn">
          <span @click="dialogRef?.show()">清空列表</span>
        </div>
      </template>
    </music-list>

    <bb-dialog
      ref="dialogRef"
      body-text="是否清空正在播放列表"
      confirm-btn-text="清空"
      @confirm="clearList"
    />
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores/index.ts';
import MusicList from '@/components/music-list/index.vue';
import BbDialog from '@/base/bb-dialog/index.vue';
import type { SongDetailItem } from '@/types/dataTypes';

const { proxy } = getCurrentInstance()!;
// ------------------------------ refs ------------------------------
const dialogRef = useTemplateRef<InstanceType<typeof BbDialog>>('loginDialog');

// ------------------------------ store ------------------------------
const store = usePlayerStore();

const playlist = computed(() => store.playlist);
const currentMusic = computed(() => store.currentMusic);

// ------------------------------ methods ------------------------------
function clearList() {
  store.clearPlayList();
  proxy!.$bbToast?.('列表清空成功');
}

function selectItem(item: SongDetailItem, index: number) {
  if (item.id !== currentMusic.value.id) {
    store.currentIndex = index;
    store.playing = true;
  }
}

function deleteItem(index: number) {
  const list = [...playlist.value];
  list.splice(index, 1);
  store.removerPlayListItem({ list, index });
  proxy!.$bbToast?.('删除成功');
}
</script>
