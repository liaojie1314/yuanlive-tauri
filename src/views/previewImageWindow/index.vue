<template>
  <div
    class="bg-#222 relative flex size-full flex-col select-none"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave">
    <action-bar class="bg-#000 z-9999" />

    <div ref="viewportRef" class="relative h-full w-full flex-1 overflow-hidden bg-black">
      <div
        ref="transformLayerRef"
        class="absolute top-0 left-0 origin-center will-change-transform"
        :style="transformStyle">
        <img
          ref="imageRef"
          alt="preview"
          class="pointer-events-auto block select-none"
          :src="currentImage"
          :style="{
            cursor: isDragging ? 'grabbing' : 'grab'
          }"
          @mousedown="startDrag"
          @load="onImageLoad"
          @dragstart.prevent />
      </div>

      <transition name="viewer-tip">
        <div
          v-if="showTip"
          class="px-24px py-12px rounded-8px text-(white 14px) gap-8px fixed top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center bg-black/60 backdrop-blur-sm transition-all duration-300 select-none">
          <svg class="size-16px"><use href="#info"></use></svg>
          {{ tipText }}
        </div>
      </transition>
    </div>

    <div
      v-show="imageList.length > 1 && showArrows.left"
      class="left-20px size-40px flex-center fixed top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 opacity-0 transition-all duration-200 hover:bg-black/50"
      :class="{ 'opacity-100': showArrows.left }"
      @click="prevImage"
      @mouseenter="handleArrowEnter('left')"
      @mouseleave="handleArrowLeave('left')">
      <svg class="size-24px color-white rotate-180"><use href="#arrow-right"></use></svg>
    </div>
    <div
      v-show="imageList.length > 1 && showArrows.right"
      class="right-20px size-40px flex-center fixed top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 opacity-0 transition-all duration-200 hover:bg-black/50"
      :class="{ 'opacity-100': showArrows.right }"
      @click="nextImage"
      @mouseenter="handleArrowEnter('right')"
      @mouseleave="handleArrowLeave('right')">
      <svg class="size-24px color-white"><use href="#arrow-right"></use></svg>
    </div>

    <div data-tauri-drag-region class="h-50px bg-#000 gap-30px z-9999 flex-center">
      <n-tooltip placement="top">
        <template #trigger>
          <svg class="size-24px color-white cursor-pointer" @click="zoomOut"><use href="#zoom-out"></use></svg>
        </template>
        {{ t("preview.image.zoomOut") }}
      </n-tooltip>

      <span class="color-white text-14px min-w-50px text-center select-none">{{ scaleText }}</span>

      <n-tooltip placement="top">
        <template #trigger>
          <svg class="size-24px color-white cursor-pointer" @click="zoomIn"><use href="#zoom-in"></use></svg>
        </template>
        {{ t("preview.image.zoomIn") }}
      </n-tooltip>

      <n-tooltip placement="top">
        <template #trigger>
          <svg class="size-24px scale-x--100 color-white cursor-pointer" @click="rotateLeft">
            <use href="#RotateRight"></use>
          </svg>
        </template>
        {{ t("preview.image.rotateLeft") }}
      </n-tooltip>

      <n-tooltip placement="top">
        <template #trigger>
          <svg class="size-24px color-white cursor-pointer" @click="rotateRight"><use href="#RotateRight"></use></svg>
        </template>
        {{ t("preview.image.rotateRight") }}
      </n-tooltip>

      <n-tooltip placement="top">
        <template #trigger>
          <svg class="size-24px color-white cursor-pointer" @click="resetImage()"><use href="#refresh"></use></svg>
        </template>
        {{ t("preview.image.reset") }}
      </n-tooltip>

      <n-tooltip placement="top">
        <template #trigger>
          <svg class="size-24px color-white cursor-pointer" @click="saveImage"><use href="#Importing"></use></svg>
        </template>
        {{ t("preview.image.saveAs") }}
      </n-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { save } from "@tauri-apps/plugin-dialog";
import { getCurrentWebviewWindow, WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useDownload } from "@/hooks/useDownload";
import { useImageViewer } from "@/hooks/useImageViewer";
import { useTauriListener } from "@/hooks/useTauriListener";
import { useImageViewerStore } from "@/stores/imageViewer.ts";

const { t } = useI18n();
const { addListener } = useTauriListener();
const { downloadFile } = useDownload();
const imageViewerStore = useImageViewerStore();
const { downloadOriginalByIndex } = useImageViewer();
const appWindow = WebviewWindow.getCurrent();

// 初始化数据
const imageList = ref<string[]>([]);
const currentIndex = ref(0);
// 状态变量
const scale = ref(1);
const rotation = ref(0);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
// 提示相关
const showTip = ref(false);
const tipText = ref("");
const dragStart = reactive({ x: 0, y: 0, initialTX: 0, initialTY: 0 });
// 左右箭头显示
const showArrows = reactive({
  left: false,
  right: false,
  leftHover: false,
  rightHover: false
});
const imageRef = ref<HTMLImageElement>();
const viewportRef = useTemplateRef<HTMLElement>("viewportRef");

const scaleText = computed(() => `${Math.round(scale.value * 100)}%`);

const currentImage = computed(() => {
  if (imageViewerStore.isSingleMode) {
    return imageViewerStore.singleImage;
  }
  return imageList.value[currentIndex.value];
});

const transformStyle = computed(() => {
  const style: Record<string, string> = {
    transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${scale.value}) rotate(${rotation.value}deg)`
  };
  if (!isDragging.value) {
    style.transition = "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  }
  return style;
});

/** 图片加载完成后：调整到窗口中心 */
const onImageLoad = () => {
  fitImageToWindow();
};

/** 图片适应窗口：居中显示，保持比例 */
const fitImageToWindow = () => {
  if (!viewportRef.value || !imageRef.value) return;

  // 重置旋转
  rotation.value = 0;

  const viewport = viewportRef.value;
  const img = imageRef.value;

  // 获取尺寸
  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;

  if (imgWidth === 0 || imgHeight === 0) return;

  // 1. 计算居中位置
  translateX.value = (viewportWidth - imgWidth) / 2;
  translateY.value = (viewportHeight - imgHeight) / 2;

  // 2. 计算适应比例 (保留80px内边距)
  const padding = 80;
  const availableWidth = viewportWidth - padding;
  const availableHeight = viewportHeight - padding;

  const widthRatio = availableWidth / imgWidth;
  const heightRatio = availableHeight / imgHeight;

  // 取较小比例以确保完全显示，且不超过100%
  // 如果希望小图也放大填满，可以去掉 Math.min(..., 1) 中的 1
  scale.value = Math.min(widthRatio, heightRatio, 1);
};

/**
 * 鼠标移动：根据位置显示/隐藏左右箭头
 * @param e 鼠标事件对象
 */
const handleMouseMove = (e: MouseEvent) => {
  const { clientX } = e;
  const { innerWidth } = window;
  if (!showArrows.leftHover) showArrows.left = clientX <= 78;
  if (!showArrows.rightHover) showArrows.right = innerWidth - clientX <= 78;
};

/** 鼠标离开：隐藏左右箭头 */
const handleMouseLeave = () => {
  if (!showArrows.leftHover) showArrows.left = false;
  if (!showArrows.rightHover) showArrows.right = false;
};

/**
 * 鼠标进入：显示箭头
 * @param direction 箭头方向
 */
const handleArrowEnter = (direction: "left" | "right") => {
  showArrows[`${direction}Hover`] = true;
  showArrows[direction] = true;
};

/**
 * 鼠标离开：隐藏箭头
 * @param direction 箭头方向
 */
const handleArrowLeave = (direction: "left" | "right") => {
  showArrows[`${direction}Hover`] = false;
  showArrows[direction] = false;
};

/**
 * 鼠标按下：开始拖拽
 * @param e 鼠标事件对象
 */
const startDrag = (e: MouseEvent) => {
  if (e.button !== 0) return;
  e.preventDefault();

  isDragging.value = true;

  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  dragStart.initialTX = translateX.value;
  dragStart.initialTY = translateY.value;

  document.addEventListener("mousemove", handleDrag, { passive: false });
  document.addEventListener("mouseup", stopDrag);
};

/**
 * 鼠标移动：拖拽图片
 * @param e 鼠标事件对象
 */
const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  e.preventDefault();

  const deltaX = e.clientX - dragStart.x;
  const deltaY = e.clientY - dragStart.y;

  translateX.value = dragStart.initialTX + deltaX;
  translateY.value = dragStart.initialTY + deltaY;
};

/** 鼠标松开：结束拖拽 */
const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
};

/** 放大图片 */
const zoomIn = () => {
  scale.value = Math.min(5, scale.value + 0.1);
};

/** 缩小图片 */
const zoomOut = () => {
  scale.value = Math.max(0.1, scale.value - 0.1);
};

/** 左转图片 */
const rotateLeft = () => {
  rotation.value -= 90;
};

/** 右转图片 */
const rotateRight = () => {
  rotation.value += 90;
};

/** 重置图片：居中显示，保持比例 */
const resetImage = () => {
  fitImageToWindow();
};

/** 保存图片 */
const saveImage = async () => {
  const imageUrl = currentImage.value;
  const suggestedName = imageUrl.split("/").pop() || "image.png";

  const savePath = await save({
    filters: [
      {
        name: t("preview.image.filterName"),
        extensions: ["png", "jpg", "jpeg", "gif", "webp"]
      }
    ],
    defaultPath: suggestedName
  });

  if (savePath) {
    await downloadFile(imageUrl, savePath);
  }
};

/**
 * 显示提示消息
 * @param message 提示消息内容
 */
const showTipMessage = (message: string) => {
  tipText.value = message;
  showTip.value = true;
  setTimeout(() => {
    showTip.value = false;
  }, 1500);
};

/**
 * 同步当前显示索引
 * @param index 新的索引值
 */
const syncCurrentIndex = (index: number) => {
  currentIndex.value = index;
  imageViewerStore.currentIndex = index;
  downloadOriginalByIndex(index);
};

/** 显示上一张图片 */
const prevImage = () => {
  if (currentIndex.value > 0) {
    syncCurrentIndex(currentIndex.value - 1);
  } else {
    showTipMessage(t("preview.image.firstImage"));
  }
};

/** 显示下一张图片 */
const nextImage = () => {
  if (currentIndex.value < imageList.value.length - 1) {
    syncCurrentIndex(currentIndex.value + 1);
  } else {
    showTipMessage(t("preview.image.lastImage"));
  }
};

/**
 * 键盘事件处理
 * @param e 键盘事件对象
 */
const handleKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case "ArrowLeft":
      prevImage();
      break;
    case "ArrowRight":
      nextImage();
      break;
    case "=":
    case "+":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomIn();
      }
      break;
    case "-":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomOut();
      }
      break;
    case "0":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        resetImage();
      }
      break;
    case "Escape":
      appWindow.close();
      break;
  }
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();

  await addListener(
    appWindow.listen("update-image", (event: any) => {
      const { index } = event.payload;
      imageList.value = imageViewerStore.imageList;
      syncCurrentIndex(index);
    }),
    "update-image"
  );

  if (imageViewerStore.isSingleMode) {
    imageList.value = [imageViewerStore.singleImage];
    syncCurrentIndex(0);
  } else {
    imageList.value = imageViewerStore.imageList;
    syncCurrentIndex(imageViewerStore.currentIndex);
  }

  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", fitImageToWindow);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  window.removeEventListener("resize", fitImageToWindow);
});
</script>

<style scoped>
.viewer-tip-enter-active,
.viewer-tip-leave-active {
  transition: opacity 0.3s ease;
}

.viewer-tip-enter-from,
.viewer-tip-leave-to {
  opacity: 0;
}

:deep(.action-close),
:deep(.hover-box) {
  svg {
    color: #fff !important;
  }
}
</style>
