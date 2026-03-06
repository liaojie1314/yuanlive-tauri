import { UrlEnum } from "@/enums";
import { FollowItem, type VideoPageResult } from "./types";
import { request } from "@/utils/RequestUtils.ts";

/**
 * 取消关注
 * @param followUserId 被关注用户id
 * @returns 是否关注
 */
export async function unfollowApi(followUserId: number) {
  return await request<boolean>({
    url: UrlEnum.UNFOLLOW,
    pathParams: {
      followUserId
    }
  });
}

/**
 * 获取用户关注列表
 * @returns 当前用户关注列表
 */
export async function getFollowingApi() {
  return await request<FollowItem[]>({
    url: UrlEnum.GET_FOLLOWING
  });
}

/**
 * 获取关注的人的视频列表
 * @returns 关注的人的视频列表
 */
export async function getVideoListByUidApi(uid: number, pageNum?: number, pageSize?: number) {
  return await request<VideoPageResult>({
    url: UrlEnum.GET_VIDEO_LIST_BY_UID,
    body: {
      uid,
      pageNum,
      pageSize
    }
  });
}
