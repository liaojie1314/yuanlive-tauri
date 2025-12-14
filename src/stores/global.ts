import { StoresEnum } from "../enums";

export const useGlobalStore = defineStore(
  StoresEnum.GLOBAL,
  () => {
    // 系统托盘菜单显示的状态
    const showTray = ref<boolean>(false);

    return {
      showTray
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
