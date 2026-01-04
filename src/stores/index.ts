import { defineStore } from 'pinia';
import {
  getHistoryList,
  getMode,
  getUserId,
  clearHistoryList,
  setHistoryList,
  removeHistoryList,
  setMode,
  setUserId,
} from '@/utils/storage';

function findIndex(list, music) {
  return list.findIndex((item) => item.id === music.id);
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    audioEle: null, // audio元素
    mode: getMode(), // 播放模式，默认列表循环
    playing: false, // 播放状态
    playlist: [], // 播放列表
    orderList: [], // 顺序列表
    currentIndex: -1, // 当前音乐索引
    historyList: getHistoryList() || [], // 播放历史列表
    uid: getUserId() || null, // 网易云用户UID
  }),

  getters: {
    // 当前音乐
    currentMusic: (state) => {
      return state.playlist[state.currentIndex] || {};
    },
  },

  actions: {
    // 修改audio元素
    setAudioEle(audioEle) {
      this.audioEle = audioEle;
    },

    // 修改播放模式
    setPlayMode(mode) {
      this.mode = setMode(mode);
    },

    // 修改播放状态
    setPlaying(playing) {
      this.playing = playing;
    },

    // 修改播放列表
    setPlaylist({ list }) {
      this.playlist = list;
      this.orderList = list;
    },

    // 修改顺序列表
    setOrderList(orderList) {
      this.orderList = orderList;
    },

    // 修改当前音乐索引
    setCurrentIndex(currentIndex) {
      this.currentIndex = currentIndex;
    },

    // 修改播放历史列表
    setHistoryList(historyList) {
      this.historyList = historyList;
    },

    // 修改网易云用户UID
    setUid(uid) {
      this.uid = setUserId(uid);
    },

    // 选择播放（会更新整个播放列表）
    selectPlay({ list, index }) {
      this.playlist = list;
      this.orderList = list;
      this.currentIndex = index;
      this.playing = true;
    },

    // 选择播放（会插入一条到播放列表）
    selectAddPlay(music) {
      let list = [...this.playlist];
      // 查询当前播放列表是否有代插入的音乐，并返回其索引值
      let index = findIndex(list, music);
      // 当前播放列表有待插入的音乐时，直接改变当前播放音乐的索引值
      if (index > -1) {
        this.currentIndex = index;
      } else {
        list.unshift(music);
        this.playlist = list;
        this.orderList = list;
        this.currentIndex = 0;
      }
      this.playing = true;
    },

    // 清空播放列表
    clearPlayList() {
      this.playing = false;
      this.currentIndex = -1;
      this.playlist = [];
      this.orderList = [];
    },

    // 删除正在播放列表中的歌曲
    removerPlayListItem({ list, index }) {
      let currentIndex = this.currentIndex;
      if (index < this.currentIndex || list.length === this.currentIndex) {
        currentIndex--;
        this.currentIndex = currentIndex;
      }
      this.playlist = list;
      this.orderList = list;
      if (!list.length) {
        this.playing = false;
      } else {
        this.playing = true;
      }
    },

    // 设置播放历史
    setHistory(music) {
      this.historyList = setHistoryList(music);
    },

    // 删除播放历史
    removeHistory(music) {
      this.historyList = removeHistoryList(music);
    },

    // 清空播放历史
    clearHistory() {
      this.historyList = clearHistoryList();
    },
  },
});
