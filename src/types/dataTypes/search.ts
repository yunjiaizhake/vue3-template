import type { SongObjectType, Artist, Album } from './song_detail';

// /search/hot 接口返回值类型
export interface HotListResponse {
  code: number;
  result: {
    hots: HotItem[];
  };
}

export interface HotItem {
  first: string; // 一级分类名称
  iconType: number; // 图标类型
  second: number; // 二级分类编号
  third: number | null; // 三级分类编号，可为空
}

// 这个并不是搜索得来的数据类型，是自己封装的期望类型
export type SongDetailItem = SongObjectType;

// search 接口返回值类型
export interface SearchResponse {
  result: Result;
  code: number;
}

interface Result {
  songs: Track[];
  songCount: number;
}

interface Track {
  id: string;
  name: string;
  ar: Artist[]; // 歌手
  al: Album; // 专辑
  dt: number; // 时长（ms）
  pop?: number; // 热度（可选）
  mv?: number; // MV id（有则可跳转）
}
