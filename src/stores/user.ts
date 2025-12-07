import { StoresEnum } from "@/enums";
import type { UserInfoType } from "@/api/types.ts";
import { getUserDetail } from "@/api/user.ts";

export const useUserStore = defineStore(
  StoresEnum.USER,
  () => {
    const userInfo = ref<UserInfoType>();

    const getUserDetailAction = () => {
      getUserDetail()
        .then((res) => {
          userInfo.value = { ...userInfo.value, ...res };
        })
        .catch((e) => {
          console.error("获取用户详情失败:", e);
        });
    };

    return {
      userInfo,
      getUserDetailAction
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
