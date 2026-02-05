import type { Ref } from 'vue';
import { getAiChat, getFavoriteListByUid } from '@/api';
import type { SongDetailItem } from '@/types/dataTypes';
import { getFavoriteList, getRecommendHistory, getUserId } from '@/utils/storage';

type ToastPosition = 'top' | 'center' | 'bottom';
type ToastFn = (msg: string, position?: ToastPosition, duration?: number) => void;


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
}) {
  const { isAiRecommendActive, toast } = options;
  const uid = getUserId();
  console.log('uid', uid, typeof uid);
  let favorites: SongDetailItem[] = [];
  if (uid && uid !== 'null') {
    try {
      const res = await getFavoriteListByUid(uid);
      favorites = res.data || [];
    } catch {
      toast?.('获取收藏列表失败，请稍后再试');
      return;
    }
  } else {
    favorites = getFavoriteList();
    console.log('favorites', favorites);
  }
  if (!favorites.length) {
    toast?.('收藏列表为空，可以收藏几首喜欢的歌再来找我推荐哦');
    return;
  }
  isAiRecommendActive.value = true;
  toast?.('正在根据您的收藏为你推荐...', 'center', 0);
  const payload = favorites.map((item) => ({
    name: item.name,
    singer: item.singer,
    album: item.album,
    lovePercent: item.lovePercent,
  }));
  const history = getRecommendHistory();
  const historyText = history.length ? `\n已推荐列表（不要重复）：${history.join('、')}` : '';
  const prompt = `请根据以下收藏歌曲列表分析风格，推荐一首还可能喜欢的歌曲。其中lovePercent为用户对这首歌的喜欢程度，满分100分。你必须调用 play_song 工具\n收藏列表：${JSON.stringify(
    payload,
  )}${historyText}`;
  try {
    await getAiChat(prompt);
    window.setTimeout(() => {
      if (isAiRecommendActive.value) {
        toast?.('网络开小差了，请稍后再试');
      }
    }, 10000);
  } catch {
    toast?.('推荐请求失败，请稍后再试');
  }
}
