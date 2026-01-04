import { usePlayerStore } from '@/stores';

export function useList(list: any[]) {
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
