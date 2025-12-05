<template>
  <n-config-provider
    :theme-overrides="globalTheme === ThemeEnum.DARK ? darkThemeOverrides : lightThemeOverrides"
    :theme="globalTheme"
    :locale="zhCN"
    :date-locale="dateZhCN">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider :max="notifyMax">
          <n-message-provider :max="messageMax">
            <n-modal-provider>
              <slot></slot>
              <naive-provider-content />
            </n-modal-provider>
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, lightTheme, dateZhCN, zhCN, type GlobalThemeOverrides } from "naive-ui";
import { ThemeEnum } from "@/enums";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

defineOptions({ name: "NaiveProvider" });

const { notifyMax, messageMax } = defineProps<{
  notifyMax?: number;
  messageMax?: number;
}>();

/** 监听深色主题颜色变化 */
const globalTheme = ref<any>("dark");
const pattern = ref(ThemeEnum.OS);
const prefers = matchMedia("(prefers-color-scheme: dark)");
// 定义不需要显示消息提示的窗口
const noMessageWindows = ["tray"];

/** 跟随系统主题模式切换主题 */
const followOS = () => {
  globalTheme.value = prefers.matches ? darkTheme : lightTheme;
  document.documentElement.dataset.theme = prefers.matches ? ThemeEnum.DARK : ThemeEnum.LIGHT;
};

const commonTheme: GlobalThemeOverrides = {
  Input: {
    borderRadius: "10px",
    borderHover: "0",
    border: "0",
    borderDisabled: "0",
    borderFocus: "0",
    boxShadowFocus: "0"
  },
  Checkbox: {
    colorChecked: "#1fc162",
    borderChecked: "1px solid #1fc162",
    borderFocus: "1px solid #1fc162",
    boxShadowFocus: "0 0 0 2px rgba(19, 152, 127, 0.3)"
  },
  Tag: {
    borderRadius: "4px"
  },
  Button: {
    borderRadiusMedium: "10px",
    borderRadiusSmall: "6px",
    colorPrimary: "#1fc162"
  },
  Tabs: {
    tabTextColorSegment: "#707070",
    tabPaddingMediumSegment: "4px",
    tabTextColorActiveLine: "#1fc162",
    tabTextColorHoverLine: "#1fc162",
    tabTextColorActiveBar: "#1fc162",
    tabTextColorHoverBar: "#1fc162",
    barColor: "#1fc162"
  },
  Popover: {
    padding: "5px",
    borderRadius: "8px"
  },
  Dropdown: {
    borderRadius: "8px"
  },
  Avatar: {
    border: "1px solid #fff"
  },
  Switch: {
    railColorActive: "#1fc162",
    loadingColor: "#1fc162",
    boxShadowFocus: "0 0 0 2px rgba(19, 152, 127, 0.3)"
  },
  Radio: {
    boxShadowActive: "inset 0 0 0 1px #1fc162",
    boxShadowFocus: "inset 0 0 0 1px #1fc162,0 0 0 2px rgba(19, 152, 127, 0.3)",
    boxShadowHover: "inset 0 0 0 1px #1fc162",
    dotColorActive: "#1fc162"
  },
  Message: {
    iconColorSuccess: "#1fc162",
    iconColorLoading: "#1fc162",
    loadingColor: "#1fc162",
    borderRadius: "8px"
  },
  Slider: {
    handleSize: "12px",
    fontSize: "10px",
    markFontSize: "8px",
    fillColor: "#1fc162",
    fillColorHover: "#1fc162",
    indicatorBorderRadius: "8px"
  },
  Notification: {
    borderRadius: "8px"
  },
  Steps: {
    indicatorBorderColorProcess: "#1fc162",
    indicatorColorProcess: "#39f681"
  },
  LoadingBar: {
    colorLoading: "#1fc162"
  }
};

/** 浅色模式的主题颜色 */
const lightThemeOverrides: GlobalThemeOverrides = {
  ...commonTheme,
  Scrollbar: {
    color: "#d5d5d5",
    colorHover: "#c5c5c5"
  },
  Skeleton: {
    color: "rgba(200, 200, 200, 0.6)",
    colorEnd: "rgba(200, 200, 200, 0.2)"
  }
};

/** 深色模式的主题颜色 */
const darkThemeOverrides: GlobalThemeOverrides = {
  ...commonTheme,
  Scrollbar: {
    color: "rgba(255, 255, 255, 0.2)",
    colorHover: "rgba(255, 255, 255, 0.3)"
  }
};

// 挂载naive组件的方法至window, 以便在路由钩子函数和请求函数里面调用
const registerNaiveTools = () => {
  window.$loadingBar = useLoadingBar();
  window.$dialog = useDialog();
  window.$notification = useNotification();
  window.$modal = useModal();

  // 获取原始的消息对象
  const originalMessage = useMessage();

  // 创建一个空的消息对象，用于禁用消息的窗口
  const noOpMessage = {
    info: () => {},
    success: () => {},
    warning: () => {},
    error: () => {},
    loading: () => ({
      destroy: () => {},
      type: "loading"
    }),
    create: () => ({
      destroy: () => {},
      type: "info"
    }),
    destroyAll: () => {}
  } as unknown as ReturnType<typeof useMessage>;

  // 检查当前路由是否需要禁用消息
  const shouldDisableMessage = () => {
    return noMessageWindows.includes(getCurrentWebviewWindow().label);
  };

  // 设置消息对象
  window.$message = shouldDisableMessage() ? noOpMessage : originalMessage;
};

const NaiveProviderContent = defineComponent({
  name: "NaiveProviderContent",
  setup() {
    registerNaiveTools();
  },
  render() {
    return h("div");
  }
});

watchEffect(() => {
  if (pattern.value === ThemeEnum.OS) {
    followOS();
    prefers.addEventListener("change", followOS);
  } else {
    // 判断content是否是深色还是浅色
    document.documentElement.dataset.theme = globalTheme.value || ThemeEnum.LIGHT;
    prefers.removeEventListener("change", followOS);
  }
});
</script>
<style scoped></style>
