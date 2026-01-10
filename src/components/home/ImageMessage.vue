<template>
  <div @click="handleImageClick" class="relative inline-block">
    <img
      :src="imageUrl"
      :alt="altText"
      class="rounded cursor-pointer hover:opacity-90 w-full max-w-full h-auto"
      :style="{
        maxWidth: maxWidth === 'small' ? '120px' : maxWidth === 'medium' ? '200px' : '300px'
      }" />
    <div v-if="showCaption && caption" class="text-xs text-gray-500 mt-1 text-center">{{ caption }}</div>
    <div v-if="showLoading" class="absolute inset-0 bg-black bg-opacity-30 rounded flex items-center justify-center">
      <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  imageUrl: string;
  altText?: string;
  caption?: string;
  showCaption?: boolean;
  showLoading?: boolean;
  maxWidth?: "small" | "medium" | "large";
}

const props = withDefaults(defineProps<Props>(), {
  altText: "聊天图片",
  caption: "",
  showCaption: false,
  showLoading: false,
  maxWidth: "medium"
});

const emit = defineEmits<(e: "image-click", imageUrl: string) => void>();

const handleImageClick = () => {
  emit("image-click", props.imageUrl);
};
</script>

<style scoped></style>
