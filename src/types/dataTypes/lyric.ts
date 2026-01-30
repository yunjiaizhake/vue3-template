export interface LyricLine {
  text: string; // 歌词内容
  time: number; // 时间点
}

//  /lyric 接口返回值类型
export interface LyricInfo {
  version: number;
  lyric: string;
}

export interface LyricResponse {
  code: number; // 接口状态码，比如 200
  lrc: LyricInfo; // 原始歌词
}

// 副歌片段
export interface ChorusSegment {
  id: number; // 歌曲 id
  startTime: number; // 开始时间（毫秒）
  endTime: number; // 结束时间（毫秒）
  ugcLocked: number; // 是否锁定
}

// /song/chorus 接口返回值类型
export interface ChorusResponse {
  code: number; // 接口状态码，比如 200
  chorus: ChorusSegment[];
}