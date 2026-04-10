import { defineStore } from 'pinia';
import type { SunoMusicItem, SongDetailItem } from '@/types/dataTypes';
import {
  getAIMusicList,
  setAIMusicList,
  clearAIMusicList,
  getUserId,
} from '@/utils/storage';
import {
  getAIMusicListByUid,
  saveAIMusicListByUid,
  removeAIMusicByUid,
} from '@/api';

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

function rebuildSongList(sunoList: TaggedSunoItem[]): SongDetailItem[] {
  return sunoList.map((item) => sunoToSongDetail(item, item._taskId || ''));
}

function loadFromLocal(): TaggedSunoItem[] {
  return getAIMusicList() as TaggedSunoItem[];
}

export const useAIMusicStore = defineStore('aiMusic', {
  state: () => {
    const sunoList = loadFromLocal();
    return {
      sunoList,
      songList: rebuildSongList(sunoList),
      uid: getUserId() || null as string | null,
    };
  },

  getters: {
    count: (state) => state.songList.length,
  },

  actions: {
    hasValidUid(uid: string | null) {
      return !!uid && uid !== 'null';
    },

    setUid(uid: string | null) {
      this.uid = uid;
      this.initList();
    },

    async initList() {
      if (this.hasValidUid(this.uid)) {
        try {
          const res = await getAIMusicListByUid(this.uid as string);
          this.sunoList = (res.data || []) as TaggedSunoItem[];
          this.songList = rebuildSongList(this.sunoList);
          return;
        } catch {
          this.sunoList = [];
          this.songList = [];
          return;
        }
      }
      this.sunoList = loadFromLocal();
      this.songList = rebuildSongList(this.sunoList);
    },

    async persistList() {
      if (this.hasValidUid(this.uid)) {
        try {
          await saveAIMusicListByUid(this.uid as string, this.sunoList);
        } catch {
          // 数据库保存失败时静默处理
        }
        return;
      }
      setAIMusicList(this.sunoList);
    },

    addSongs(items: SunoMusicItem[], taskId: string) {
      const newItems = items.filter(
        (item) => !this.sunoList.some((s) => s.id === item.id),
      );
      if (newItems.length === 0) return;
      for (const item of newItems) {
        const tagged: TaggedSunoItem = { ...item, _taskId: taskId };
        this.sunoList.unshift(tagged);
        this.songList.unshift(sunoToSongDetail(item, taskId));
      }
      this.persistList();
    },

    addSong(item: SunoMusicItem, taskId: string) {
      this.addSongs([item], taskId);
    },

    async removeSong(id: string) {
      this.sunoList = this.sunoList.filter((s) => s.id !== id);
      this.songList = this.songList.filter((s) => s.id !== id);
      if (this.hasValidUid(this.uid)) {
        try {
          await removeAIMusicByUid(this.uid as string, id);
        } catch {
          // 删除失败静默处理
        }
      } else {
        setAIMusicList(this.sunoList);
      }
    },

    clearAll() {
      this.sunoList = [];
      this.songList = [];
      if (this.hasValidUid(this.uid)) {
        this.persistList();
      } else {
        clearAIMusicList();
      }
    },
  },
});
