import type { SongObjectType } from './song_detail';

// playlist/detail params : id 接口返回值类型
export interface PlaylistDetailResponse {
  code: number;
  relatedVideos: null | object;
  playlist: Playlist;
}

interface Playlist {
  id: string; // 榜单 ID
  name: string; // 榜单名称
  coverImgId: number; // 封面 ID
  coverImgUrl: string; // 封面 URL
  coverImgId_str: string; // 封面 ID 字符串
  adType: number;
  userId: number; // 创建人 ID
  createTime: number;
  status: number;
  opRecommend: boolean;
  highQuality: boolean;
  newImported: boolean;
  updateTime: number;
  trackCount: number; // 歌曲数量
  specialType: number;
  privacy: number;
  trackUpdateTime: number;
  commentThreadId: string; // 评论线程 ID
  playCount: number; // 播放量
  trackNumberUpdateTime: number;
  subscribedCount: number;
  cloudTrackCount: number;
  ordered: boolean;
  description: string; // 描述
  tags: string[];
  updateFrequency: string | null;
  backgroundCoverId: number;
  backgroundCoverUrl: string | null;
  titleImage: number;
  titleImageUrl: string | null;
  detailPageTitle: string | null;
  englishTitle: string | null;
  officialPlaylistType: string | null;
  copied: boolean;
  relateResType: string | null;
  coverStatus: number;
  subscribers: UserProfile[];
  subscribed: boolean;
  tracks: Track[] | SongObjectType[];
  trackIds: TrackId[];
}

interface UserProfile {
  defaultAvatar: boolean; // 是否使用默认头像
  province: number; // 省份代码
  authStatus: number; // 认证状态
  followed: boolean; // 是否已关注
  avatarUrl: string; // 头像 URL
  accountStatus: number; // 账号状态
  gender: number; // 性别 0-未知 1-男 2-女
  city: number; // 城市代码
  birthday: number; // 生日时间戳
  userId: number; // 用户 ID
  userType: number; // 用户类型
  nickname: string; // 昵称
  signature: string; // 个性签名
  description: string; // 简介
  detailDescription: string; // 详细简介
  avatarImgId: number; // 头像 ID
  backgroundImgId: number; // 背景图片 ID
  backgroundUrl: string; // 背景图片 URL
  authority: number; // 权限等级
  mutual: boolean; // 是否互相关注
  expertTags: string[] | null; // 专家标签
  experts: Record<string, string> | null; // 专家信息
  djStatus: number; // DJ 状态
  vipType: number; // VIP 类型
  remarkName: string | null; // 备注名
  authenticationTypes: number; // 认证类型
  avatarDetail: string | null; // 头像详情
  backgroundImgIdStr: string; // 背景图片 ID 字符串
  avatarImgIdStr: string; // 头像图片 ID 字符串
  anchor: boolean; // 是否主播
  avatarImgId_str: string; // 头像图片 ID 字符串（重复字段）
}

interface Artist {
  id: string;
  name: string;
}

interface Album {
  id: string;
  name: string;
  picUrl: string;
  tns: string[];
  pic_str: string;
  pic: number;
}

interface VideoInfo {
  moreThanOne: boolean;
  video: string | null;
}

export interface Track {
  id: string;
  name: string;
  mainTitle: string | null;
  additionalTitle: string | null;
  pst: number;
  t: number;
  ar: Artist[]; // 歌手列表
  alia: string[]; // 别名
  pop: number; // 热度
  st: number;
  rt: string;
  fee: number; // 版权费用
  v: number;
  crbt: string | null;
  cf: string;
  al: Album; // 专辑信息
  dt: number; // 歌曲时长 ms
  version: number;
  songJumpInfo: string | null;
  entertainmentTags: string | null;
  awardTags: string | null;
  displayTags: string | null;
  single: number;
  noCopyrightRcmd: string | null;
  alg: string | null;
  displayReason: string | null;
  pubDJProgramData: string | null;
  rtype: number;
  rurl: string | null;
  mst: number;
  cp: number;
  mv: number;
  publishTime: number;
  videoInfo: VideoInfo;
}

export interface TrackId {
  id: string; // 歌曲ID
  v: number; // 版本号
  t: number; // 类型（一般为0）
  at: number; // 添加时间戳
  alg: string | null; // 推荐算法标识
  uid: number; // 用户ID
  rcmdReason: string; // 推荐理由
  rcmdReasonTitle: string; // 推荐理由标题，例如“编辑推荐”
  sc: string | null; // 保留字段
  f: string | null; // 保留字段
  sr: string | null; // 保留字段
  dpr: string | null; // 保留字段
  tr: number; // 保留字段
  lr: number; // 保留字段
}
