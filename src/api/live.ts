import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils.ts";

/**
 * 获取直播类别
 * @returns 直播类别
 */
export async function getLiveCategoryApi() {
  return await request({
    url: UrlEnum.GET_LIVE_CATEGORY
  });
}
