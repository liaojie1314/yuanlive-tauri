import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils.ts";
import type { SearchResultPageResult, HotSearchItem, RecommendSearchItem } from "@/api/types.ts";

/**
 * 获取用户详情
 * @returns 用户详情
 */
export async function getUserInfoApi() {
  return await request({
    url: UrlEnum.GET_USER_INFO
  });
}

/**
 * 获取搜索结果
 * @param query 搜索关键词
 * @param pageNum 页码
 * @param pageSize 每页数量
 * @returns 搜索结果
 */
export async function getSearchResultApi(query: string, pageNum?: number, pageSize?: number) {
  return await request<SearchResultPageResult>({
    url: UrlEnum.GET_SEARCH_RESULT,
    body: {
      query,
      pageNum,
      pageSize
    }
  });
}

/** 获取5条热搜条目 */
export async function getHotSearchApi() {
  return await request<HotSearchItem[]>({
    url: UrlEnum.GET_HOT_SEARCH
  });
}

/** 获取推荐搜索内容（2条最推荐+6条推荐） */
export async function getRecommendSearchApi() {
  return await request<RecommendSearchItem[]>({
    url: UrlEnum.GET_RECOMMEND_SEARCH
  });
}
