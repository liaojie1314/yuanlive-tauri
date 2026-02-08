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

export type LoginUserReq = {
  // 账号
  account: string;
  // 密码
  password: string;
  // 登录方式 PC/MOBILE
  deviceType: "PC" | "MOBILE";
  // 授权方式
  grantType: "CAPTCHA" | "REFRESH_TOKEN" | "PASSWORD" | "MOBILE";
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
