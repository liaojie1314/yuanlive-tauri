<template>
  <n-flex vertical :size="40">
    <!-- 通用设置 -->
    <n-flex vertical class="text-(14px [--text-color])" :size="16">
      <span class="pl-10px">{{ t("setting.general.appearance.title") }}</span>
      <n-flex align="center" :size="20" class="item">
        <n-flex
          vertical
          align="center"
          class="w-120px h-100px"
          :size="0"
          @click="activeItem = item.code"
          v-for="(item, index) in topicsList"
          :key="index">
          <div
            @click="handleTheme(item.code)"
            class="size-full rounded-8px cursor-pointer custom-shadow"
            :class="{ 'outline outline-2 outline-[--border-active-color] outline-offset': activeItem === item.code }">
            <component :is="item.model" />
          </div>
          <span class="text-12px pt-8px color-[--text-color]">{{ item.title }}</span>
        </n-flex>
      </n-flex>
    </n-flex>

    <!-- 系统设置 -->
    <n-flex v-if="isWindows()" vertical class="text-(14px [--text-color])" :size="16">
      <span class="pl-10px">{{ t("setting.general.system.title") }}</span>
      <n-flex class="item" :size="12" vertical>
        <!-- 关闭面板 -->
        <n-flex v-if="isWindows()" align="center" justify="space-between" :wrap="false">
          <span>{{ t("setting.general.system.closePanel") }}</span>
          <n-radio-group v-model:value="tips.type" size="small">
            <n-space :size="88">
              <label class="text-(14px #707070) flex gap-6px lh-16px items-center">
                <n-radio :value="CloseBxEnum.HIDE" />
                <span>{{ t("setting.general.system.closeOptions.minimizeToTray") }}</span>
              </label>
              <label class="text-(14px #707070) flex gap-6px lh-16px items-center">
                <n-radio :value="CloseBxEnum.CLOSE" />
                <span>{{ t("setting.general.system.closeOptions.exitProgram") }}</span>
              </label>
            </n-space>
          </n-radio-group>
          <label class="text-(12px #909090) flex gap-6px justify-end items-center">
            <n-checkbox size="small" v-model:checked="tips.notTips" />
            <span>{{ t("setting.general.system.closePrompt") }}</span>
          </label>
        </n-flex>
        <span v-if="isWindows()" class="w-full h-1px bg-[--line-color]"></span>
        <!-- ESC关闭面板 -->
        <n-flex v-if="isWindows()" align="center" justify="space-between">
          <span>{{ t("setting.general.system.escCloseWindow") }}</span>
          <n-switch size="small" v-model:value="escClose" />
        </n-flex>
      </n-flex>
    </n-flex>

    <!-- 界面设置 -->
    <n-flex vertical class="text-(14px [--text-color])" :size="16">
      <span class="pl-10px">{{ t("setting.general.ui.title") }}</span>
      <n-flex class="item" :size="12" vertical>
        <!-- 语言 -->
        <n-flex align="center" justify="space-between">
          <span>{{ t("setting.general.ui.language") }}</span>
          <n-select class="w-140px" size="small" label-field="label" v-model:value="page.lang" :options="langOptions" />
        </n-flex>
        <span class="w-full h-1px bg-[--line-color]"></span>
        <n-flex align="center" justify="space-between">
          <span>{{ t("setting.general.ui.blur") }}</span>
          <n-switch size="small" v-model:value="page.blur" />
        </n-flex>
        <span class="w-full h-1px bg-[--line-color]"></span>
        <n-flex align="center" justify="space-between">
          <span>{{ t("setting.general.ui.shadow") }}</span>
          <n-switch size="small" v-model:value="page.shadow" />
        </n-flex>
        <span class="w-full h-1px bg-[--line-color]"></span>

        <!-- 字体 -->
        <n-flex align="center" justify="space-between">
          <span>{{ t("setting.general.ui.font") }}</span>
          <n-select
            class="w-140px"
            size="small"
            label-field="label"
            v-model:value="page.fonts"
            :options="fontOptions" />
        </n-flex>
      </n-flex>
    </n-flex>
  </n-flex>
</template>
<script setup lang="tsx">
import { useI18n } from "vue-i18n";

import { useTopicsList } from "./model.tsx";
import { useFontOptions, langOptions } from "./config.ts";
import { CloseBxEnum } from "@/enums";
import { isWindows } from "@/utils/PlatformUtils";
import { useSettingStore } from "@/stores/setting.ts";

const { t } = useI18n();
const settingStore = useSettingStore();
const { themes, tips, page } = settingStore;
const { escClose } = storeToRefs(settingStore);
const activeItem = ref<string>(themes.pattern);
const topicsList = useTopicsList();
const fontOptions = useFontOptions();

/** 切换主题 */
const handleTheme = (code: string) => {
  settingStore.toggleTheme(code);
};
</script>
<style scoped lang="scss">
.item {
  @apply bg-[--bg-setting-item] rounded-12px size-full p-12px box-border border-(solid 1px [--line-color]) custom-shadow;
}
</style>
