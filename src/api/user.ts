import { request } from "@/utils/RequestUtils.ts";
import { UrlEnum } from "@/enums";

/**
 * 获取用户详情
 * @returns 用户详情
 */
export async function getUserInfoApi() {
  return await request({
    url: UrlEnum.GET_USER_INFO
  });
}
