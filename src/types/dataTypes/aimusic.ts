export interface AIMusicBaseResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

// ---------- 提交生成任务 ----------
export type AIMusicGenerateResponse = AIMusicBaseResponse<{
  taskId: string;
}>;

// ---------- 获取音乐生成详情 ----------
export interface SunoMusicItem {
  id: string;
  audioUrl: string; // 下载链接
  sourceAudioUrl: string; // 播放链接
  streamAudioUrl: string;
  sourceStreamAudioUrl: string;
  imageUrl: string;
  sourceImageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  createTime: number;
  duration: number;
}

export type AIMusicDetailResponse = AIMusicBaseResponse<{
  taskId: string;
  parentMusicId: string;
  param: string;
  response: {
    taskId: string;
    sunoData: SunoMusicItem[];
  };
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  type: string;
  errorCode: string | null;
  errorMessage: string | null;
}>;

// ---------- 获取歌词（带时间戳） ----------
export interface LyricWord {
  word: string;
  success: boolean;
  startS: number;
  endS: number;
  palign: number;
}

export type AIMusicLyricResponse = AIMusicBaseResponse<{
  alignedWords: LyricWord[];
  waveformData: number[];
  hootCer: number;
  isStreamed: boolean;
}>;
