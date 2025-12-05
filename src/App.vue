<template>
  <div class="h-100vh w-100vw">
    <naive-provider :message-max="3" :notify-max="3" class="h-full">
      <router-view></router-view>
    </naive-provider>
  </div>
</template>

<script setup lang="ts">
// 禁止拖拽图片及输入框
const preventDefault = (e: MouseEvent) => {
  const event = e.target as HTMLElement;
  // 检查目标元素是否是<img>元素
  if (event.nodeName.toLowerCase() === "img" || event.nodeName.toLowerCase() === "input") {
    e.preventDefault();
  }
};

onMounted(() => {
  window.addEventListener("dragstart", preventDefault);
});

onUnmounted(() => {
  window.removeEventListener("dragstart", preventDefault);
});
</script>
