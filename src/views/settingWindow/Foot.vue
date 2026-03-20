<template>
  <div class="flex-center p-[20px_0]">
    <div class="gap-8px flex-center">
      <svg class="size-18px"><use href="#SmilingFace"></use></svg>
      <p class="text-(12px #777)">{{ t("setting.footer.likeProduct") }}</p>
      <n-popover style="padding: 0" trigger="hover" placement="top" v-model:show="isStar">
        <template #trigger>
          <p class="text-(12px #13987f) cursor-pointer">{{ t("setting.footer.starCta") }}</p>
        </template>
        <n-flex vertical class="w-360px h-fit">
          <!-- <video class="w-full h-240px rounded-t-8px object-cover" src="@/assets/video/star.mp4" autoplay loop /> -->
          <n-flex vertical class="p-14px" :size="10">
            <p class="text-(16px [--text-color])">{{ t("setting.footer.starPopoverTitle") }}</p>
            <p class="text-(12px [--user-text-color]) leading-5">{{ t("setting.footer.starPopoverDesc") }}</p>

            <n-flex class="ml-auto" :size="10">
              <div
                class="border-(1px solid #999) w-40px h-30px rounded-8px flex-center text-(12px [--text-color]) cursor-pointer"
                @click="isStar = false">
                {{ t("setting.footer.later") }}
              </div>

              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/liaojie1314/yuanlive-tauri"
                class="bg-#363636 px-10px h-30px rounded-8px flex-center text-(12px #f1f1f1) w-fit cursor-pointer no-underline">
                {{ t("setting.footer.starButton") }}
              </a>
            </n-flex>
          </n-flex>
        </n-flex>
      </n-popover>
      <p class="text-(12px #777)">{{ t("setting.footer.shareJoiner") }}</p>
      <n-popover style="padding: 0" trigger="hover" placement="top-end" v-model:show="isIssue">
        <template #trigger>
          <p class="text-(12px #13987f) cursor-pointer">{{ t("setting.footer.shareCta") }}</p>
        </template>
        <n-flex vertical class="w-360px h-fit">
          <!-- <video class="w-full h-240px rounded-t-8px object-cover" src="@/assets/video/issue.mp4" autoplay loop /> -->
          <n-flex vertical class="p-14px" :size="10">
            <p class="text-(16px [--text-color] )">{{ t("setting.footer.issuePopoverTitle") }}</p>
            <p class="text-(12px [--user-text-color]) leading-5">{{ t("setting.footer.issuePopoverDesc") }}</p>

            <n-flex class="ml-auto" :size="10">
              <div
                class="border-(1px solid #999) w-40px h-30px rounded-8px flex-center text-(12px [--text-color]) cursor-pointer"
                @click="isIssue = false">
                {{ t("setting.footer.later") }}
              </div>

              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/liaojie1314/yuanlive-tauri/issues"
                class="bg-#363636 px-10px h-30px rounded-8px flex-center text-(12px #f1f1f1) w-fit cursor-pointer no-underline">
                {{ t("setting.footer.issueButton") }}
              </a>
            </n-flex>
          </n-flex>
        </n-flex>
      </n-popover>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const isStar = ref(false);
const isIssue = ref(false);
</script>

<style scoped lang="scss"></style>
