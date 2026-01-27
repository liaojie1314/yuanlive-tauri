import { useI18n } from "vue-i18n";

import { isWindows } from "@/utils/PlatformUtils";
import { MacOsKeyEnum, WinKeyEnum } from "@/enums";

const useSideOptions = () => {
  const { t } = useI18n();

  return computed(() => [
    {
      url: "/general",
      label: t("setting.general.title"),
      icon: "setting-config"
    },
    {
      url: "/shortcut",
      label: t("setting.shortcut.title"),
      icon: "enter-the-keyboard"
    },
    {
      url: "/manageStore",
      label: t("setting.storage.title"),
      icon: "mini-sd-card"
    },
    {
      url: "/loginSetting",
      label: t("setting.login.title"),
      icon: "settings"
    }
  ]);
};

/** 发送按钮快捷键的选项 */
const useSendOptions = () => {
  const { t } = useI18n();
  const key = computed(() => {
    return `${isWindows() ? WinKeyEnum.SHIFT : MacOsKeyEnum["⇧"]}`;
  });

  return computed(() => [
    {
      label: t("setting.shortcut.sendMessageShortcutOption", { key: "Enter" }),
      value: "Enter"
    },
    {
      label: t("setting.shortcut.sendMessageShortcutOption", { key: key.value }),
      value: `${key.value}+Enter`
    }
  ]);
};
/** 字体 */
const useFontOptions = () => {
  const { t } = useI18n();
  return computed(() => [
    {
      label: t("setting.general.ui.fontOptions.PingFang"),
      value: "PingFang"
    },
    {
      label: t("setting.general.ui.fontOptions.AliFangYuan"),
      value: "AliFangYuan"
    }
  ]);
};

const langOptions = [
  {
    label: "Automatic",
    value: "AUTO"
  },
  {
    label: "简体中文",
    value: "zh-CN"
  },
  {
    label: "English",
    value: "en"
  }
];

export { useSideOptions, useSendOptions, useFontOptions, langOptions };
