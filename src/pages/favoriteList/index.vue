<template>
  <!--我收藏的（收藏列表）-->
  <div class="favoriteList">
    <music-list
      :list="favoriteList"
      list-type="duration"
      @select="selectItem"
      @del="deleteItem"
    >
      <template #listBtn>
        <div class="list-btn">
          <span @click="dialogRef!.show()">清空列表</span>
        </div>
      </template>
    </music-list>

    <bb-dialog
      ref="dialogRef"
      body-text="是否清空收藏列表"
      confirm-btn-text="清空"
      @confirm="clearList"
    />
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores';
import { useFavoriteStore } from '@/stores/favorite_list';
import MusicList from '@/components/music-list/index.vue';
import BbDialog from '@/base/bb-dialog/index.vue';
import type { SongDetailItem } from '@/types/dataTypes';

const { proxy } = getCurrentInstance()!;

// ------------------------------ store ------------------------------
const favoriteStore = useFavoriteStore();
const playerStore = usePlayerStore();

// ------------------------------ refs ------------------------------
const dialogRef = useTemplateRef('dialogRef');

// ------------------------------ computed ------------------------------
const favoriteList = computed(() => favoriteStore.favoriteList);

// ------------------------------ methods ------------------------------

onMounted(() => {
  favoriteStore.initFavoriteList();
});

// 清空列表事件
function clearList() {
  favoriteStore.clearFavorite();
  proxy!.$bbToast('列表清空成功');
}

// 播放事件
function selectItem(_item: SongDetailItem, index: number) {
  playerStore.selectPlay({
    list: favoriteList.value,
    index,
  });
}

// 删除事件
function deleteItem(index: number) {
  const list = [...favoriteList.value];
  list.splice(index, 1);
  favoriteStore.removeFavorite(list);
  proxy!.$bbToast('删除成功');
}
</script>
