<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 z-1000 flex items-center justify-center"
    @click="handleOverlayClick">
    <div
      :style="{ width: props.width, height: props.height }"
      class="bg-white rounded-lg max-w-[90%] max-h-[90vh] overflow-hidden shadow-lg"
      @click.stop>
      <div class="px-6 py-0 border-b border-gray-200 relative h-16 flex items-center">
        <slot name="header">
          <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
        </slot>
        <div
          class="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-800 transition-colors"
          @click="closeDialog">
          <i-mdi-close class="w-5 h-5" />
        </div>
      </div>
      <div class="px-6 pb-6">
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
