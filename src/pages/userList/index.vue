<template>
  <!--我的歌单-->
  <div class="userList">
    <bb-loading :value="bbLoadShow" />

    <template v-if="list.length > 0">
      <div
        v-for="item in formatList"
        :key="item.id"
        class="list-item"
        :title="item.name"
      >
        <router-link
          :to="{ path: `/music/details/${item.id}` }"
          custom
          v-slot="{ navigate }"
        >
          <div class="userList-item" @click="navigate">
            <img
              v-lazy="`${item.coverImgUrl}?param=200y200`"
              class="cover-img"
            />
            <h3 class="name">{{ item.name }}</h3>
          </div>
        </router-link>
      </div>
    </template>

    <bb-no-result v-else title="啥也没有哦，快去登录看看吧！" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'music-userlist' });

import { usePlayerStore } from '@/stores';
import { getUserPlaylist } from '@/api';
import BbLoading from '@/base/bb-loading/index.vue';
import BbNoResult from '@/base/bb-no-result/index.vue';
import { useLoad } from '@/hooks/useload';
import type { PlaylistItem } from '@/types/dataTypes';

// ------------------------------ store & hooks ------------------------------
const playerStore = usePlayerStore();
const { bbLoadShow, _hideLoad } = useLoad();

// ------------------------------ 数据 ------------------------------
const list = ref<PlaylistItem[]>([]);

// ------------------------------ computed ------------------------------
const uid = computed<string | null>(() => playerStore.uid || null);

const formatList = computed(() => {
  return list.value.filter((item) => item.trackCount > 0);
});

// ------------------------------ watch ------------------------------
watch(uid, (newUid) => {
  if (newUid) {
    bbLoadShow.value = true;
    _getUserPlaylist(newUid);
  } else {
    list.value = [];
  }
});

// ------------------------------ 生命周期 ------------------------------
onMounted(() => {
  if (!uid.value) {
    bbLoadShow.value = false;
  }
});

onActivated(() => {
  if (uid.value && list.value.length === 0) {
    bbLoadShow.value = true;
    _getUserPlaylist(uid.value);
  } else if (!uid.value && list.value.length !== 0) {
    list.value = [];
  }
});

// ------------------------------ methods ------------------------------

// 获取我的歌单详情
function _getUserPlaylist(uid: string) {
  getUserPlaylist(uid).then((res) => {
    if (res.playlist.length === 0) {
      return;
    }
    list.value = res.playlist.slice(1);
    _hideLoad();
  });
}
</script>

<style lang="less" scoped>
.userList {
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  &-head {
    height: 100px;
  }
  .list-item {
    float: left;
    width: calc(~'100% / 7');
    .userList-item {
      width: 130px;
      text-align: center;
      cursor: pointer;
      margin: 0 auto 20px;
      &:hover {
        color: #fff;
      }
      .name {
        height: 30px;
        line-height: 30px;
        font-size: @font_size_medium;
        .no-wrap();
      }
      @media (max-width: 1100px) {
        width: 80%;
      }
    }
    @media (max-width: 1500px) {
      width: calc(~'100% / 6');
    }
    @media (max-width: 1400px), (max-width: 960px) {
      width: calc(~'100% / 5');
    }
    @media (max-width: 1280px), (max-width: 768px) {
      width: calc(~'100% / 4');
    }
    @media (max-width: 540px) {
      width: calc(~'100% / 3');
    }
  }
}
</style>
