import { get } from '@/utils/axios';
import { DEFAULT_LIMIT } from '@/config';
import { formatSongs } from '@/utils/song';
import type {
  LyricResponse,
  ToplistDetailResponse,
  PersonalizedResponse,
  PlaylistDetailResponse,
  SongDetailResponse,
  Track,
  SearchResponse,
  HotListResponse,
  PlaylistResponse,
  CommentMetaResponse,
} from '@/types/dataTypes';

// 排行榜列表
export function getToplistDetail() {
  return get<ToplistDetailResponse>('/toplist/detail');
}

// 推荐歌单
export function getPersonalized() {
  return get<PersonalizedResponse>('/personalized');
}

// 歌单详情
export async function getPlaylistDetail(id: string) {
  const res = await get<PlaylistDetailResponse>('/playlist/detail', {
    params: { id },
  });
  let playlist = res.playlist;

  if (!Array.isArray(playlist.trackIds)) {
    throw new Error('获取歌单详情失败');
  }
  // 完整歌单
  if (playlist.tracks.length === playlist.trackIds.length) {
    playlist.tracks = formatSongs(playlist.tracks as Track[]);
    return playlist;
  }
  // 限制最大 500 首
  const ids = playlist.trackIds
    .slice(0, 500)
    .map((v) => v.id)
    .toString();
  const musicDetail = await getMusicDetail(ids);
  playlist.tracks = formatSongs(musicDetail.songs);
  return playlist;
}

// 搜索
export function search(
  keywords: string,
  page: number = 0,
  limit: number = DEFAULT_LIMIT,
) {
  return get<SearchResponse>('/search', {
    params: {
      offset: page * limit,
      limit: limit,
      keywords,
    },
  });
}

// 热搜
export function searchHot() {
  return get<HotListResponse>('/search/hot');
}

// 获取用户歌单详情
export function getUserPlaylist(uid: string) {
  return get<PlaylistResponse>('/user/playlist', {
    params: {
      uid,
    },
  });
}

// 获取歌曲详情
export function getMusicDetail(ids: string) {
  return get<SongDetailResponse>('/song/detail', {
    params: {
      ids,
    },
  });
}

// 获取音乐是否可以用
export function getCheckMusic(id: string) {
  return get('/check/music', {
    params: {
      id,
    },
  });
}

// 获取音乐地址
export function getMusicUrl(id: string) {
  return get('/song/url', {
    params: {
      id,
    },
  });
}

// 获取歌词
export function getLyric(id: string) {
  const url = '/lyric';
  return get<LyricResponse>(url, {
    params: {
      id,
    },
  });
}

// 获取音乐评论
export function getComment(
  id: string,
  page: number,
  limit: number = DEFAULT_LIMIT,
) {
  return get<CommentMetaResponse>('/comment/music', {
    params: {
      offset: page * limit,
      limit: limit,
      id,
    },
  });
}
