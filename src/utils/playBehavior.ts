/**
 * 播放行为上报模块
 *
 * 追踪用户的播放行为（播放时长、跳过、完播、循环），
 * 在歌曲切换时上报到后端推荐系统。
 */
import { reportPlayBehavior, reportRecommendFeedback } from '@/api';
import { usePlayerStore } from '@/stores/index';
import type { SongDetailItem } from '@/types/dataTypes';

interface PlaySession {
  musicId: string;
  name: string;
  singer: string;
  album: string;
  duration: number;
  startTime: number;
  accumulatedTime: number;
  isLoop: boolean;
}

let currentSession: PlaySession | null = null;
let lastReportedMusicId: string | null = null;

function getUid(): string | null {
  const store = usePlayerStore();
  return store.uid;
}

/**
 * 开始追踪一首新歌曲的播放行为
 */
export function startPlaySession(music: SongDetailItem) {
  if (!music.id) return;

  flushPlaySession();

  currentSession = {
    musicId: String(music.id),
    name: music.name || '',
    singer: music.singer || '',
    album: music.album || '',
    duration: music.duration || 0,
    startTime: Date.now(),
    accumulatedTime: 0,
    isLoop: false,
  };
}

/**
 * 标记当前歌曲被单曲循环
 */
export function markLoopPlay() {
  if (currentSession) {
    currentSession.isLoop = true;
  }
}

/**
 * 更新当前播放累计时长（由 timeupdate 事件周期性调用）
 */
export function updatePlayTime(currentTimeSeconds: number) {
  if (currentSession && currentTimeSeconds > 0) {
    currentSession.accumulatedTime = currentTimeSeconds;
  }
}

/**
 * 结束当前播放会话并上报
 */
export function flushPlaySession() {
  if (!currentSession) return;

  const uid = getUid();
  if (!uid) {
    currentSession = null;
    return;
  }

  const session = currentSession;
  currentSession = null;

  if (session.musicId === lastReportedMusicId && session.accumulatedTime < 5) {
    return;
  }

  if (session.accumulatedTime < 3) return;

  lastReportedMusicId = session.musicId;

  reportPlayBehavior({
    uid,
    musicId: session.musicId,
    name: session.name,
    singer: session.singer,
    album: session.album,
    duration: session.duration,
    playDuration: Math.round(session.accumulatedTime),
    isLoop: session.isLoop,
  }).catch((err) => {
    console.warn('[PlayBehavior] 上报失败:', err);
  });

  // 判定是否完整播放并上报反馈
  if (
    session.duration > 0 &&
    session.accumulatedTime >= session.duration * 0.8
  ) {
    reportRecommendFeedback(uid, session.musicId, 'completed').catch(() => {});
  } else if (session.duration > 0 && session.accumulatedTime < 15) {
    reportRecommendFeedback(uid, session.musicId, 'skipped').catch(() => {});
  } else {
    reportRecommendFeedback(uid, session.musicId, 'listened').catch(() => {});
  }
}

/**
 * 上报收藏反馈
 */
export function reportCollectedFeedback(musicId: string) {
  const uid = getUid();
  if (!uid || !musicId) return;
  reportRecommendFeedback(uid, String(musicId), 'collected').catch(() => {});
}
