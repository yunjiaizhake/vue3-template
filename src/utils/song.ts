import { toHttps } from './util';
import type {
  Song as SongType,
  SongObjectType,
} from '@/types/dataTypes/song_detail';

function filterSinger(singers: SongType['ar']) {
  if (!Array.isArray(singers) || !singers.length) {
    return '';
  }
  let arr: string[] = [];
  singers.forEach((item) => {
    arr.push(item.name);
  });
  return arr.join('/');
}

export class Song {
  id!: number;
  name!: string;
  singer!: string;
  album!: string;
  image!: string;
  duration!: number;
  url!: string;
  constructor(data: SongObjectType) {
    Object.assign(this, data);
  }
}

export function createSong(music: SongType) {
  const album = music.album || music.al || {};
  const duration = music.duration || music.dt;
  return new Song({
    id: music.id,
    name: music.name,
    singer: filterSinger(music.ar || music.artists),
    album: album.name,
    image: toHttps(album.picUrl) || null,
    duration: duration / 1000,
    url: `https://music.163.com/song/media/outer/url?id=${music.id}.mp3`,
  });
}

// 歌曲数据格式化
export function formatSongs(list: SongType[]) {
  const Songs: SongObjectType[] = [];
  list.forEach((item) => {
    const musicData = item;
    if (musicData.id) {
      Songs.push(createSong(musicData));
    }
  });
  return Songs;
}
