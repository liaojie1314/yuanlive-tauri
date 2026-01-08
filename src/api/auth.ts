import { request } from "@/utils/RequestUtils.ts";
import { StorageKeyEnum, UrlEnum } from "@/enums";
import type { ForgetPasswordReq, RegisterUserReq } from "@/api/types.ts";

/**
 *  注册
 * @param body 注册信息
 */
export async function registerApi(body: RegisterUserReq) {
  return await request({
    url: UrlEnum.REGISTER,
    body
  });
}

/**
 * 登出
 */
export async function logoutApi() {
  return await request({
    url: UrlEnum.LOGOUT
  });
}

/**
 * 忘记密码
 * @param body 忘记密码信息
 */
export async function forgetPasswordApi(body: ForgetPasswordReq) {
  return await request({
    url: UrlEnum.FORGET_PASSWORD,
    body
  });
}

/**
 * 生成登录二维码
 */
export async function generateQRCodeApi() {
  return await request({
    url: UrlEnum.GENERATE_QR_CODE,
    params: {
      deviceID: localStorage.getItem(StorageKeyEnum.DEVICE_ID)
    }
  });
}

/**
 * 检查二维码状态
 */
export async function checkQRStatusApi(params: { uuid: string }) {
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

/**
 * 发送邮箱验证码
 */
export async function getCodeApi(body: { email: string; operationType: "REGISTER" | "FORGET" }) {
  return await request({
    url: UrlEnum.GET_CODE,
    body
  });
}
