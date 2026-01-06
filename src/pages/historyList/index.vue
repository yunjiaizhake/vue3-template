<template>
  <!--我听过的（播放历史）-->
  <div class="historyList">
    <music-list
      :list="historyList"
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

    <bb-dialog
      ref="dialogRef"
      body-text="是否清空播放历史列表"
      confirm-btn-text="清空"
      @confirm="clearList"
    />
  </div>
</template>

<script setup>
import { usePlayerStore } from '@/stores';
import MusicList from '@/components/music-list/index.vue';
import BbDialog from '@/base/bb-dialog/index.vue';

// ------------------------------ store ------------------------------
const store = usePlayerStore();

// ------------------------------ refs ------------------------------
const dialogRef = useTemplateRef('dialogRef');

// ------------------------------ computed ------------------------------
const historyList = computed(() => store.historyList);
const playing = computed(() => store.playing);
const currentMusic = computed(() => store.currentMusic);

// ------------------------------ methods ------------------------------

// 清空列表事件
function clearList() {
  store.clearHistory();
  // 全局 toast（与 Vue2 一致）
  window.$bbToast
    ? window.$bbToast('列表清空成功')
    : console.log('列表清空成功');
}

// 播放事件
function selectItem(item, index) {
  store.selectPlay({
    list: historyList.value,
    index,
  });
}

// 删除事件
function deleteItem(index) {
  const list = [...historyList.value];
  list.splice(index, 1);
  store.removeHistory(list);
  window.$bbToast ? window.$bbToast('删除成功') : console.log('删除成功');
}

// 设置播放状态
function setPlaying(value) {
  store.setPlaying(value);
}
</script>
