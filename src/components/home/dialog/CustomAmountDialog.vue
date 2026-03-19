<template>
  <div
    v-if="show"
    class="custom-amount-modal absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    @click.self="handleCancel">
    <div class="bg-[--bg-popover] rounded-2xl p-6 w-[320px] shadow-2xl border border-[--line-color]">
      <div class="bg-[--bg-setting-item] rounded-xl flex items-center px-4 py-3 mb-6 border border-[--line-color]">
        <span class="text-lg font-medium text-[--text-color] mr-2">¥</span>
        <input
          ref="inputRef"
          v-model="inputValue"
          type="number"
          :placeholder="t('dialog.customAmount.placeholder')"
          class="bg-transparent border-none outline-none text-[--text-color] flex-1 text-base placeholder-[--user-text-color]"
          @keyup.enter="handleConfirm"
          min="1"
          max="1000000" />
      </div>

      <div class="flex justify-end gap-3">
        <div
          @click.stop="handleCancel"
          class="px-5 py-2 rounded-lg bg-[--bg-setting-item] text-[--text-color] border border-[--line-color] hover:bg-[--bg-menu-hover] transition-colors cursor-pointer text-sm font-medium flex items-center justify-center">
          {{ t("components.common.cancel") }}
        </div>
        <div
          @click.stop="handleConfirm"
          class="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer text-sm font-medium flex items-center justify-center shadow-md shadow-red-500/20">
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
