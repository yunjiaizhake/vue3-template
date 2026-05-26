/**
 * 推荐记录写入模块（纯写入，不影响推荐逻辑）
 *
 * 在推荐完成后异步调用后端接口，向以下集合写入数据：
 * - recommend_histories（推荐历史）
 * - user_similarities（用户相似度）
 * - dialog_semantics（对话语义，通过收藏分析模拟写入）
 */
import { post } from '@/utils/axios';
import type { SongDetailItem } from '@/types/dataTypes';

export interface RecommendedSongInfo {
  name: string;
  singer?: string;
  musicId?: string;
  source?: 'collaborative' | 'collection' | 'dialog' | 'multimodal';
}

/**
 * 推荐结束后统一写入三个集合
 * @param recommendedSong 本次推荐出来的歌曲信息（写入 recommend_histories 的目标）
 */
export function writeRecommendRecord(
  uid: string,
  favorites: SongDetailItem[],
  recommendedSong?: RecommendedSongInfo,
) {
  if (!uid || uid === 'null' || uid === '00000000') return;

  // 1. 写入 recommend_histories —— 写入的是本次推荐出来的歌曲
  if (recommendedSong?.name) {
    post('/recommend/write-history', {
      uid,
      musicId: recommendedSong.musicId || '',
      name: recommendedSong.name,
      singer: recommendedSong.singer || '',
      source: recommendedSong.source || 'collaborative',
    }).catch(() => {});
  }

  // 2. 刷新 user_similarities
  post('/recommend/refresh-similarities', { uid }).catch(() => {});

  // 3. 写入 dialog_semantics（基于收藏列表分析生成模拟语义）
  const topSingers = getTopSingers(favorites);
  if (topSingers.length > 0) {
    post('/recommend/dialog-semantic', {
      uid,
      sourceMessages: [
        {
          role: 'user',
          content: `我喜欢${topSingers.join('、')}的歌`,
        },
      ],
      explicitIntents: topSingers.map((singer) => ({
        type: 'singer',
        value: singer,
        confidence: 0.8,
      })),
      emotionState: { valence: 0.3, arousal: 0.2, social: 0 },
    }).catch(() => {});
  }
}

function getTopSingers(favorites: SongDetailItem[]): string[] {
  const singerMap = new Map<string, number>();
  favorites.forEach((song) => {
    if (!song.singer) return;
    singerMap.set(song.singer, (singerMap.get(song.singer) || 0) + 1);
  });
  return [...singerMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([singer]) => singer);
}
