<template>
  <div v-if="show" class="fixed inset-0 z-1000 flex-center bg-black/60 backdrop-blur-sm" @click="handleOverlayClick">
    <div
      class="max-h-[90vh] max-w-[90%] overflow-hidden rounded-xl border border-[--line-color] bg-[--bg-popover] shadow-2xl"
      :style="{ width: props.width, height: props.height }"
      @click.stop>
      <div class="relative flex h-16 items-center border-b border-[--line-color] px-6 py-0">
        <slot name="header">
          <h3 class="text-lg font-semibold text-[--text-color]">{{ title }}</h3>
        </slot>
        <div
          class="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-[--user-text-color] transition-all hover:bg-[--bg-menu-hover] hover:text-[--text-color]"
          @click="closeDialog">
          <i-mdi-close class="h-5 w-5" />
        </div>
      </div>
      <div class="px-6 pt-4 pb-6">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "BaseDialog"
});

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

const show = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/** 关闭对话框 */
const closeDialog = () => {
  show.value = false;
  emit("close");
};

/** 点击遮罩层关闭 */
const handleOverlayClick = () => {
  closeDialog();
};
</script>
