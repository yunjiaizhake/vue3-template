import type { Ref } from 'vue';
import {
  getAiChat,
  getFavoriteListByUid,
  recommendLoveHundredSong,
  getFMList,
} from '@/api';
import type { SongDetailItem, FMList } from '@/types/dataTypes';
import {
  getFavoriteList,
  getRecommendHistory,
  addRecommendHistory,
  getUserId,
  getCookie,
} from '@/utils/storage';
import { searchAndPlay } from '@/utils/aiplay';
import { useAiEventBusStore } from '@/stores/aiEventBus';
import { usePlayerStore } from '@/stores/index';
import { writeRecommendRecord } from '@/utils/recommendRecord';

type ToastPosition = 'top' | 'center' | 'bottom';
type ToastFn = (msg: string, position?: ToastPosition, duration?: number) => void;
const uid = getUserId();
const cookie = getCookie();
let FMSongNumber: number = 0;
let FMSongList: FMList[] = [];

// 沉浸式体验
export async function toggleImmersive(options: {
  isImmersive: Ref<boolean>;
  isMusicPlay: () => boolean;
  doc?: Document;
  fullscreenTarget?: HTMLElement;
}) {
  const {
    isImmersive,
    isMusicPlay,
    doc = document,
    fullscreenTarget = document.documentElement,
  } = options;

  if (isImmersive.value) {
    isImmersive.value = false;
    if (doc.fullscreenElement) {
      await doc.exitFullscreen();
    }
    return;
  }
  if (!isMusicPlay()) return;
  isImmersive.value = true;
  if (!doc.fullscreenElement) {
    await fullscreenTarget.requestFullscreen();
  }
}

// 为您推荐
export async function recommendFromFavorites(options: {
  isAiRecommendActive: Ref<boolean>;
  toast?: ToastFn;
  aiBus?: ReturnType<typeof useAiEventBusStore>;
}) {
  const { isAiRecommendActive, toast, aiBus } = options;

  // 优先消费 queue_song MCP 工具暂存的关键词队列，每次取第一个并移除（Set去重）
  const bus = aiBus ?? useAiEventBusStore();
  if (bus.queued_songs.length > 0) {
    const artistOrMood = bus.pop_queued_song();
    if (artistOrMood) {
      await searchAndPlay(artistOrMood);
      return;
    }
  }
  const userId = uid && uid !== 'null' ? uid : '00000000';
  isAiRecommendActive.value = true;
  let favorites: SongDetailItem[] = [];
  if (uid && uid !== 'null') {
    try {
      const favRes = await getFavoriteListByUid(uid);
      favorites = favRes.data || [];
    } catch {
      isAiRecommendActive.value = false;
      toast?.('获取收藏列表失败，请稍后再试');
      return;
    }
  } else {
    favorites = getFavoriteList();
  }
  if (!favorites.length) {
    isAiRecommendActive.value = false;
    toast?.('收藏列表为空，可以收藏几首喜欢的歌再来找我推荐哦');
    return;
  }
  toast?.('正在为您智能推荐适合您的歌曲，请稍候...', 'center', 0);
  try {
    const history = getRecommendHistory();
    const res = await recommendLoveHundredSong(userId, history);

    // 通过协同过滤算法拿到了歌曲，搜索并加入正在播放列表
    if (res?.data?.songName) {
      const song = await searchAndPlay(res.data.songName);
      if (song) {
        toast?.('已为您推荐歌曲：' + song.name, 'center', 3000);
        addRecommendHistory(`${song.singer}：${song.name}`);
      }
      isAiRecommendActive.value = false;
      // 推荐成功后异步写入数据库记录（写入的是本次推荐出来的歌曲）
      writeRecommendRecord(userId, favorites, {
        name: res.data.name || res.data.songName,
        singer: res.data.singer || '',
        musicId: res.data.musicId || '',
        source: 'collaborative',
      });
      return;
    }
    // 协同过滤没有拿到歌曲，走网易FM歌曲
    if ((!FMSongList.length || FMSongNumber == FMSongList.length) && cookie) {
      FMSongList = (await getFMList()).data;
      console.log('正在为您推荐歌曲：', FMSongList);
      FMSongNumber = 0;
    }

    if (FMSongList[FMSongNumber]) {
      const fmSong = FMSongList[FMSongNumber]!;
      const song = await searchAndPlay(fmSong.name);
      if (song) {
        toast?.('已为您推荐歌曲：' + song.name, 'center', 3000);
        addRecommendHistory(`${song.singer}：${song.name}`);
      }
      isAiRecommendActive.value = false;
      // 推荐成功后异步写入数据库记录（写入的是FM推荐出来的歌曲）
      writeRecommendRecord(userId, favorites, {
        name: fmSong.name,
        musicId: fmSong.id || '',
        source: 'collection',
      });
      FMSongNumber++;
      return;
    }
    const payload = favorites.map((item) => ({
      name: item.name,
      singer: item.singer,
      album: item.album,
      lovePercent: item.lovePercent,
    }));
    const historyText = history.length
      ? `\n已推荐列表（不要重复）：${history.join('、')}`
      : '';
    const prompt = `请根据以下收藏歌曲列表分析风格，推荐一首还可能喜欢的歌曲。其中lovePercent为用户对这首歌的喜欢程度，满分100分。你必须调用 play_song 工具\n收藏列表：${JSON.stringify(
      payload,
    )}${historyText}`;
    await getAiChat(prompt, uid);
    // 大模型兜底：AI推荐的歌曲通过play_song工具播放后会自动成为currentMusic
    const store = usePlayerStore();
    writeRecommendRecord(userId, favorites, {
      name: store.currentMusic?.name || '',
      singer: store.currentMusic?.singer || '',
      musicId: store.currentMusic?.id ? String(store.currentMusic.id) : '',
      source: 'dialog',
    });
    window.setTimeout(() => {
      if (isAiRecommendActive.value) {
        toast?.('网络开小差了，请稍后再试');
      }
    }, 10000);
  } catch {
    toast?.('推荐请求失败，请稍后再试');
  }
}
