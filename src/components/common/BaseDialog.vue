<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/60 z-1000 flex items-center justify-center backdrop-blur-sm"
    @click="handleOverlayClick">
    <div
      :style="{ width: props.width, height: props.height }"
      class="bg-[--bg-popover] rounded-xl max-w-[90%] max-h-[90vh] overflow-hidden shadow-2xl border border-[--line-color]"
      @click.stop>
      <div class="px-6 py-0 border-b border-[--line-color] relative h-16 flex items-center">
        <slot name="header">
          <h3 class="text-lg font-semibold text-[--text-color]">{{ title }}</h3>
        </slot>
        <div
          class="absolute top-1/2 -translate-y-1/2 right-4 cursor-pointer text-[--user-text-color] hover:text-[--text-color] hover:bg-[--bg-menu-hover] p-1.5 rounded-full transition-all"
          @click="closeDialog">
          <i-mdi-close class="w-5 h-5" />
        </div>
      </div>
      <div class="px-6 pb-6 pt-4">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  show: boolean;
  title?: string;
  width?: string;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  width: "600px",
  height: "auto"
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  close: [];
}>();

// 双向绑定
const show = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

// 关闭对话框
const closeDialog = () => {
  show.value = false;
  emit("close");
};

// 点击遮罩层关闭
const handleOverlayClick = () => {
  closeDialog();
};
</script>
