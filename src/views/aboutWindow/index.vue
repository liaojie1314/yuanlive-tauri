<template>
  <main class="login-box size-full overflow-hidden select-none">
    <action-bar :max-w="false" />
    <n-flex vertical align="center" :size="20" class="size-full pt-100px" data-tauri-drag-region>
      <div @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" class="box" data-tauri-drag-region>
        <div id="computer" class="computer" v-once>
          <img class="w-224px! h-158px! relative" src="@/assets/img/win.png" alt="" />
          <div
            style="background: rgba(111, 111, 111, 0.1)"
            class="w-170px h-113px absolute top-9% left-51% transform -translate-x-51% -translate-y-9%"></div>
          <img
            class="drop-shadow-md absolute top-30% left-1/2 transform -translate-x-1/2 -translate-y-30% w-140px h-60px"
            src="/vite.svg"
            alt="" />
        </div>
      </div>

      <n-flex vertical align="center" :size="20" class="cursor-default" data-tauri-drag-region>
        <span class="text-(15px #707070)">
          {{ t("home.about.version", { version: _pkg.version, arch: osArch || "" }) }}
        </span>
        <span class="text-(15px #707070)">
          {{ t("home.about.device", { type: osType || "", version: osVersion || "" }) }}
        </span>
        <n-flex vertical class="text-(12px #909090)" :size="8" align="center">
          <span>
            {{ t("home.about.copyright", { start: currentYear - 1, end: currentYear }) }}
          </span>
          <span>{{ t("home.about.rights") }}</span>
        </n-flex>
      </n-flex>
    </n-flex>
  </main>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { useI18n } from "vue-i18n";
import { arch, version } from "@tauri-apps/plugin-os";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import pkg from "~/package.json";
import { getOSType, isWindows } from "@/utils/PlatformUtils";

const { t } = useI18n();

const _pkg = reactive({
  version: pkg.version
});
const osType = ref();
const osArch = ref();
const osVersion = ref();
// 使用day.js获取当前年份
const currentYear = dayjs().year();

const element = ref<HTMLElement | null>(null);
/** 鼠标移动时，对元素进行旋转的指数 */
const multiple = 20;

/**
 * 处理鼠标移动事件，对元素进行旋转
 * @param x 鼠标在元素中的 x 坐标
 * @param y 鼠标在元素中的 y 坐标
 */
const transformElement = (x: number, y: number) => {
  if (element.value) {
    const box = element.value.getBoundingClientRect();
    const calcX = -(y - box.y - box.height / 2) / multiple;
    const calcY = (x - box.x - box.width / 2) / multiple;
    element.value.style.transform = `rotateX(${calcX}deg) rotateY(${calcY}deg)`;
  }
};

/**
 * 处理鼠标移动事件，对元素进行旋转
 * @param event 鼠标移动事件对象
 */
const handleMouseMove = (event: MouseEvent) => {
  window.requestAnimationFrame(() => {
    transformElement(event.clientX, event.clientY);
  });
};

/** 处理鼠标离开事件，将元素旋转角度重置为 0 */
const handleMouseLeave = () => {
  window.requestAnimationFrame(() => {
    if (element.value) {
      element.value.style.transform = "rotateX(0) rotateY(0)";
    }
  });
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  osType.value = getOSType();
  osArch.value = arch();
  osVersion.value = version();
  if (isWindows()) {
    const parts = version().split(".");
    const build_number = Number(parts[2]);
    osVersion.value = build_number > 22000 ? "11" : "10";
  }
  element.value = document.getElementById("computer");
});
</script>

<style scoped lang="scss">
@use "@/styles/global/login-bg";
.box {
  width: 240px;
  height: 200px;
  perspective: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  .computer {
    position: relative;
    transition: all 0.2s;
  }
}
</style>
