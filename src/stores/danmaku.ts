import { useI18n } from "vue-i18n";
import { StoresEnum } from "@/enums";

/**
 * 弹幕设置Store
 * 统一管理所有弹幕的设置
 */
export const useDanmakuStore = defineStore(
  StoresEnum.DANMAKU,
  () => {
    const { t } = useI18n();

    // 弹幕位置
    const position = ref<"scroll" | "top" | "bottom">("scroll");

    // 本地设置状态
    const settings = reactive({
      enabled: true, // 弹幕总开关
      opacity: 100, // 透明度
      fontSize: 3, // 字号滑块值 1-5
      speed: 2, // 速度滑块值 1-3
      displayArea: 3, // 显示区域滑块值 1-5
      antiBlock: false, // 强制防挡开关
      enableCombo: true // 同屏合并 (Combo) 开关，默认开启
    });

    const actualFontSize = computed(() => {
      const map: Record<number, number> = { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20 };
      return map[settings.fontSize] || 16; // 自动转换为真实像素
    });

    // 静态的滑块配置（只保留不再频繁变动的基础信息，不会打断滑动拖拽）
    const sliderConfigs = computed(() => [
      { key: "opacity" as const, label: t("components.danmakuInput.opacity"), min: 0, max: 100 },
      { key: "displayArea" as const, label: t("components.danmakuInput.displayArea"), min: 1, max: 5 },
      { key: "fontSize" as const, label: t("components.danmakuInput.fontSize"), min: 1, max: 5 },
      { key: "speed" as const, label: t("components.danmakuInput.speed"), min: 1, max: 3 }
    ]);

    const fontSizeOptions = computed(() => [
      t("components.danmakuInput.fontSizeOptions.extraSmall"),
      t("components.danmakuInput.fontSizeOptions.small"),
      t("components.danmakuInput.fontSizeOptions.medium"),
      t("components.danmakuInput.fontSizeOptions.large"),
      t("components.danmakuInput.fontSizeOptions.extraLarge")
    ]);
    const speedOptions = computed(() => [
      t("components.danmakuInput.speedOptions.slower"),
      t("components.danmakuInput.speedOptions.medium"),
      t("components.danmakuInput.speedOptions.faster")
    ]);
    const displayAreaOptions = computed(() => [
      t("components.danmakuInput.displayAreaOptions.oneLine"),
      t("components.danmakuInput.displayAreaOptions.twoLines"),
      "25%",
      "50%",
      "80%"
    ]);

    // 动态提取右侧的文本值，供页面独立绑定
    const textValues = computed(() => ({
      opacity: `${settings.opacity}%`,
      displayArea: displayAreaOptions.value[settings.displayArea - 1] || "",
      fontSize: fontSizeOptions.value[settings.fontSize - 1] || "",
      speed: speedOptions.value[settings.speed - 1] || ""
    }));

    /** 重置弹幕设置到默认值 */
    const resetSettings = () => {
      settings.enabled = true;
      settings.opacity = 100;
      settings.fontSize = 3;
      settings.speed = 2;
      settings.displayArea = 3;
      settings.antiBlock = false;
      settings.enableCombo = true;
    };

    return {
      // 状态
      position,
      settings,
      textValues,
      actualFontSize,
      sliderConfigs,

      // 方法
      resetSettings
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
