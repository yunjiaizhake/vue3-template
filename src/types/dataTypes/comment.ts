// comment/music 歌曲评论接口返回值类型 params ： id 歌曲id
export interface CommentMetaResponse {
  userId: number;
  isMusician: boolean;
  total: number;
  topComments: unknown;
  moreHot: boolean;
  cnum: number;
  code: number;
  more: boolean;
  hotComments: CommentItem[];
  comments: CommentItem[];
}

export interface CommentItem {
  commentId: number;
  content: string;
  time: number;
  timeStr: string;
  likedCount: number;
  liked: boolean;
  owner: boolean;

  user: CommentUser;

  beReplied: RepliedCommon[];
  showFloorComment?: FloorCommentInfo;
}

export interface CommentUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
  vipType: number;
}

export interface FloorCommentInfo {
  replyCount: number;
  showReplyCount: boolean;
}

export interface RepliedCommon {
  user: {
    userId: string;
    nickname: string;
    avatarUrl: string;
    vipType: number;
  };
  content: string;
  beRepliedCommentId: number;
}
