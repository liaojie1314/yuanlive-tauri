<template>
  <div
    v-if="show"
    class="custom-amount-modal absolute inset-0 z-[2000] flex-center bg-black/40 backdrop-blur-sm"
    @click.self="handleCancel">
    <div class="w-[320px] rounded-2xl border border-[--line-color] bg-[--bg-popover] p-6 shadow-2xl">
      <div class="mb-6 flex-y-center rounded-xl border border-[--line-color] bg-[--bg-setting-item] px-4 py-3">
        <span class="mr-2 text-lg font-medium text-[--text-color]">¥</span>
        <input
          ref="inputRef"
          type="number"
          min="1"
          max="1000000"
          class="flex-1 border-none bg-transparent text-base text-[--text-color] placeholder-[--user-text-color] outline-none"
          v-model="inputValue"
          :placeholder="t('dialog.customAmount.placeholder')"
          @keyup.enter="handleConfirm" />
      </div>

      <div class="flex justify-end gap-3">
        <div
          class="flex cursor-pointer items-center justify-center rounded-lg border border-[--line-color] bg-[--bg-setting-item] px-5 py-2 text-sm font-medium text-[--text-color] transition-colors hover:bg-[--bg-menu-hover]"
          @click.stop="handleCancel">
          {{ t("components.common.cancel") }}
        </div>
        <div
          class="flex cursor-pointer items-center justify-center rounded-lg bg-red-500 px-5 py-2 text-sm font-medium text-white shadow-md shadow-red-500/20 transition-colors hover:bg-red-600"
          @click.stop="handleConfirm">
          {{ t("components.common.confirm") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
  initialValue?: number;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  confirm: [amount: number];
}>();

const inputValue = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

/** 取消充值金额输入 */
const handleCancel = () => {
  emit("update:show", false);
};

/** 确认充值金额 */
const handleConfirm = () => {
  const val = Math.floor(Number(inputValue.value));
  if (val > 0 && val <= 1000000) {
    emit("confirm", val);
    emit("update:show", false);
  } else {
    window.$message?.warning(t("dialog.customAmount.msg"));
  }
};

// 监听打开状态，赋值并自动聚焦
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      inputValue.value = props.initialValue ? String(props.initialValue) : "";
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  }
);
</script>
