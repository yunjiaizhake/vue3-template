<template>
  <div class="music-list flex-col">
    <template v-if="list.length > 0">
      <div class="list-item list-header">
        <span class="list-name">歌曲</span>
        <span class="list-artist">歌手</span>
        <span v-if="isDuration" class="list-time">时长</span>
        <span v-else class="list-album">专辑</span>
      </div>

      <div ref="listContent" class="list-content" @scroll="listScroll($event)">
        <div
          v-for="(item, index) in list"
          :key="item.id"
          class="list-item"
          :class="{ on: playing && currentMusic.id === item.id }"
          @dblclick="selectItem(item, index, $event)"
        >
          <span class="list-num">{{ index + 1 }}</span>

          <div class="list-name">
            <span>{{ item.name }}</span>

            <div class="list-menu">
              <bb-icon
                class="hover list-menu-icon-fav"
                :class="{ 'is-favorite': isFavorite(item.id) }"
                :type="isFavorite(item.id) ? 'aixin1' : 'aixin'"
                :size="40"
                @click.stop.prevent="toggleFavorite(item)"
                @dblclick.stop.prevent
              />
              <bb-icon
                class="hover"
                :type="getPlayIconType(item)"
                :size="40"
                @click.stop="selectItem(item, index, $event)"
              />
            </div>
          </div>

          <span class="list-artist">{{ item.singer }}</span>

          <span v-if="isDuration" class="list-time">
            {{ format(item.duration % 3600) }}
            <bb-icon
              class="hover list-menu-icon-del"
              type="delete-mini"
              :size="35"
              @click.stop="deleteItem(index)"
            />
          </span>

          <span v-else class="list-album">{{ item.album }}</span>
        </div>

        <slot name="listBtn"></slot>
      </div>
    </template>

    <bb-no-result v-else title="弄啥呢，怎么啥也没有！！！" />
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores/index.ts';
import BbNoResult from '@/base/bb-no-result/index.vue';
import { format } from '@/utils/util';
import type { SongObjectType } from '@/types/dataTypes';

const LIST_TYPE_ALBUM = 'album';
const LIST_TYPE_DURATION = 'duration';
const LIST_TYPE_PULLUP = 'pullup';
const THRESHOLD = 100;

// ------------------------------ props ------------------------------
const props = defineProps({
  list: {
    type: Array as PropType<SongObjectType[]>,
    default: () => [],
  },
  listType: { type: String, default: LIST_TYPE_ALBUM },
});

// ------------------------------ emit ------------------------------
const emit = defineEmits(['select', 'del', 'pullUp']);

// ------------------------------ store ------------------------------
const store = usePlayerStore();
const playing = computed(() => store.playing);
const currentMusic = computed(() => store.currentMusic);
const favoriteList = computed(() => store.favoriteList);

// ------------------------------ state ------------------------------
const listContent = useTemplateRef<HTMLDivElement>('listContent');
const lockUp = ref(true);
const scrollTop = ref(0);

// ------------------------------ computed ------------------------------
const isDuration = computed(() => props.listType === LIST_TYPE_DURATION);

// ------------------------------ watch ------------------------------
watch(
  () => props.list,
  (newList, oldList) => {
    if (props.listType !== LIST_TYPE_PULLUP || !oldList?.length) return;

    if (
      newList.length !== oldList.length ||
      newList[newList.length - 1]?.id !== oldList[oldList.length - 1]?.id
    ) {
      lockUp.value = false;
    }
  },
);

// ------------------------------ keep-alive scroll 恢复 ------------------------------
onActivated(() => {
  if (scrollTop.value && listContent.value) {
    listContent.value.scrollTop = scrollTop.value;
  }
});

// ------------------------------ methods ------------------------------
function listScroll(e: Event) {
  const el = e.target as HTMLElement;
  scrollTop.value = el.scrollTop;

  if (props.listType !== LIST_TYPE_PULLUP || lockUp.value) return;

  if (el.scrollTop + el.offsetHeight >= el.scrollHeight - THRESHOLD) {
    lockUp.value = true;
    emit('pullUp');
  }
}

function scrollTo() {
  listContent.value!.scrollTop = 0;
}

function selectItem(item: SongObjectType, index: number, e: Event) {
  const el = e.target as HTMLElement;
  if (e && /list-menu-icon-del/.test(el.className)) return;

  if (currentMusic.value.id && item.id === currentMusic.value.id) {
    store.playing = !playing.value;
    return;
  }

  emit('select', item, index);
}

function getPlayIconType({ id }: SongObjectType) {
  return playing.value && currentMusic.value.id === id
    ? 'pause-mini'
    : 'play-mini';
}

function isFavorite(id: string) {
  return favoriteList.value.some((item) => item.id === id);
}

function toggleFavorite(item: SongObjectType) {
  store.toggleFavorite(item);
}

function deleteItem(index: number) {
  emit('del', index);
}

defineExpose({
  scrollTo,
});
</script>

<style lang="less" scoped>
.music-list {
  height: 100%;
}

.list-header {
  border-bottom: 1px solid @list_head_line_color;
  color: @text_color_active;

  .list-name {
    padding-left: 40px;
    user-select: none;
  }
}

.list-content {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.list-no {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: @text_color;
}

.list-item {
  display: flex;
  width: 100%;
  height: 50px;
  border-bottom: 1px solid @list_item_line_color;
  line-height: 50px;
  overflow: hidden;

  &.list-item-no {
    justify-content: center;
    align-items: center;
  }

  &.on {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.12);

    .list-num {
      // font-size: 0;
      background: url('~assets/img/wave.gif') no-repeat center center;
    }
  }

  &:hover {
    .list-name {
      padding-right: 80px;

      .list-menu {
        display: block;
      }
    }
  }

  &:not([class*='list-header']):hover {
    .list-name {
      padding-right: 80px;

      .list-menu {
        display: block;
      }
    }

    .list-time {
      font-size: 0;

      .list-menu-icon-del {
        display: block;
      }
    }
  }

  .list-num {
    display: block;
    width: 30px;
    margin-right: 10px;
    text-align: center;
  }

  .list-name {
    position: relative;
    flex: 1;
    box-sizing: border-box;

    & > span {
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }

    small {
      margin-left: 5px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }

    /*hover菜单*/

    .list-menu {
      display: none;
      position: absolute;
      top: 50%;
      right: 10px;
      height: 40px;
      font-size: 0;
      transform: translateY(-50%);
    }
  }

  .list-menu-icon-fav {
    margin-right: 12px;
  }
  .list-menu-icon-fav.is-favorite {
    color: #ff4d4f;
  }

  .list-artist,
  .list-album {
    display: block;
    width: 300px;
    .no-wrap();
    @media (max-width: 1440px) {
      width: 200px;
    }
    @media (max-width: 1200px) {
      width: 150px;
    }
  }

  .list-time {
    display: block;
    width: 60px;
    position: relative;

    .list-menu-icon-del {
      display: none;
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
    }
  }
}

@media (max-width: 960px) {
  .list-item .list-name {
    padding-right: 70px;
  }
}

@media (max-width: 768px) {
  .list-item {
    .list-name .list-menu {
      display: block;
    }

    .list-artist,
    .list-album {
      width: 20%;
    }
  }
}

@media (max-width: 640px) {
  .list-item {
    .list-artist {
      width: 80px;
    }

    .list-album,
    .list-time {
      display: none;
    }
  }
}
</style>
