import { PLAY_MODE } from '@/config';
import { sendPlayerStatus } from '@/pages/aiChatOnline/wsSignal';
import type { SongDetailItem, vipSong } from '@/types/dataTypes';
import { getMusicUrl } from '@/api/index';
interface BbPlayerMusicContext {
  audioEle: ComputedRef<HTMLAudioElement | null>;
  currentMusic: ComputedRef<SongDetailItem>;
  currentTime: Ref<number>;
  currentProgress: Ref<number>;
  musicReady: Ref<boolean>;
  mode: ComputedRef<number>;
  playlist: ComputedRef<SongDetailItem[]>;
  historyList: ComputedRef<SongDetailItem[]>;
  setPlaying: (playing: boolean) => void;
  next: (flag?: boolean) => void;
  prev: (flag?: boolean) => void;
  loop: () => void;
  setHistory: (music: SongDetailItem) => void;
  getLastSwitchAction: () => 'prev' | 'next' | null;
  toast?: (message: string, position?: 'top' | 'center' | 'bottom') => void;
}
// 重试次数
let retry = 1;

const bbPlayerMusic = {
  initAudio(ctx: BbPlayerMusicContext) {
    const {
      audioEle,
      currentMusic,
      currentTime,
      currentProgress,
      musicReady,
      mode,
      playlist,
      historyList,
      setPlaying,
      next,
      prev,
      loop,
      setHistory,
      getLastSwitchAction,
      toast, // 传入全局toast函数
    } = ctx;

    const ele = audioEle.value!;

    // 音频缓冲事件
    ele.onprogress = () => {
      try {
        if (ele.buffered.length > 0) {
          const duration = currentMusic.value.duration;
          let buffered = ele.buffered.end(0);
          buffered = buffered > duration ? duration : buffered;
          currentProgress.value = buffered / duration;
        }
      } catch (error) {
        console.error(error);
      }
    };

    // 开始播放音乐
    ele.onplay = () => {
      setTimeout(() => {
        musicReady.value = true;
      }, 100);
    };

    // 获取当前播放时间
    ele.ontimeupdate = () => {
      currentTime.value = ele.currentTime;
    };

    // 当前音乐播放完毕
    ele.onended = () => {
      if (mode.value === PLAY_MODE.LOOP) {
        loop();
      } else {
        next();
      }
    };

    // 音乐播放出错
    ele.onerror = () => {
      toast?.('当前音乐是会员歌曲，正在试听前30秒~');
      if (retry === 0) {
        const lastAction = getLastSwitchAction();
        if (playlist.value.length === 1) {
          toast?.('没有可播放的音乐哦~');
          next(true);
          return;
        }
        if (lastAction === 'prev') {
          toast?.('当前音乐不可播放，已自动播放上一首');
          prev(true);
        } else {
          toast?.('当前音乐不可播放，已自动播放下一曲');
          next(true);
        }
      } else {
        console.log('重试一次');
        retry -= 1;
        getMusicUrl(currentMusic.value.id).then((res: vipSong) => {
          ele.src = res.data[0].url.split('?')[0];
          ele.load();
          ele.play();
          setPlaying(true);
        });
      }
    };

    // 音乐进度拖动大于加载时重载音乐
    ele.onstalled = () => {
      ele.load();
      setPlaying(false);
      setTimeout(() => setPlaying(true), 10);
    };

    // 将能播放的音乐加入播放历史
    ele.oncanplay = () => {
      retry = 1;
      sendPlayerStatus('player_status', true);
      if (
        historyList.value.length === 0 ||
        currentMusic.value.id !== historyList.value[0]?.id
      ) {
        setHistory(currentMusic.value);
      }
    };

    // 当音频已暂停时
    ele.onpause = () => {
      setPlaying(false);
    };
  },
};

export default bbPlayerMusic;
