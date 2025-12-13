<template>
  <div class="h-100vh w-100vw">
    <naive-provider :message-max="3" :notify-max="3" class="h-full">
      <router-view></router-view>
    </naive-provider>
  </div>
</template>

<script setup lang="ts">
import { StorageKeyEnum, ThemeEnum } from "./enums";
import { useSettingStore } from "@/stores/setting";
import { loadLanguage } from "./services/i18n";
import { isMobile } from "./utils/PlatformUtils";

const settingStore = useSettingStore();
const { themes, page } = storeToRefs(settingStore);

// 禁止拖拽图片及输入框
const preventDefault = (e: MouseEvent) => {
  const event = e.target as HTMLElement;
  // 检查目标元素是否是<img>元素
  if (event.nodeName.toLowerCase() === "img" || event.nodeName.toLowerCase() === "input") {
    e.preventDefault();
  }
};

// 禁止右键菜单
const preventGlobalContextMenu = (event: MouseEvent) => event.preventDefault();

// 控制阴影
watch(
  () => page.value.shadow,
  (val) => {
    // 移动端始终禁用阴影
    if (isMobile()) {
      document.documentElement.style.setProperty("--shadow-enabled", "1");
    } else {
      document.documentElement.style.setProperty("--shadow-enabled", val ? "0" : "1");
    }
  },
  { immediate: true }
);

// 控制高斯模糊
watch(
  () => page.value.blur,
  (val) => {
    document.documentElement.setAttribute("data-blur", val ? "1" : "0");
  },
  { immediate: true }
);

// 监听语言变化
watch(
  () => page.value.lang,
  (lang) => {
    console.log(lang);
    lang = lang === "AUTO" ? navigator.language : lang;
    loadLanguage(lang);
  },
  { immediate: true }
);

onMounted(() => {
  // 判断localStorage中是否有设置主题
  if (!localStorage.getItem(StorageKeyEnum.SETTING)) {
    // 初始化设置
    settingStore.initTheme(ThemeEnum.OS);
  }
  document.documentElement.dataset.theme = themes.value.content;
  window.addEventListener("dragstart", preventDefault);
  // 开发环境不禁止
  if (process.env.NODE_ENV !== "development") {
    // 禁用浏览器默认的快捷键
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "f" || e.key === "r" || e.key === "g" || e.key === "j")) {
        e.preventDefault();
      }
    });
    // 禁止右键菜单
    window.addEventListener("contextmenu", preventGlobalContextMenu, false);
  }
});

onUnmounted(() => {
  window.removeEventListener("contextmenu", preventGlobalContextMenu, false);
  window.removeEventListener("dragstart", preventDefault);
});
</script>

<style lang="scss">
img {
  user-select: none;
  -webkit-user-select: none;
}

input,
button,
a {
  user-select: auto;
  cursor: auto;
}
</style>
