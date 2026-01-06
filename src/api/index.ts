import axios from '@/utils/axios';
import { DEFAULT_LIMIT } from '@/config';
import { formatSongs } from '@/utils/song';

// 排行榜列表
export function getToplistDetail() {
  return axios.get('/toplist/detail');
}

// 推荐歌单
export function getPersonalized() {
  return axios.get('/personalized');
}

// 歌单详情
export function getPlaylistDetail(id: string) {
  return new Promise((resolve, reject) => {
    axios
      .get('/playlist/detail', {
        params: { id },
      })
      // eslint-disable-next-line
      .then(({ playlist }: any) => playlist || {})
      .then((playlist) => {
        const { trackIds, tracks } = playlist;
        if (!Array.isArray(trackIds)) {
          reject(new Error('获取歌单详情失败'));
          return;
        }
        // 过滤完整歌单 如排行榜
        if (tracks.length === trackIds.length) {
          playlist.tracks = formatSongs(playlist.tracks);
          resolve(playlist);
          return;
        }
        // 限制歌单详情最大 500
        const ids = trackIds
          .slice(0, 500)
          .map((v) => v.id)
          .toString();
        // eslint-disable-next-line
        getMusicDetail(ids).then(({ songs }: any) => {
          playlist.tracks = formatSongs(songs);
          resolve(playlist);
        });
      });
  });
}

// 搜索
export function search(
  keywords: string,
  page: number = 0,
  limit: number = DEFAULT_LIMIT,
) {
  return axios.get('/search', {
    params: {
      offset: page * limit,
      limit: limit,
      keywords,
    },
  });
}

// 热搜
export function searchHot() {
  return axios.get('/search/hot');
}

// 获取用户歌单详情
export function getUserPlaylist(uid: string) {
  return axios.get('/user/playlist', {
    params: {
      uid,
    },
  });
}

// 获取歌曲详情
export function getMusicDetail(ids: string) {
  return axios.get('/song/detail', {
    params: {
      ids,
    },
  });
}

// 获取音乐是否可以用
export function getCheckMusic(id: string) {
  return axios.get('/check/music', {
    params: {
      id,
    },
  });
}

// 获取音乐地址
export function getMusicUrl(id: string) {
  return axios.get('/song/url', {
    params: {
      id,
    },
  });
}

// 获取歌词
export function getLyric(id: string) {
  const url = '/lyric';
  return axios.get(url, {
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
  return axios.get('/comment/music', {
    params: {
      offset: page * limit,
      limit: limit,
      id,
    },
  });
}
