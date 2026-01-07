export interface HotList {
  alg: string;
  canDislike: boolean;
  copywriter: string;
  highQuality: boolean;
  id: string;
  name: string;
  picUrl: string;
  playCount: number;
  trackCount: number;
  trackNumberUpdateTime: number;
  type: number;
}

// personalized 接口返回值类型
export interface PersonalizedResponse {
  hasTaste: boolean;
  code: number;
  category: number;
  result: HotList[];
}
