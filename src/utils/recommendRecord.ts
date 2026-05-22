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
import { usePlayerStore } from '@/stores/index';

/**
 * 推荐结束后统一写入三个集合
 */
export function writeRecommendRecord(uid: string, favorites: SongDetailItem[]) {
  if (!uid || uid === 'null' || uid === '00000000') return;

  const store = usePlayerStore();
  const currentMusic = store.currentMusic;

  // 1. 写入 recommend_histories
  if (currentMusic?.id) {
    post('/recommend/write-history', {
      uid,
      musicId: String(currentMusic.id),
      name: currentMusic.name || '',
      singer: currentMusic.singer || '',
      source: 'collaborative',
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
