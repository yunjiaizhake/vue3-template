import type { Ref } from 'vue';
import { getAiChat, getFavoriteListByUid, recommendLoveHundredSong,getFMList } from '@/api';
import type { SongDetailItem,FMList } from '@/types/dataTypes';
import { getFavoriteList, getRecommendHistory, getUserId, getCookie } from '@/utils/storage';
import { searchAndPlay } from "@/utils/aiplay"

type ToastPosition = 'top' | 'center' | 'bottom';
type ToastFn = (msg: string, position?: ToastPosition, duration?: number) => void;
const uid = getUserId();
const cookie = getCookie();
let FMSongNumber:number = 0;
let FMSongList:FMList[] = []


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
  toast?.('正在根据满喜爱度歌曲为你推荐...', 'center', 0);
  try {
    const history = getRecommendHistory();
    const res = await recommendLoveHundredSong(userId, history);

    // 通过协同过滤算法拿到了歌曲，直接返回不走后续流程
    if (res?.data?.songName) {
      return;
    }
    // 协同过滤没有拿到歌曲，走网易FM歌曲
    if ((!FMSongList.length || FMSongNumber == FMSongList.length) && cookie){
      FMSongList = (await getFMList()).data
      FMSongNumber = 0
    }

    if (FMSongList[FMSongNumber]){
      searchAndPlay(FMSongList[FMSongNumber]!.name)
      toast?.('已为您播放：'+FMSongList[FMSongNumber]!.name);
      FMSongNumber ++ 
      return
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
