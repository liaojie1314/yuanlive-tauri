import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils.ts";
import type { AiConversationPageResult, AiMessagePageResult } from "@/api/types";

/**
 * 获取历史对话列表
 * @param pageNum 页码
 * @param pageSize 每页数量
 * @returns 历史对话列表
 */
export async function getHistoryConversationApi(pageNum?: number, pageSize?: number) {
  return await request<AiConversationPageResult>({
    url: UrlEnum.GET_HISTORY_CONVERSATION,
    params: {
      pageNum,
      pageSize
    }
  });
}

/**
 * 更新对话标题
 * @param conversationId 对话id
 * @param title 新标题
 */
export async function updateConversationTitleApi(conversationId: string, title: string) {
  return await request({
    url: UrlEnum.UPDATE_CONVERSATION_TITLE,
    body: {
      conversationId,
      title
    }
  });
}

/**
 * 置顶对话
 * @param conversationId 对话id
 * @returns 是否置顶
 */
export async function pinConversationApi(conversationId: string) {
  return await request<{ isPin: boolean }>({
    url: UrlEnum.PIN_CONVERSATION,
    pathParams: {
      conversationId
    }
  });
}

/**
 * 取消置顶对话
 * @param conversationId 对话id
 * @returns 是否置顶
 */
export async function unpinConversationApi(conversationId: string) {
  return await request<{ isPin: boolean }>({
    url: UrlEnum.UNPIN_CONVERSATION,
    pathParams: {
      conversationId
    }
  });
}

/**
 * 批量删除对话
 * @param conversationIds 对话id列表
 */
export async function batchDeleteConversationApi(conversationIds: string[]) {
  return await request({
    url: UrlEnum.BATCH_DELETE_CONVERSATION,
    body: {
      conversationIds
    }
  });
}

/** 删除所有对话 */
export async function deleteAllConversationApi() {
  return await request({
    url: UrlEnum.DELETE_ALL_CONVERSATION
  });
}

/**
 * 获取对话消息
 * @param conversationId 对话id
 * @param cursor 分页游标
 * @param pageSize 每页数量
 * @returns 对话消息
 */
export async function getConversationMessageApi(conversationId: string, cursor?: string, pageSize: number = 10) {
  return await request<AiMessagePageResult>({
    url: UrlEnum.GET_CONVERSATION_MESSAGE,
    pathParams: {
      conversationId
    },
    body: {
      cursor,
      pageSize
    }
  });
}

/**
 * 获取3条AI推荐
 * @returns 3条AI推荐列表
 */
export async function getAiRecommendationApi() {
  return await request<string[]>({
    url: UrlEnum.GET_AI_RECOMMENDATION
  });
}
