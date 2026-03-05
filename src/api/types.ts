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
  // 性别 1为男性，2为女性
  gender: string;
  // 设备类型
  device: string;
  userStats: UserStats;
};

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

//========follow========
export interface FollowItem {
  followUserId: number;
  username: string;
  avatar: string;
  unseenCount: number;
}

export interface VideoItem {
  id: number;
  videoUrl: string;
  coverUrl: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  description: string;
}

export type VideoPageResult = PageResult<VideoItem>;

//========live========
export interface HotCategoryItem {
  id: number;
  label: string;
  value: string;
  parentValue: string;
}

export interface FollowLiveItem {
  username: string;
  avatar: string;
  roomId: number;
}

export interface LiveItem {
  id: number;
  title: string;
  anchorName: string;
  coverImg: string;
  hotScore: number;
}
