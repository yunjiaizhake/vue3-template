import { BBPlayer_CONFIG } from '@/config';
import type { SongDetailItem } from '@/types/dataTypes';

const STORAGE = window.localStorage;
const storage = {
  get<T>(key: string, data: T): T {
    if (!STORAGE) return data;
    const value = STORAGE.getItem(key);
    if (value === null) return data;
    return (Array.isArray(data) ? JSON.parse(value) : value) as T;
  },
  set(key: string, val: string | number | boolean | null) {
    if (STORAGE) {
      STORAGE.setItem(key, String(val));
    }
  },
  clear(key: string) {
    if (STORAGE) {
      STORAGE.removeItem(key);
    }
  },
};

/**
 * 播放历史
 * @type    HISTORYLIST_KEY：key值
 *          HistoryListMAX：最大长度
 */
const HISTORYLIST_KEY = '__bbPlayer_historyList__';
const HistoryListMAX = 200;
// 获取播放历史
export function getHistoryList(): SongDetailItem[] {
  return storage.get<SongDetailItem[]>(HISTORYLIST_KEY, []);
}

// 更新播放历史，将当前播放的歌曲插入到列表最前面，如果插入后达到历史列表上限则删除最后一个
export function setHistoryList(music: SongDetailItem) {
  let list = storage.get<SongDetailItem[]>(HISTORYLIST_KEY, []);
  const index = list.findIndex((item: SongDetailItem) => {
    return item.id === music.id;
  });
  if (index === 0) {
    return list;
  }
  if (index > 0) {
    list.splice(index, 1);
  }
  list.unshift(music);
  if (HistoryListMAX && list.length > HistoryListMAX) {
    list.pop();
  }
  storage.set(HISTORYLIST_KEY, JSON.stringify(list));
  return list;
}

// 删除一条播放历史
export function removeHistoryList(music: SongDetailItem[]): SongDetailItem[] {
  storage.set(HISTORYLIST_KEY, JSON.stringify(music));
  return music;
}

// 清空播放历史
export function clearHistoryList() {
  storage.clear(HISTORYLIST_KEY);
  return [];
}

/**
 * 播放模式
 * @type    MODE_KEY：key值
 *          HistoryListMAX：最大长度
 */
const MODE_KEY = '__bbPlayer_mode__';
// 获取播放模式
export function getMode() {
  return Number(storage.get(MODE_KEY, BBPlayer_CONFIG.PLAY_MODE));
}
// 修改播放模式
export function setMode(mode: number) {
  storage.set(MODE_KEY, mode);
  return mode;
}

/**
 * 网易云用户uid
 * @type USERID_KEY：key值
 */
const USERID_KEY = '__bbPlayer_userID__';
// 获取用户uid
export function getUserId() {
  return String(storage.get(USERID_KEY, null));
}
// 修改用户uid
export function setUserId(uid: string | null) {
  storage.set(USERID_KEY, uid);
  return uid;
}

/**
 * 用户 cookie
 * @type COOKIE_KEY：key值
 */
const COOKIE_KEY = '__bbPlayer_cookie__';
// 获取 cookie
export function getCookie() {
  return String(storage.get(COOKIE_KEY, ''));
}
// 修改 cookie
export function setCookie(cookie: string) {
  storage.set(COOKIE_KEY, cookie);
  return cookie;
}
// 清除 cookie
export function clearCookie() {
  storage.clear(COOKIE_KEY);
  return '';
}

/**
 * 音量
 * @type VOLUME_KEY：key值
 */
const VOLUME_KEY = '__bbPlayer_volume__';
// 获取音量
export function getVolume() {
  const volume = storage.get(VOLUME_KEY, BBPlayer_CONFIG.VOLUME);
  return Number(volume);
}
// 修改音量
export function setVolume(volume: number) {
  storage.set(VOLUME_KEY, volume);
  return volume;
}

/**
 * 收藏列表-----------------------------------------------------------------------------------------------------
 * @type    FAVORITELIST_KEY：key值
 *          FavoriteListMAX：最大长度
 */
const FAVORITELIST_KEY = '__bbPlayer_favoriteList__';
const FavoriteListMAX = 200;
// 获取收藏列表
export function getFavoriteList(): SongDetailItem[] {
  return storage.get<SongDetailItem[]>(FAVORITELIST_KEY, []);
}

// 添加收藏
export function addFavorite(music: SongDetailItem) {
  let list = storage.get<SongDetailItem[]>(FAVORITELIST_KEY, []);
  const index = list.findIndex((item: SongDetailItem) => {
    return item.id === music.id;
  });
  if (index > -1) {
    return list;
  }
  list.unshift(music);
  if (FavoriteListMAX && list.length > FavoriteListMAX) {
    list.pop();
  }
  storage.set(FAVORITELIST_KEY, JSON.stringify(list));
  return list;
}

// 删除一条收藏（传入新列表）
export function removeFavoriteList(list: SongDetailItem[]): SongDetailItem[] {
  storage.set(FAVORITELIST_KEY, JSON.stringify(list));
  return list;
}

// 清空收藏列表
export function clearFavoriteList() {
  storage.clear(FAVORITELIST_KEY);
  return [];
}

// 收藏列表end----------------------------------------------------------------------------------
