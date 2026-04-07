<template>
  <div class="m-0 flex h-full flex-col overflow-hidden p-0 text-[--text-color] select-none">
    <div class="px-4 pt-4">
      <user-info-card v-model:save-login-info="saveLoginInfo" />
    </div>

    <div class="mx-4 mt-4 mb-2 rounded-lg border border-[--line-color] bg-[--tray-bg-color] p-4 shadow-sm">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-[--tray-hover]"
          @click="showUploadDialog = true">
          <i-mdi-video-plus class="mb-1 text-xl text-blue-500"></i-mdi-video-plus>
          <span class="text-sm text-[--user-text-color]">{{ $t("home.user.publishVideo") }}</span>
        </div>
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-[--tray-hover]"
          @click="createWebviewWindow('视频管理', 'manageVideo', 1200, 720, '', true, 800, 500)">
          <i-mdi-video class="mb-1 text-xl text-green-500"></i-mdi-video>
          <span class="text-sm text-[--user-text-color]">{{ $t("home.user.manageVideo") }}</span>
        </div>
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-[--tray-hover]"
          @click="openRecordWindow">
          <i-mdi-camcorder class="mb-1 text-xl text-red-500"></i-mdi-camcorder>
          <span class="text-sm text-[--user-text-color]">{{ $t("home.user.openRecord") }}</span>
        </div>
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-[--tray-hover]"
          @click="createWebviewWindow('直播数据', 'manageLive', 1200, 720, '', true, 800, 500)">
          <i-mdi-chart-line class="mb-1 text-xl text-orange-500"></i-mdi-chart-line>
          <span class="text-sm text-[--user-text-color]">{{ $t("home.user.liveData") }}</span>
        </div>
      </div>
    </div>

    <div
      v-resize="handleTopBarResize"
      class="mx-4 mb-2 flex-between-center rounded-lg border border-[--line-color] bg-[--tray-bg-color] px-2 shadow-sm">
      <n-tabs
        class="flex-1"
        v-model:value="activeTopTab"
        :tab-active-color="'#ff0050'"
        :tab-font-size="14"
        :tab-font-weight="500">
        <n-tab-pane name="works" :tab="$t('home.user.tab.works', { count: 0 })" />
        <n-tab-pane name="recommend" :tab="$t('home.user.tab.recommend')" />
        <n-tab-pane name="like" :tab="$t('home.user.tab.like')" />
        <n-tab-pane name="collection" :tab="$t('home.user.tab.collection')" />
        <n-tab-pane name="history" :tab="$t('home.user.tab.watchHistory')" />
        <n-tab-pane name="later" :tab="$t('home.user.tab.watchLater')" />
        <n-tab-pane name="reservation" :tab="$t('home.user.tab.myReservation')" />
        <n-tab-pane name="ai-note" :tab="$t('home.user.tab.aiNotes')" />
      </n-tabs>

      <div
        v-show="['works', 'like', 'later', 'collection'].includes(activeTopTab) && showBatchBtn"
        class="pl-4 shrink-0">
        <n-button size="small" secondary class="rounded-md" @click="toggleBatchMode">
          {{ isBatchMode ? $t("home.user.exitBatchMode") : $t("home.user.batchMode") }}
        </n-button>
      </div>
    </div>

    <div class="flex-1 relative flex flex-col min-h-0 overflow-hidden">
      <keep-alive>
        <TabWorks v-if="activeTopTab === 'works'" v-model:is-batch-mode="isBatchMode" />
      </keep-alive>
      <keep-alive>
        <TabRecommend v-if="activeTopTab === 'recommend'" />
      </keep-alive>
      <keep-alive>
        <TabLike v-if="activeTopTab === 'like'" v-model:is-batch-mode="isBatchMode" />
      </keep-alive>
      <keep-alive>
        <TabCollection v-if="activeTopTab === 'collection'" v-model:is-batch-mode="isBatchMode" />
      </keep-alive>
      <keep-alive>
        <TabHistory v-if="activeTopTab === 'history'" />
      </keep-alive>
      <keep-alive>
        <TabLater v-if="activeTopTab === 'later'" v-model:is-batch-mode="isBatchMode" />
      </keep-alive>
    </div>

    <upload-video-dialog v-model:show="showUploadDialog" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useWindow } from "@/hooks/useWindow";
import { isWindows } from "@/utils/PlatformUtils";
import TabWorks from "./components/TabWorks.vue";
import TabRecommend from "./components/TabRecommend.vue";
import TabLike from "./components/TabLike.vue";
import TabCollection from "./components/TabCollection.vue";
import TabHistory from "./components/TabHistory.vue";
import TabLater from "./components/TabLater.vue";

defineOptions({ name: "User" });

const { t } = useI18n();
const { createWebviewWindow } = useWindow();

const saveLoginInfo = ref(true);
const showUploadDialog = ref(false);
const activeTopTab = ref("works");
const showBatchBtn = ref(true);
const isBatchMode = ref(false);

/** 切换批量管理状态 */
const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value;
};

/**
 * 处理顶部栏大小变化
 * @param size 顶部栏大小
 */
const handleTopBarResize = (size: { width: number; height: number }) => {
  showBatchBtn.value = size.width > 750;
  if (!showBatchBtn.value && isBatchMode.value) {
    isBatchMode.value = false;
  }
};

/** 打开直播窗口 */
const openRecordWindow = () => {
  if (isWindows()) {
    createWebviewWindow("直播", "record", 1200, 720, "", true, 800, 500);
    return;
  }
  window.$message.warning(t("home.user.notSupport"));
};

watch(activeTopTab, () => {
  isBatchMode.value = false;
});
</script>

<style scoped lang="scss">
:deep(.square-checkbox.n-checkbox .n-checkbox-box) {
  border-radius: 2px !important;
}
:deep(.n-input__placeholder span) {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  display: block;
}
</style>
