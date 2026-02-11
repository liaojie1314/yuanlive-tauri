import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils.ts";

/**
 * 获取用户关注列表
 * @returns 当前用户关注列表
 */
export async function getFollowingApi() {
  return await request({
    url: UrlEnum.GET_FOLLOWING
  });
}

/**
 * 获取关注的人的视频列表
 * @returns 关注的人的视频列表
 */
export async function getVideoListByUidApi(uid: string) {
  return await request({
    url: UrlEnum.GET_VIDEO_LIST_BY_UID,
    pathParams: {
      uid
    }
  });
}
