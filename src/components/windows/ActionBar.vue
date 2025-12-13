<template>
  <!--  user-select: none让元素不可以选中-->
  <div
    :data-tauri-drag-region="isDrag"
    :class="isCompatibility() ? 'flex justify-end select-none' : 'h-24px select-none w-full'">
    <template v-if="isCompatibility()">
      <!--  登录窗口的代理按钮  -->
      <div
        v-if="proxy"
        :class="{ network: isWindows() }"
        class="w-30px h-24px flex-center hover-box"
        @click="router.push('/network')">
        <svg
          :class="[iconColor !== '' ? `color-${iconColor}` : 'color-[--action-bar-icon-color]']"
          class="size-16px cursor-pointer">
          <use href="#settings"></use>
        </svg>
      </div>
      <slot></slot>
      <!--  固定在最顶层  -->
      <div v-if="topWinLabel !== void 0" @click="handleAlwaysOnTop" class="hover-box">
        <n-popover trigger="hover">
          <template #trigger>
            <svg
              v-if="alwaysOnTopStatus"
              :class="[iconColor !== '' ? `color-${iconColor}` : 'color-[--action-bar-icon-color]']"
              class="size-14px outline-none cursor-pointer">
              <use href="#onTop"></use>
            </svg>
            <svg
              v-else
              :class="[iconColor !== '' ? `color-${iconColor}` : 'color-[--action-bar-icon-color]']"
              class="size-16px outline-none cursor-pointer">
              <use href="#notOnTop"></use>
            </svg>
          </template>
          <span v-if="alwaysOnTopStatus">{{ $t("components.actionBar.alwaysOnTop.enabled") }}</span>
          <span v-else>{{ $t("components.actionBar.alwaysOnTop.disabled") }}</span>
        </n-popover>
      </div>
      <!-- 最小化 -->
      <div v-if="minW" @click="appWindow.minimize()" class="hover-box">
        <svg
          :class="[iconColor !== '' ? `color-${iconColor}` : 'color-[--action-bar-icon-color]']"
          class="size-24px opacity-66 cursor-pointer">
          <use href="#maximize"></use>
        </svg>
      </div>
      <!-- 最大化 -->
      <div v-if="maxW" @click="restoreWindow" class="hover-box">
        <svg
          v-show="!windowMaximized"
          :class="[iconColor !== '' ? `color-${iconColor}` : 'color-[--action-bar-icon-color]']"
          class="size-18px cursor-pointer">
          <use href="#rectangle-small"></use>
        </svg>
        <svg
          v-show="windowMaximized"
          :class="[iconColor !== '' ? `color-${iconColor}` : 'color-[--action-bar-icon-color]']"
          class="size-16px cursor-pointer">
          <use href="#internal-reduction"></use>
        </svg>
      </div>
      <!-- 关闭窗口 -->
      <div v-if="closeW" @click="handleCloseWin" :class="{ windowMaximized: 'rounded-rt-8px' }" class="action-close">
        <svg
          :class="[iconColor !== '' ? `color-${iconColor}` : 'color-[--action-bar-icon-color]']"
          class="size-14px cursor-pointer">
          <use href="#close"></use>
        </svg>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { emit } from "@tauri-apps/api/event";
import { info } from "@tauri-apps/plugin-log";
import { exit } from "@tauri-apps/plugin-process";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import router from "@/router";
import { EventEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt.ts";
import { useAlwaysOnTopStore } from "@/stores/alwaysOnTop.ts";
import { isCompatibility, isMac, isWindows } from "@/utils/PlatformUtils.ts";

defineOptions({
  name: "ActionBar"
});

const appWindow = WebviewWindow.getCurrent();
const {
  topWinLabel,
  proxy = false,
  minW = true,
  maxW = true,
  closeW = true,
  isDrag = true,
  iconColor = ""
} = defineProps<{
  minW?: boolean;
  maxW?: boolean;
  closeW?: boolean;
  topWinLabel?: string;
  currentLabel?: string;
  proxy?: boolean;
  isDrag?: boolean;
  iconColor?: string;
}>();
const { getWindowTop, setWindowTop } = useAlwaysOnTopStore();
// 窗口是否最大化状态
const windowMaximized = ref(false);
// 窗口是否置顶状态
const alwaysOnTopStatus = computed(() => {
  if (topWinLabel === void 0) return false;
  return getWindowTop(topWinLabel);
});

// resized 事件的 unListen 函数
let unListenResized: (() => void) | null = null;

watchEffect(() => {
  if (alwaysOnTopStatus.value) {
    appWindow.setAlwaysOnTop(alwaysOnTopStatus.value as boolean);
  }
});

/** 恢复窗口大小 */
const restoreWindow = async () => {
  if (windowMaximized.value) {
    await appWindow.unmaximize();
  } else {
    await appWindow.maximize();
  }
};

/** 设置窗口置顶 */
const handleAlwaysOnTop = async () => {
  if (topWinLabel !== void 0) {
    const isTop = !alwaysOnTopStatus.value;
    setWindowTop(topWinLabel, isTop);
    await appWindow.setAlwaysOnTop(isTop);
  }
};

/** 统一更新窗口放大状态 */
const updateWindowMaximized = async () => {
  const maximized = await appWindow.isMaximized();
  if (isMac()) {
    const fullscreen = await appWindow.isFullscreen();
    windowMaximized.value = maximized || fullscreen;
  } else {
    windowMaximized.value = maximized;
  }
};

/** 处理关闭窗口事件 */
const handleCloseWin = async () => {
  if (appWindow.label === "home") {
    // TODO: 退出程序或者隐藏
    await exit(0);
  } else if (appWindow.label === "login") {
    await exit(0);
  } else {
    await emit(EventEnum.WIN_CLOSE, appWindow.label);
    await appWindow.close();
  }
};

useMitt.on("handleCloseWin", handleCloseWin);

onMounted(async () => {
  // 初始化状态
  await updateWindowMaximized();

  unListenResized = await appWindow.onResized?.(() => {
    updateWindowMaximized();
  });

  // 监听 home 窗口的关闭事件
  if (appWindow.label === "home") {
    appWindow
      .onCloseRequested((event) => {
        info("[ActionBar]阻止[home]窗口关闭事件");
        event.preventDefault();
        appWindow.hide();
      })
      .then(() => {
        info("[ActionBar]监听[home]窗口关闭事件完成");
      });
  }
});

onUnmounted(() => {
  if (unListenResized) {
    unListenResized();
    unListenResized = null;
  }
});

// 暴露 windowMaximized 状态
defineExpose({
  windowMaximized
});
</script>

<style scoped lang="scss">
.hover-box {
  @apply w-28px h-24px flex-center hover:bg-[--action-bar-icon-hover];
}

.action-close {
  @apply w-28px h-24px flex-center cursor-pointer hover:bg-#c22b1c svg:hover:color-[#fff];
}
</style>
