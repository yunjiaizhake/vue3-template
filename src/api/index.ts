import { get, post } from '@/utils/axios';
import { getCookie, clearCookie } from '@/utils/storage';
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
  SongDetailItem,
  UserLoginKey,
  UserLoginQRcode,
  UserIdentityDetail,
  UserLoginQRcodeStatus,
  ChorusResponse,
  VipSong,
  LoveHundredUsers,
  FMList
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
  return get<VipSong>('/song/url', {
    params: {
      id,
    },
  });
}

export function getMusicUrl_v1(id: string, level: string = 'exhigh') {
  return get<VipSong>('/song/url/v1', {
    params: {
      id,
      level,
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

// 获取副歌片段
export function getChorus(id: string) {
  return get<ChorusResponse>('/song/chorus', {
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

// 进行和大模型的对话
export function getAiChat(prompt: string) {
  return post('/gpt/chat', {
    prompt,
  });
}

// 获取收藏列表（数据库）
export function getFavoriteListByUid(uid: string) {
  return get<{ code: number; data: SongDetailItem[] }>('/favorite/list', {
    params: { uid },
  });
}

// 保存收藏列表（数据库）
export function saveFavoriteListByUid(uid: string, list: SongDetailItem[]) {
  return post<{ code: number; data: SongDetailItem[] }>('/favorite/list', {
    uid,
    list,
  });
}

// 获取满喜欢度用户列表（数据库）
export function getLoveHundredUsersByMusicId(musicId: string) {
  return get<{ code: number; data: LoveHundredUsers }>('/love/hundred/users', {
    params: { musicId },
  });
}

// 新增满喜欢度用户（数据库）
export function addLoveHundredUser(
  musicId: string,
  userId: string,
  name: string,
  singer: string,
) {
  return post<{ code: number; data: LoveHundredUsers }>(
    '/love/hundred/users/add',
    {
      musicId,
      userId,
      name,
      singer,
    },
  );
}

// 删除满喜欢度用户（数据库）
export function removeLoveHundredUser(
  musicId: string,
  userId: string,
  name: string,
  singer: string,
) {
  return post<{ code: number; data: LoveHundredUsers }>(
    '/love/hundred/users/remove',
    {
      musicId,
      userId,
      name,
      singer,
    },
  );
}

// 满喜爱度推荐（数据库）
export function recommendLoveHundredSong(
  userId: string,
  history: string[] = [],
) {
  return post<{ code: number; data: { songName: string; index: number } | null; message?: string }>(
    '/love/hundred/recommend',
    { userId, history },
  );
}

// 获取二维码 key
export function getLoginQrKey() {
  return get<UserLoginKey>('/login/qr/key', {
    params: { timestamp: Date.now() },
  });
}

// 生成二维码
export function getLoginQrCode(key: string) {
  return get<UserLoginQRcode>('/login/qr/create', {
    params: {
      key,
      platform: 'web',
      qrimg: true,
      timestamp: Date.now(),
      ua: 'pc',
    },
  });
}

// 轮询二维码状态
export function checkLoginQr(key: string) {
  return get<UserLoginQRcodeStatus>('/login/qr/check', {
    params: {
      key,
      timestamp: Date.now(),
      ua: 'pc',
    },
  });
}

// 登录状态（用 cookie 换取用户信息）
export function getLoginStatus(cookie?: string) {
  const resolvedCookie = cookie ?? getCookie();
  return post<{ code: number; data: UserIdentityDetail }>(
    '/login/status',
    { cookie: resolvedCookie },
    { params: { timestamp: Date.now(), ua: 'pc' } },
  );
}

// 退出登录
export function logout() {
  clearCookie()
  return get<{ code: number }>('/logout', {
    params: { timestamp: Date.now() },
  });
}


// 私人FM
export function getFMList() {
  return get<{ code: number, data: FMList[]}>('/personal_fm');
}