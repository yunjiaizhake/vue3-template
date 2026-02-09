import { defineStore } from 'pinia';
import {
  getFavoriteList,
  removeFavoriteList,
  getUserId,
} from '@/utils/storage';
import { getFavoriteListByUid, saveFavoriteListByUid } from '@/api';
import type { SongDetailItem } from '@/types/dataTypes';

function findIndex(list: SongDetailItem[], music: SongDetailItem) {
  return list.findIndex((item) => item.id == music.id);
}

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    favoriteList: getFavoriteList() || [],
    uid: getUserId() || null,
  }),
  actions: {
    // 判断是否有有效 uid
    hasValidUid(uid: string | null) {
      return !!uid && uid !== 'null';
    },

    // 更新 uid 并初始化
    setUid(uid: string | null) {
      this.uid = uid;
      this.initFavoriteList();
    },

    // 初始化收藏列表（有 uid 用数据库，没有用本地）
    async initFavoriteList() {
      if (this.hasValidUid(this.uid)) {
        try {
          const res = await getFavoriteListByUid(this.uid as string);
          this.favoriteList = res.data || [];
          return;
        } catch {
          this.favoriteList = [];
          return;
        }
      }
      this.favoriteList = getFavoriteList() || [];
    },

    // 持久化收藏列表（有 uid 存数据库，否则 localStorage）
    async persistFavoriteList(list: SongDetailItem[]) {
      if (this.hasValidUid(this.uid)) {
        try {
          const res = await saveFavoriteListByUid(this.uid as string, list);
          this.favoriteList = res.data || list;
          return;
        } catch {
          this.favoriteList = list;
          return;
        }
      }
      this.favoriteList = removeFavoriteList(list);
    },

    // 切换收藏状态
    async toggleFavorite(music: SongDetailItem, update = false) {
      const list = [...this.favoriteList];
      const index = findIndex(list, music);
      // ✅ 已存在
      if (index > -1) {
        if (update) {
          // 更新已有项
          list[index] = { ...list[index], ...music };
        } else {
          // 删除已有项
          list.splice(index, 1);
        }
        await this.persistFavoriteList(list);
        return;
      }
      // ✅ 不存在 → 添加
      const nextList = [music, ...list].slice(0, 200);
      await this.persistFavoriteList(nextList);
    },

    // 删除收藏
    async removeFavorite(list: SongDetailItem[]) {
      await this.persistFavoriteList(list);
    },

    // 清空收藏
    async clearFavorite() {
      await this.persistFavoriteList([]);
    },
  },
});
