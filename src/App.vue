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

// 禁止右键菜单
const preventGlobalContextMenu = (event: MouseEvent) => event.preventDefault();

onMounted(() => {
  window.addEventListener("dragstart", preventDefault);
  // 开发环境不禁止
  if (process.env.NODE_ENV !== "development") {
    // 禁用浏览器默认的快捷键
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "f" || e.key === "r" || e.key === "g" || e.key === "j")) {
        e.preventDefault();
      }
    });
    // 禁止右键菜单
    window.addEventListener("contextmenu", preventGlobalContextMenu, false);
  }
});

onUnmounted(() => {
  window.removeEventListener("contextmenu", preventGlobalContextMenu, false);
  window.removeEventListener("dragstart", preventDefault);
});
</script>

<style lang="scss">
img {
  user-select: none;
  -webkit-user-select: none;
}

input,
button,
a {
  user-select: auto;
  cursor: auto;
}
</style>
