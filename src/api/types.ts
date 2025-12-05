export type RegisterUserReq = {
  // 头像
  avatar: string;
  // 昵称
  nickName: string;
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
  // 系统ID
  systemType: number;
  // 授权方式
  grantType: "CAPTCHA" | "REFRESH_TOKEN" | "PASSWORD" | "MOBILE";
  // 验证码key
  key?: string;
  // 验证码code
  code?: string;
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
