import { request } from "@/utils/RequestUtils.ts";
import { UrlEnum } from "@/enums";
import type { ForgetPasswordReq, RegisterUserReq } from "@/api/types.ts";

export async function register(body: RegisterUserReq) {
  return await request({
    url: UrlEnum.REGISTER,
    body
  });
}

export async function logout() {
  return await request({
    url: UrlEnum.LOGOUT
  });
}

export async function forgetPassword(body: ForgetPasswordReq) {
  return await request({
    url: UrlEnum.FORGET_PASSWORD,
    body
  });
}

export async function getUserDetail() {
  return await request({
    url: UrlEnum.GET_USER_INFO_DETAIL
  });
}
