export type PageResult<T> = {
  // 总条数
  total: number;
  // 每页条数
  pageSize: number;
  // 当前页码
  currentPage: number;
  // 数据列表
  list: T[];
};

//========auth========
export type RegisterUserReq = {
  // 用户名
  username: string;
  // 邮箱
  email: string;
  // 密码
  password: string;
  // 验证码
  code: string;
  // 确认密码
  confirmPassword: string;
};

export type ForgetPasswordReq = {
  // 邮箱
  email: string;
  // 验证码
  code: string;
  // 密码
  password: string;
  // 确认密码
  confirmPassword: string;
};

//========user========
type UserStats = {
  followerCount: number;
  followingCount: number;
  totalLikesReceived: number;
  followingLiveCount: number;
};

export type UserInfoType = {
  // 用户唯一标识
  uid: string;
  // 邮箱
  email: string;
  // 密码
  password?: string;
  // 用户头像
  avatar?: string;
  // 用户名
  username: string;
  // 性别
  gender: string;
  //描述
  description?: string;
  // 出生日期
  birthday?: number | null;
  // 设备类型
  device: string;
  userStats: UserStats;
};

export type LikeResp = {
  isLiked: boolean;
  count: number;
};

export type SearchResultItem = {
  // 视频
  video?: VideoItem;
  // 直播间
  liveRoom?: LiveItem;
  // 是否是直播间
  checkRoom: boolean;
};

export type SearchResultPageResult = PageResult<SearchResultItem>;

export type HotSearchItem = {
  id: number;
  content: string;
};

export type RecommendSearchItem = HotSearchItem & {
  // 是否是最推荐
  isMostRecommend: boolean;
};

//========follow========
export type FollowItem = {
  followUserId: number;
  username: string;
  avatar: string;
  unseenCount: number;
};

export type VideoItem = {
  id: number;
  title?: string;
  userId?: number;
  username?: string;
  videoUrl: string;
  coverUrl: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  description: string;
};

export type VideoPageResult = PageResult<VideoItem>;

//========live========
export type HotCategoryItem = {
  id: number;
  label: string;
  value: string;
  parentValue: string;
};

export type ChildCategoryItem = {
  id: number;
  label: string;
  value: string;
};

export type FollowLiveItem = {
  username: string;
  avatar: string;
  roomId: number;
};

export type LiveItem = {
  id: number;
  title: string;
  anchorName: string;
  coverImg: string;
  hotScore: number;
};

//========ai========
export type AiConversationItem = {
  id: string;
  title: string;
  timestamp: number;
  isTop: boolean;
};

export type AiConversationPageResult = PageResult<AiConversationItem>;
