import type { Track } from './playlist_detail';
// song/detail params : ids 接口返回值类型
export interface SongDetailResponse {
  code: number;
  songs: Song[];
}

// 歌手
export interface Artist {
  id: string;
  name: string;
}

// 专辑
export interface Album {
  id: string;
  name: string;
  picUrl: string;
}

// 歌曲
export interface Song extends Track {
  album?: Album;
  duration?: number;
  artists?: Artist[];
}

// new Song 时构造函数中的值类型
export interface SongObjectType {
  id: string;
  name: string;
  singer: string;
  album: string;
  image: string;
  duration: number;
  url: string;
  lovePercent?: number;
}

interface VipSongItem {
  id: string;
  url: string;
  peak?: number;
  payed?: number;
}

export interface VipSong {
  data: VipSongItem[];
}
