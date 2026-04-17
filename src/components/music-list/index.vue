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
          :class="{ on: playing && currentMusic.id == item.id }"
          @dblclick="selectItem(item, index, $event)"
        >
          <span class="list-num">{{ index + 1 }}</span>

          <div class="list-name">
            <span>{{ item.name }}</span>

            <div class="list-menu">
              <bb-icon
                class="hover list-menu-icon-fav"
                :style="getFavStyle(item.id)"
                :type="getFavIconType(item.id)"
                :size="40"
                @mousedown.left.stop.prevent="onFavPressStart(item)"
                @mouseup.left.stop.prevent="onFavPressEnd(item)"
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
import { useFavoriteStore } from '@/stores/favorite_list';
import { addLoveHundredUser, removeLoveHundredUser } from '@/api';
import BbNoResult from '@/base/bb-no-result/index.vue';
import { format } from '@/utils/util';
import type { SongObjectType } from '@/types/dataTypes';

const LIST_TYPE_ALBUM = 'album'; // 列表尾列显示专辑信息
const LIST_TYPE_DURATION = 'duration'; // 列表尾列显示时长并带删除按钮
const LIST_TYPE_PULLUP = 'pullup'; // 支持上拉加载更多（触发 pullUp 事件）
const THRESHOLD = 100; // 上拉触发阈值
const FAV_HOLD_MS = 2000; // 长按时长（ms）
const FAV_TICK_MS = 100; // 长按进度刷新间隔
const FAV_CLICK_MS = 200; // 长按点击时间,长按的时间低于这个时间就当作点击处理

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
const store = usePlayerStore(); // 播放器状态
const favoriteStore = useFavoriteStore(); // 收藏状态
const playing = computed(() => store.playing); // 是否播放中
const currentMusic = computed(() => store.currentMusic); // 当前播放歌曲
const favoriteList = computed(() => favoriteStore.favoriteList); // 收藏列表

// ------------------------------ state ------------------------------
const listContent = useTemplateRef<HTMLDivElement>('listContent'); // 列表容器
const lockUp = ref(true); // 上拉锁
const scrollTop = ref(0); // 记住滚动位置
const favHoldTimer = ref<number | null>(null); // 长按计时器
const favHoldStart = ref(0); // 长按开始时间
const favHoldItemId = ref<string | null>(null); // 当前长按的歌曲 id
const favHoldPercent = ref(0); // 长按进度，也可以说是当前操作歌曲的喜爱进度

// ------------------------------ computed ------------------------------
const isDuration = computed(() => props.listType == LIST_TYPE_DURATION); // 是否显示时长列

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
// 处理列表滚动和上拉触发
function listScroll(e: Event) {
  const el = e.target as HTMLElement;
  scrollTop.value = el.scrollTop;

  if (props.listType !== LIST_TYPE_PULLUP || lockUp.value) return;

  if (el.scrollTop + el.offsetHeight >= el.scrollHeight - THRESHOLD) {
    lockUp.value = true;
    emit('pullUp');
  }
}

// 列表回到顶部
function scrollTo() {
  listContent.value!.scrollTop = 0;
}

// 选择/播放歌曲
function selectItem(item: SongObjectType, index: number, e: Event) {
  const el = e.target as HTMLElement;
  if (e && /list-menu-icon-del/.test(el.className)) return;

  if (currentMusic.value.id && item.id == currentMusic.value.id) {
    store.playing = !playing.value;
    return;
  }

  emit('select', item, index);
}

// 播放按钮图标
function getPlayIconType({ id }: SongObjectType) {
  return playing.value && currentMusic.value.id == id
    ? 'pause-mini'
    : 'play-mini';
}

// 是否已收藏
function isFavorite(id: string) {
  return favoriteList.value.some((item) => item.id == id);
}

// 读取已收藏喜爱度
function getFavoritePercent(id: string) {
  const item = favoriteList.value.find((item) => item.id == id);
  return item?.lovePercent ?? 100;
}

// 获取当前进度条显示值
function getFavHoldPercent(id: string) {
  const percent =
    favHoldItemId.value == id
      ? favHoldPercent.value
      : isFavorite(id)
        ? getFavoritePercent(id)
        : 0;
  return Math.max(0, Math.min(100, percent));
}

// 收藏图标渐变样式
function getFavStyle(id: string) {
  return { '--fav-fill': `${getFavHoldPercent(id)}%` };
}

// 收藏图标类型
function getFavIconType(id: string) {
  return getFavHoldPercent(id) > 0 ? 'aixin1' : 'aixin';
}

// 清理长按状态
function clearFavHold() {
  if (favHoldTimer.value) {
    clearInterval(favHoldTimer.value);
    favHoldTimer.value = null;
  }
  favHoldStart.value = 0;
  favHoldItemId.value = null;
  favHoldPercent.value = 0;
}

// 收藏按钮按下（已收藏也支持长按增长）
function onFavPressStart(item: SongObjectType) {
  const id = item.id;
  const favPercent = getFavHoldPercent(id);
  clearFavHold();
  const startTime = performance.now();
  favHoldItemId.value = id;
  favHoldStart.value = startTime;
  favHoldPercent.value = favPercent;
  favHoldTimer.value = window.setInterval(() => {
    const elapsed = performance.now() - startTime;
    const percent = Math.min(100, (elapsed / FAV_HOLD_MS) * 100 + favPercent);
    favHoldPercent.value = percent;
  }, FAV_TICK_MS);
}

// 收藏按钮抬起（未收藏时才计算进度）
async function onFavPressEnd(item: SongObjectType) {
  let elapsed = favHoldStart.value ? performance.now() - favHoldStart.value : 0;
  if (elapsed < FAV_CLICK_MS) {
    onFavClick(item);
    clearFavHold();
    return;
  }
  const percent = getFavHoldPercent(item.id);
  // 先停定时器，但保留 favHoldItemId 和 favHoldPercent 防止进度闪回
  if (favHoldTimer.value) {
    clearInterval(favHoldTimer.value);
    favHoldTimer.value = null;
  }
  await toggleFavorite({ ...item, lovePercent: percent }, true);
  clearFavHold();
}

function getLoveHundredUserId() {
  return store.uid && store.uid !== 'null' ? store.uid : '00000000';
}

// 喜爱度达到100或从100跌出去时触发
async function syncLoveHundredUsers(
  musicId: string,
  name: string,
  singer: string,
  lovePercent: number,
) {
  const userId = getLoveHundredUserId();
  if (lovePercent >= 100) {
    await addLoveHundredUser(musicId, userId, name, singer);
    return;
  }
  await removeLoveHundredUser(musicId, userId, name, singer);
}

// 点击收藏按钮（改为在mouseup时候决定调用与否）
function onFavClick(item: SongObjectType) {
  clearFavHold();
  if (isFavorite(item.id)) {
    toggleFavorite(item);
    return;
  }
  toggleFavorite({ ...item, lovePercent: 10 });
}

// 切换收藏状态
async function toggleFavorite(item: SongObjectType, update = false) {
  await favoriteStore.toggleFavorite(item, update);
  await syncLoveHundredUsers(item.id, item.name, item.singer, item.lovePercent ?? 0);
}

// 删除列表项
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
    --fav-fill: 0%;
    color: @text_color;
    background-image: linear-gradient(
      to top,
      #ff4d4f 0%,
      #ff4d4f var(--fav-fill),
      currentColor var(--fav-fill),
      currentColor 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
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
