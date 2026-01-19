import { search, getMusicDetail } from '@/api';
import { formatSongs } from '@/utils/song';
import { toHttps } from '@/utils/util';
import { usePlayerStore } from '@/stores';
import type { Track, SongDetailItem } from '@/types/dataTypes';

// 缓存搜索结果
let songList: SongDetailItem[] = [];

/**
 * 搜索歌曲
 * @param keyword 搜索关键词
 */
export async function searchSongs(keyword: string): Promise<SongDetailItem[]> {
  const { result } = await search(keyword);
  songList = formatSongs(result.songs as Track[]);
  return songList;
}

/**
 * 获取歌曲封面图
 * @param id 歌曲ID
 */
export async function fetchSongImage(id: string): Promise<string> {
  const res = await getMusicDetail(id);
  return toHttps(res.songs[0]!.al.picUrl);
}

/**
 * 播放指定歌曲（联动进度条、歌词等）
 * @param song 歌曲信息
 */
export async function playSong(song: SongDetailItem): Promise<void> {
  const store = usePlayerStore();

  // 获取封面图
  if (!song.image) {
    song.image = await fetchSongImage(song.id);
  }

  // 调用 store 播放，自动联动所有组件
  store.selectAddPlay(song);
}

/**
 * 搜索并播放第一首
 * @param keyword 搜索关键词
 */
export async function searchAndPlay(
  keyword: string,
  index: number = 0,
): Promise<SongDetailItem | null> {
  const songs = await searchSongs(keyword);
  if (songs.length === 0) {
    console.warn('未找到相关歌曲');
    return null;
  }

  const firstSong = songs[index]!;
  console.log('firstSong', firstSong);
  await playSong(firstSong);
  return firstSong;
}
