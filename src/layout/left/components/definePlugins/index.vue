<template>
  <!-- 弹出框 -->
  <n-modal class="w-390px border-rd-8px" v-model:show="isShow" :mask-closable="false">
    <div class="bg-[--bg-popover] min-h-350px h-full box-border flex flex-col">
      <!-- 顶部图片加上操作栏 -->
      <div class="h-140px relative w-full p-6px box-border">
        <img
          src="/dispersion-bg.png"
          alt=""
          class="absolute blur-6px rounded-t-6px z-1 top-0 left-0 w-full h-140px object-cover" />
        <img
          src="/dispersion-bg.png"
          alt=""
          class="absolute rounded-t-6px z-2 top-0 left-0 w-full h-140px object-cover" />

        <div
          v-if="isMac()"
          class="mac-close z-10 relative size-13px shadow-inner bg-#ed6a5eff rounded-50% select-none"
          @click="isShow = false">
          <svg class="hidden size-7px color-#000 select-none absolute top-3px left-3px">
            <use href="#close"></use>
          </svg>
        </div>

        <svg
          v-if="isWindows()"
          class="z-10 color-#333 w-12px h-12px absolute top-6px right-6px cursor-pointer select-none"
          @click="isShow = false">
          <use href="#close"></use>
        </svg>
      </div>

      <n-flex justify="space-between" align="center">
        <n-flex align="center" class="p-18px truncate flex-1 min-w-0" :size="4">
          <p class="text-(16px [--text-color]) leading-loose truncate flex-1 min-w-0">
            {{ t("home.action.pluginManage") }}
          </p>
          <div
            class="ml-6px p-[4px_8px] size-fit bg-[--bate-bg] rounded-8px text-(12px [--bate-color] center) flex-shrink-0">
            Beta
          </div>
        </n-flex>

        <n-tabs
          type="segment"
          animated
          class="w-76px h-28px mr-22px flex-shrink-0"
          :value="viewMode"
          :on-update:value="(v: any) => (viewMode = v)">
          <n-tab name="card">
            <template #default>
              <svg class="size-16px"><use href="#view-grid-card"></use></svg>
            </template>
          </n-tab>
          <n-tab name="list">
            <template #default>
              <svg class="size-16px"><use href="#view-grid-list"></use></svg>
            </template>
          </n-tab>
        </n-tabs>
      </n-flex>

      <transition name="slide-up" mode="out-in">
        <Card v-if="viewMode === 'card'" />
        <List v-else />
      </transition>
    </div>
  </n-modal>
</template>
<script setup lang="ts">
import { useI18n } from "vue-i18n";

import Card from "./Card.vue";
import List from "./List.vue";
import { usePluginsStore } from "@/stores/plugins.ts";
import { isMac, isWindows } from "@/utils/PlatformUtils";

const { t } = useI18n();
/** 是否展示插件管理弹窗 */
const isShow = defineModel() as unknown as boolean;
const { viewMode } = storeToRefs(usePluginsStore());
</script>

<style scoped lang="scss">
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
