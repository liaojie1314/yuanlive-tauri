import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils.ts";
import type { SearchResultPageResult } from "@/api/types.ts";

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
    params: {
      query,
      pageNum,
      pageSize
    }
  });
}
