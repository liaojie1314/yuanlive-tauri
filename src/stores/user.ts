import { StoresEnum } from "@/enums";
import type { UserInfoType } from "@/api/types.ts";
import { getUserInfoApi } from "@/api/user.ts";
import { getUserResourceDir, getUserAbsoluteResourceDir } from "@/utils/PathUtils";

export const useUserStore = defineStore(
  StoresEnum.USER,
  () => {
    const userInfo = ref<UserInfoType>();

    /**
     * 获取用户详情
     */
    const getUserDetail = () => {
      getUserInfoApi()
        .then((res) => {
          console.log(res);
          userInfo.value = { ...userInfo.value, ...res };
        })
        .catch((e) => {
          console.error("获取用户详情失败:", e);
        });
    };

    /**
     * 获取用户资源目录
     * @returns 用户资源目录
     */
    const getUserDir = async () => {
      return await getUserResourceDir(userInfo.value!.uid);
    };

    /**
     * 获取用户绝对资源目录
     * @returns 用户绝对资源目录
     */
    const getUserAbsoluteDir = async () => {
      return await getUserAbsoluteResourceDir(userInfo.value!.uid);
    };

    return {
      userInfo,
      getUserDetail,
      getUserDir,
      getUserAbsoluteDir
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
