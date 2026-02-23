import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils.ts";

export interface FollowItem {
  followUserId: number;
  username: string;
  avatar: string;
  unseenCount: number;
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

export interface VideoItem {
  id: number;
  videoUrl: string;
  coverUrl: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  isPlaying?: boolean;
}

/**
 * 获取关注的人的视频列表
 * @returns 关注的人的视频列表
 */
export async function getVideoListByUidApi(uid: number) {
  return await request<VideoItem[]>({
    url: UrlEnum.GET_VIDEO_LIST_BY_UID,
    pathParams: {
      uid
    }
  });
}
