<template>
  <div class="image-block my-2">
    <div
      class="relative group inline-block overflow-hidden rounded-lg border border-[--line-color] bg-[--input-area-bg]">
      <img
        :src="url"
        class="max-w-full h-auto max-h-[400px] object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        @click="previewImage" />

      <div
        class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
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
