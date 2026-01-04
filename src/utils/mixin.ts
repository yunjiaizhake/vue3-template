import { usePlayerStore } from '@/stores';

/**
 * 歌曲列表
 */
export function listMixin(list: any[]) {
  const playerStore = usePlayerStore();

  const playing = computed(() => playerStore.playing);
  const currentMusic = computed(() => playerStore.currentMusic);

  function selectItem(item: any, index: number) {
    if (item.id === currentMusic.value?.id && playing.value) {
      playerStore.setPlaying(false);
    } else {
      playerStore.selectPlay({
        list,
        index,
      });
    }
  }

  return {
    playing,
    currentMusic,
    selectItem,
  };
}

/**
 * loading状态
 */
export function loadMixin(delay = 200) {
  const mmLoadShow = ref(true);
  let timer: number | null = null;

  function _hideLoad() {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      mmLoadShow.value = false;
    }, delay);
  }

  return {
    mmLoadShow,
    _hideLoad,
  };
}
