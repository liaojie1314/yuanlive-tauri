import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils.ts";
import type { LikeResp } from "@/api/types.ts";

/**
 * 推荐视频
 * @param id 视频id
 */
export async function recommendVideoApi(id: number) {
  return await request({ url: UrlEnum.RECOMMEND_VIDEO, pathParams: { id } });
}

/**
 * 点赞视频
 * @param id 视频id
 * @returns 操作后是否点赞
 */
export async function likeVideoApi(id: number) {
  return await request<LikeResp>({ url: UrlEnum.LIKE_VIDEO, pathParams: { id } });
}

/**
 * 取消点赞视频
 * @param id 视频id
 * @returns 操作后是否取消点赞
 */
export async function cancelLikeVideoApi(id: number) {
  return await request<LikeResp>({ url: UrlEnum.CANCEL_LIKE_VIDEO, pathParams: { id } });
}

/**
 * 不喜欢视频
 * @param id 视频id
 */
export async function unlikeVideoApi(id: number) {
  return await request({ url: UrlEnum.UNLIKE_VIDEO, pathParams: { id } });
}
