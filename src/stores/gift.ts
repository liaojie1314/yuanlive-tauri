import { StoresEnum } from "@/enums";

export const useGiftStore = defineStore(StoresEnum.GIFT, () => {
  // 礼物设置状态
  const settings = reactive({
    showGiftMessages: true, // 送礼信息提示
    hideEffects: false, // 屏蔽礼物特效
    enableShortcut: false // 快捷键送礼
  });

  /** 重置礼物设置到默认值 */
  const resetSettings = () => {
    settings.hideEffects = false;
    settings.enableShortcut = false;
    settings.showGiftMessages = true;
  };

  return {
    settings,
    resetSettings
  };
});
