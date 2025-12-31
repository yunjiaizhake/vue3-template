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
          <span @click="dialogRef.show()">清空列表</span>
        </div>
      </template>
    </music-list>

    <mm-dialog
      ref="dialogRef"
      body-text="是否清空正在播放列表"
      confirm-btn-text="清空"
      @confirm="clearList"
    />
  </div>
</template>

<script setup>
import { usePlayerStore } from '@/stores/index.ts';
import MusicList from '@/components/music-list/index.vue';
import MmDialog from '@/base/mm-dialog/index.vue';

// -------- refs --------
const dialogRef = ref(null);

// -------- store --------
const store = usePlayerStore();

const playlist = computed(() => store.playlist);
const currentMusic = computed(() => store.currentMusic);
const playing = computed(() => store.playing);

// -------- methods --------
function clearList() {
  store.clearPlayList();
  window.$mmToast?.('列表清空成功');
}

function selectItem(item, index) {
  if (item.id !== currentMusic.value.id) {
    store.currentIndex = index;
    store.playing = true;
  }
}

function deleteItem(index) {
  const list = [...playlist.value];
  list.splice(index, 1);
  store.removerPlayListItem({ list, index });
  window.$mmToast?.('删除成功');
}
</script>
