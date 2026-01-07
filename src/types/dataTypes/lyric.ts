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
