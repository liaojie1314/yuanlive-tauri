<template>
  <div
    class="w-full h-[56px] grid grid-cols-[100px_1fr_100px] z-2 bg-background text-foreground pt-[var(--safe-area-inset-top)]">
    <div class="size-full flex items-center" @click="handleBack">
      <svg class="iconpark-icon w-24px h-24px ms-16px p-5px">
        <use href="#fanhui" class="text-foreground"></use>
      </svg>
    </div>
    <div class="w-full h-full overflow-hidden flex items-center justify-center">
      <div class="grid items-center">
        <div class="truncate whitespace-nowrap overflow-hidden text-foreground text-ellipsis w-full text-center">
          {{ props.name }}
        </div>
      </div>
    </div>
    <div class="w-full h-full flex items-center">
      <div v-if="!props.hiddenRight" class="w-full justify-end flex pe-16px">
        <svg class="w-24px h-24px iconpark-icon p-5px"><use href="#diannao"></use></svg>
        <svg class="w-24px h-24px iconpark-icon p-5px" @click="handleMoreClick"><use href="#more"></use></svg>
      </div>
    </div>
  </div>

  <n-divider v-if="props.border" class="m-0!" />
</template>

<script setup lang="ts">
const router = useRouter();

export interface HeaderBarProps {
  hiddenRight?: boolean;
  enableDefaultBackground?: boolean;
  enableShadow?: boolean;
  name?: string | false;
  border?: boolean;
}

const props = withDefaults(defineProps<HeaderBarProps>(), {
  hiddenRight: false,
  enableDefaultBackground: true,
  enableShadow: true,
  name: false,
  border: false
});

// 移除脚手架提供的安全区域样式，交由组件自己控制
const removeScaffoldSaveArea = inject<() => void>("removeSafeArea", () => undefined);
removeScaffoldSaveArea();

/** 返回上一页 */
const handleBack = async () => {
  router.back();
};

/** 点击更多 */
const handleMoreClick = () => {
  // TODO
};
</script>

<style lang="scss" scoped></style>
