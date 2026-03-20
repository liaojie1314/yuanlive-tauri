<template>
  <n-flex vertical :size="40">
    <!-- 通用设置 -->
    <n-flex vertical class="text-(14px [--text-color])" :size="16">
      <span class="pl-10px">{{ t("setting.general.appearance.title") }}</span>
      <n-flex align="center" class="item" :size="20">
        <n-flex
          vertical
          align="center"
          v-for="(item, index) in topicsList"
          class="w-120px h-100px"
          :size="0"
          :key="index"
          @click="activeItem = item.code">
          <div
            class="rounded-8px custom-shadow size-full cursor-pointer"
            :class="{ 'outline-offset outline outline-2 outline-[--border-active-color]': activeItem === item.code }"
            @click="handleTheme(item.code)">
            <component :is="item.model" />
          </div>
          <span class="text-12px pt-8px color-[--text-color]">{{ item.title }}</span>
        </n-flex>
      </n-flex>
    </n-flex>

    <!-- 系统设置 -->
    <n-flex v-if="isWindows()" vertical class="text-(14px [--text-color])" :size="16">
      <span class="pl-10px">{{ t("setting.general.system.title") }}</span>
      <n-flex vertical class="item" :size="12">
        <!-- 关闭面板 -->
        <n-flex v-if="isWindows()" align="center" justify="space-between" :wrap="false">
          <span>{{ t("setting.general.system.closePanel") }}</span>
          <n-radio-group size="small" v-model:value="tips.type">
            <n-space :size="88">
              <label class="text-(14px #707070) gap-6px lh-16px flex-y-center">
                <n-radio :value="CloseBxEnum.HIDE" />
                <span>{{ t("setting.general.system.closeOptions.minimizeToTray") }}</span>
              </label>
              <label class="text-(14px #707070) gap-6px lh-16px flex-y-center">
                <n-radio :value="CloseBxEnum.CLOSE" />
                <span>{{ t("setting.general.system.closeOptions.exitProgram") }}</span>
              </label>
            </n-space>
          </n-radio-group>
          <label class="text-(12px #909090) gap-6px flex-end-center">
            <n-checkbox size="small" v-model:checked="tips.notTips" />
            <span>{{ t("setting.general.system.closePrompt") }}</span>
          </label>
        </n-flex>
        <span v-if="isWindows()" class="h-1px w-full bg-[--line-color]"></span>
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
      <n-flex vertical class="item" :size="12">
        <!-- 语言 -->
        <n-flex align="center" justify="space-between">
          <span>{{ t("setting.general.ui.language") }}</span>
          <n-select size="small" label-field="label" class="w-140px" v-model:value="page.lang" :options="langOptions" />
        </n-flex>
        <span class="h-1px w-full bg-[--line-color]"></span>
        <n-flex align="center" justify="space-between">
          <span>{{ t("setting.general.ui.blur") }}</span>
          <n-switch size="small" v-model:value="page.blur" />
        </n-flex>
        <span class="h-1px w-full bg-[--line-color]"></span>
        <n-flex align="center" justify="space-between">
          <span>{{ t("setting.general.ui.shadow") }}</span>
          <n-switch size="small" v-model:value="page.shadow" />
        </n-flex>
        <span class="h-1px w-full bg-[--line-color]"></span>

        <!-- 字体 -->
        <n-flex align="center" justify="space-between">
          <span>{{ t("setting.general.ui.font") }}</span>
          <n-select
            size="small"
            label-field="label"
            class="w-140px"
            v-model:value="page.fonts"
            :options="fontOptions" />
        </n-flex>
      </n-flex>
    </n-flex>
  </n-flex>
</template>
<script setup lang="tsx">
import { useI18n } from "vue-i18n";

import { CloseBxEnum } from "@/enums";
import { useTopicsList } from "./model.tsx";
import { isWindows } from "@/utils/PlatformUtils";
import { useSettingStore } from "@/stores/setting.ts";
import { useFontOptions, langOptions } from "./config.ts";

const { t } = useI18n();
const settingStore = useSettingStore();
const { themes, tips, page } = settingStore;
const { escClose } = storeToRefs(settingStore);
const topicsList = useTopicsList();
const fontOptions = useFontOptions();

const activeItem = ref<string>(themes.pattern);

/**
 * 切换主题
 * @param code 主题代码
 */
const handleTheme = (code: string) => {
  settingStore.toggleTheme(code);
};
</script>
<style scoped lang="scss">
.item {
  @apply rounded-12px p-12px border-(solid 1px [--line-color]) custom-shadow box-border size-full bg-[--bg-setting-item];
}
</style>
