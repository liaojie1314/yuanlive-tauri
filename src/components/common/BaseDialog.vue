<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 z-1000 flex items-center justify-center animate-fade-in"
    @click="handleOverlayClick">
    <div
      class="bg-white rounded-lg w-[600px] max-w-[90%] max-h-[90vh] overflow-hidden shadow-lg animate-slide-up"
      @click.stop>
      <div class="px-6 py-0 border-b border-gray-200 relative h-16 flex items-center">
        <slot name="header">
          <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
        </slot>
        <div
          class="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-800 transition-colors"
          @click="closeDialog">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </div>
      </div>
      <div class="p-6">
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
}

const props = withDefaults(defineProps<Props>(), {
  title: ""
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
