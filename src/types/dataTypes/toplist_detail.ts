import { type Creator } from './user_playlist';

export interface ToplistItem {
  ToplistType: string;
  adType: number;
  algType: string | null;
  anonimous: boolean;
  artists: string[] | null;
  backgroundCoverId: number;
  backgroundCoverUrl: string | null;
  cloudTrackCount: number;
  commentThreadId: string;
  coverImageUrl: string | null;
  coverImgId: number;
  coverImgId_str: string;
  coverImgUrl: string;
  coverText: string | null;
  createTime: number;
  creator: Creator | null;
  description: string;
  englishTitle: string | null;
  highQuality: boolean;
  iconImageUrl: string | null;
  id: number;
  name: string;
  newImported: boolean;
  opRecommend: boolean;
  ordered: boolean;
  originalCoverId: number;
  playCount: number;
  playlistType: string;
  privacy: number;
  recommendInfo: string | null;
  socialPlaylistCover: string | null;
  specialType: number;
  status: number;
  subscribed: boolean | null;
  subscribedCount: number;
  subscribers: string[];
  tags: string[];
  titleImage: number;
  titleImageUrl: string | null;
  topTrackIds: number[] | null;
  totalDuration: number;
  trackCount: number;
  trackNumberUpdateTime: number;
  trackUpdateTime: number;
  tracks: Track[];
  tsSongCount: number;
  uiPlaylistType: string | null;
  updateFrequency: string | null;
  updateTime: number;
  userId: number;
}

export interface Track {
  first: number;
  second: string;
}
