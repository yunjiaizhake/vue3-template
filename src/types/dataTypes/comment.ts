export interface CommentItem {
  commentId: number;
  content: string;
  richContent: string;
  time: number;
  timeStr: string;

  liked: boolean;
  likedCount: number;

  owner: boolean;
  parentCommentId: number;
  status: number;

  ipLocation: CommentIpLocation;

  user: CommentUser;

  beReplied: BeRepliedItem[];

  showFloorComment: FloorCommentInfo;

  pendantData?: PendantData | null;

  // ===== 接口中存在，但你一般用不到的 =====
  contentResource?: unknown;
  decoration?: object;
  expressionUrl?: string | null;
  grade?: unknown;
  likeAnimationMap?: object;
  medal?: unknown;
  repliedMark?: unknown;
  userBizLevels?: unknown;
}

export interface CommentUser {
  userId: number;
  //   nickname: string;
  //   avatarUrl: string;
  //   userType: number;
  //   anonym: number;
}

export interface BeRepliedItem {
  beRepliedCommentId: number;
  content: string;
  user: CommentUser;
}

export interface FloorCommentInfo {
  replyCount: number;
  comments: CommentItem[] | null;
  showReplyCount: boolean;
}

export interface PendantData {
  id: number;
  imageUrl: string;
}

export interface CommentIpLocation {
  ip: string | null;
  location: string;
  userId: number;
}
