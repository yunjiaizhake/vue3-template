import { defineStore } from 'pinia';
import type { SunoMusicItem, SongDetailItem } from '@/types/dataTypes';
import {
  getAIMusicList,
  setAIMusicList,
  removeAIMusic,
  clearAIMusicList,
} from '@/utils/storage';

type TaggedSunoItem = SunoMusicItem & { _taskId?: string };

function sunoToSongDetail(item: SunoMusicItem, taskId: string): SongDetailItem {
  return {
    id: item.id,
    name: item.title,
    singer: item.tags,
    album: 'AI Music',
    image: item.imageUrl,
    duration: item.duration,
    url: item.sourceAudioUrl,
    isAIMusic: true,
    taskId,
    audioId: item.id,
  };
}

function loadInitialState() {
  const sunoList = getAIMusicList() as TaggedSunoItem[];
  const songList = sunoList.map((item) => sunoToSongDetail(item, item._taskId || ''));
  return { sunoList, songList };
}

export const useAIMusicStore = defineStore('aiMusic', {
  state: () => loadInitialState(),

  getters: {
    count: (state) => state.songList.length,
  },

  actions: {
    addSongs(items: SunoMusicItem[], taskId: string) {
      const newItems = items.filter((item) => !this.sunoList.some((s) => s.id === item.id));
      if (newItems.length === 0) return;
      for (const item of newItems) {
        const tagged: TaggedSunoItem = { ...item, _taskId: taskId };
        this.sunoList.unshift(tagged);
        this.songList.unshift(sunoToSongDetail(item, taskId));
      }
      setAIMusicList(this.sunoList);
    },

    addSong(item: SunoMusicItem, taskId: string) {
      this.addSongs([item], taskId);
    },

    removeSong(id: string) {
      this.sunoList = this.sunoList.filter((s) => s.id !== id);
      this.songList = this.songList.filter((s) => s.id !== id);
      removeAIMusic(id);
    },

    clearAll() {
      this.sunoList = [];
      this.songList = [];
      clearAIMusicList();
    },
  },
});
