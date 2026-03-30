<template>
  <div class="bg-[var(--tray-bg-color)] size-full">
    <img
      v-if="bgUrl"
      alt=""
      class="object-cover absolute top-0 left-0 w-screen h-screen dark:opacity-20"
      :src="bgUrl" />
    <div class="h-full w-full overflow-hidden flex flex-col relative">
      <header class="shrink-0 box-border" :class="{ 'pt-[var(--safe-area-inset-top)]': safeAreaRef }">
        <slot name="header"></slot>
      </header>
      <div class="flex-1 overflow-hidden grow-1">
        <slot name="container"></slot>
      </div>
      <footer
        v-if="!nestedSelf"
        class="shrink-0 footer box-border"
        :class="{ 'pb-[var(--safe-area-inset-bottom)]': slots.footer == void 0 }">
        <slot name="footer" class="pb-[var(--safe-area-inset-bottom)] box-border" />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import bgImg from "@/assets/mobile/background.webp";

const { background = true, safeArea = true } = defineProps<{
  showFooter?: boolean;
  background?: string | boolean;
  safeArea?: boolean;
}>();

const slots = defineSlots<{
  header: () => unknown;
  container: () => any;
  footer: () => unknown;
}>();

const bgUrl = computed(() => {
  return background === true ? bgImg : background;
});

/** 检查当前组件是否被嵌套在另一个 MobileScaffold 内部 */
const useNestedSelfCheck = () => {
  const selfIsParent = inject("removeSafeArea");
  return selfIsParent !== void 0;
};

const nestedSelf = useNestedSelfCheck();

/**
 * 安全区域处理
 * @param getter 安全区域是否开启的函数
 * @returns 安全区域是否开启的响应式值
 */
const useSafeArea = (getter: () => boolean) => {
  const safeArea = ref(true);
  // 移除脚手架提供的安全区域样式，交由组件自己控制
  const removeSafeArea = () => {
    safeArea.value = false;
  };
  provide("removeSafeArea", removeSafeArea);
  return computed(() => safeArea.value && getter());
};

const safeAreaRef = useSafeArea(() => safeArea);
</script>

<style lang="scss" scoped>
.footer > :slotted(*) {
  padding-bottom: var(--safe-area-inset-bottom);
}
</style>
