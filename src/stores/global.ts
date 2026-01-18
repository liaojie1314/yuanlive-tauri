import { StoresEnum } from "@/enums";

export const useGlobalStore = defineStore(
  StoresEnum.GLOBAL,
  () => {
    // 系统托盘菜单显示的状态
    const showTray = ref<boolean>(false);
    // 是否首次登录（需要阻塞首屏）
    const firstEnter = ref<boolean>(true);

    return {
      showTray,
      firstEnter
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
