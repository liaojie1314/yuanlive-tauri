<template>
  <div class="image-block my-2">
    <div
      class="group relative inline-block overflow-hidden rounded-lg border border-[--line-color] bg-[--input-area-bg]">
      <img
        loading="lazy"
        class="h-auto max-h-[400px] max-w-full cursor-zoom-in object-contain transition-transform duration-300 group-hover:scale-105"
        :src="url"
        @click="previewImage" />

      <div
        class="pointer-events-none absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "ImageBlock"
});

const props = defineProps<{
  url: string;
}>();

/** 点击图片块处理 */
const previewImage = () => {
  // TODO: 预览图片
  console.log("预览图片:", props.url);
};
</script>
