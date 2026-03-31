<template>
  <main class="flex size-full overflow-hidden select-none">
    <!-- 侧边栏选项 -->
    <section data-tauri-drag-region class="left-bar">
      <div class="menu-list relative">
        <div v-for="(item, index) in sideOptions" :key="index">
          <div class="menu-item" :class="{ active: activeItem === item.url }" @click="pageJumps(item.url)">
            <n-flex align="center">
              <svg><use :href="`#${item.icon}`"></use></svg>
              {{ item.label }}
            </n-flex>
          </div>
        </div>
      </div>

      <div class="bottom-20px left-60px gap-10px absolute flex cursor-default items-center select-none">
        <p class="text-(12px #666)">{{ t("setting.common.providerLabel") }}:</p>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/liaojie1314/yuanlive-tauri"
          class="text-(12px #13987f) cursor-pointer no-underline">
          {{ t("setting.common.providerName") }}
        </a>
      </div>
    </section>

    <!-- 右边内容 -->
    <section class="rounded-r-8px border-l-(1px solid [--line-color]) relative flex-1 bg-[--right-bg-color]">
      <action-bar :max-w="true" />
      <header data-tauri-drag-region class="header">
        {{ title }}
      </header>
      <n-scrollbar
        style="max-height: calc(100vh - 70px)"
        data-tauri-drag-region
        :class="{ 'shadow-inner': page.shadow }">
        <n-flex vertical justify="center" v-if="skeleton" class="p-24px" :size="12">
          <n-skeleton height="26px" text style="width: 30%" class="rounded-8px" />
          <n-skeleton height="26px" text class="rounded-8px" :repeat="5" />
          <n-skeleton height="26px" text style="width: 60%" class="rounded-8px" />
        </n-flex>
        <template v-else>
          <div class="p-24px flex-1"><router-view /></div>
          <Foot />
        </template>
      </n-scrollbar>
    </section>
  </main>
</template>
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import router from "@/router";
import { useSideOptions } from "./config.ts";
import Foot from "@/views/settingWindow/Foot.vue";
import { useSettingStore } from "@/stores/setting.ts";
import { StorageKeyEnum } from "~/src/enums/index.ts";

const { t } = useI18n();
const settingStore = useSettingStore();
const { page } = storeToRefs(settingStore);
const sideOptions = useSideOptions();

// 保存取消监听的函数，防止内存泄漏
let unlistenRouteChange: UnlistenFn | null = null;

const skeleton = ref(true);
/**当前选中的元素 默认选中itemsTop的第一项*/
const activeItem = ref<string>("/general");
const title = ref<string>("");

/**
 * 统一跳转路由方法
 * @param url 跳转的路由
 * */
const pageJumps = (url: string) => {
  const matched = sideOptions.value.find((item) => item.url === url);
  if (matched) {
    activeItem.value = matched.url;
    title.value = matched.label;
  }
  router.push(url);
};

watch(
  sideOptions,
  (options) => {
    if (!options.length) return;
    const current = options.find((item) => item.url === activeItem.value) ?? options[0];
    activeItem.value = current.url;
    title.value = current.label;
  },
  { immediate: true }
);

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  setTimeout(() => {
    skeleton.value = false;
  }, 300);
  const targetRoute = localStorage.getItem(StorageKeyEnum.TARGET_SETTING_ROUTE);
  if (targetRoute) {
    activeItem.value = targetRoute;
    localStorage.removeItem(StorageKeyEnum.TARGET_SETTING_ROUTE);
  }
  pageJumps(activeItem.value);
  unlistenRouteChange = await listen<string>("change-setting-route", (event) => {
    const targetPath = event.payload;
    if (targetPath) {
      pageJumps(targetPath);
    }
  });
});

onUnmounted(() => {
  if (unlistenRouteChange) {
    unlistenRouteChange();
  }
});
</script>

<style scoped lang="scss">
@use "@/styles/global/variable" as *;
.left-bar {
  @include menu-list();
  background: var(--bg-left-menu);
  width: 200px;
  padding: 24px 12px;
  box-sizing: border-box;
  color: var(--text-color);
  .menu-item {
    padding: 8px 10px;
    border-radius: 10px;
    margin-top: 6px;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    svg {
      width: 18px;
      height: 18px;
    }
    &:not(.active):hover {
      background-color: var(--bg-left-menu-hover);
    }
    &:hover {
      background-color: var(--bg-left-active);
      svg {
        animation: none;
      }
    }
  }
}

.active {
  background-color: var(--bg-left-active);
}

.header {
  @apply h-42px pl-40px text-18px color-[--text-color] border-b-(1px solid [--line-color]) flex w-full items-center select-none;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
