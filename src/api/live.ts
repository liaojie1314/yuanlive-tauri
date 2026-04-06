import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils.ts";
import type { HotCategoryItem, ChildCategoryItem, FollowLiveItem, LiveItem } from "./types";

/**
 * 获取直播类别
 * @returns 直播类别
 */
export async function getLiveCategoryApi() {
  return await request({
    url: UrlEnum.GET_LIVE_CATEGORY
  });
}

/**
 * 获取热门类别
 * @returns 6个热门类别
 */
export async function getHotCategoryApi() {
  return await request<HotCategoryItem[]>({
    url: UrlEnum.GET_HOT_CATEGORY
  });
}

/**
 * 获取子类别
 * @returns 子类别
 */
export async function getChildCategoryApi() {
  return await request<ChildCategoryItem[]>({
    url: UrlEnum.GET_CHILD_CATEGORY
  });
}

/**
 * 获取当前用户正在直播的关注列表
 * @returns 当前用户正在直播的关注列表
 */
export async function getFollowingLiveApi() {
  return await request<FollowLiveItem[]>({
    url: UrlEnum.GET_FOLLOWING_LIVE
  });
}

/**
 * 获取当前直播类别的所有直播列表
 * @returns 当前直播类别的所有直播列表
 */
export async function getLiveListByCategoryApi(value?: string) {
  return await request<LiveItem[]>({
    url: UrlEnum.GET_LIVE_LIST_BY_CATEGORY,
    params: {
      value
    }
  });
}

/**
 * 获取人气前5的直播列表
 * @returns 人气前5的直播列表
 */
export async function getTopFiveLiveApi() {
  return await request<LiveItem[]>({
    url: UrlEnum.GET_TOP_FIVE_LIVE
  });
}
