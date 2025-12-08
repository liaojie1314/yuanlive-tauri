import { request } from "@/utils/RequestUtils.ts";
import { UrlEnum } from "@/enums";

export async function getUserDetail() {
  return await request({
    url: UrlEnum.GET_USER_INFO_DETAIL
  });
}
