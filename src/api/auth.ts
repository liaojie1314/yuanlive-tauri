import { request } from "@/utils/RequestUtils.ts";
import { UrlEnum } from "@/enums";
import type { ForgetPasswordReq, RegisterUserReq } from "@/api/types.ts";

/**
 *  注册
 * @param body 注册信息
 */
export async function register(body: RegisterUserReq) {
  return await request({
    url: UrlEnum.REGISTER,
    body
  });
}

/**
 * 登出
 */
export async function logout() {
  return await request({
    url: UrlEnum.LOGOUT
  });
}

/**
 * 忘记密码
 * @param body 忘记密码信息
 */
export async function forgetPassword(body: ForgetPasswordReq) {
  return await request({
    url: UrlEnum.FORGET_PASSWORD,
    body
  });
}

/**
 * 生成登录二维码
 */
export async function generateQRCode() {
  return await request({
    url: UrlEnum.GENERATE_QR_CODE
  });
}

/**
 * 检查二维码状态
 */
export async function checkQRStatus(params: { qrId: string; clientId: string }) {
  return await request(
    {
      url: UrlEnum.CHECK_QR_STATUS,
      params
    },
    {
      showError: false
    }
  );
}
