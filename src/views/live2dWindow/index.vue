<template>
  <main class="size-full select-none overflow-hidden relative bg-transparent">
    <Transition name="fade">
      <div
        v-if="showBubble"
        class="bubble absolute left-1/2 transform -translate-x-1/2 z-10"
        ref="containerRef"
        :class="{ 'is-long-text': isScrolling, 'is-typing': isTyping }">
        <span
          ref="textRef"
          class="bubble-text"
          :class="{ scrolling: isScrolling }"
          :style="{ animationDuration: scrollDuration }"
          @animationend="onScrollEnd">
          {{ bubbleText }}
        </span>
      </div>
    </Transition>

    <canvas ref="canvasRef" class="block cursor-grab active:cursor-grabbing" @mousedown="startDrag"></canvas>
  </main>
</template>

<script setup lang="ts">
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";
import { LogicalPosition } from "@tauri-apps/api/window";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

// 挂载 PIXI 到 window (插件必需)
(window as any).PIXI = PIXI;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const live2dModel = ref<any>(null);
const appWindow = getCurrentWebviewWindow();

// 气泡相关
const showBubble = ref(false);
const bubbleText = ref("");
const containerRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);
const isScrolling = ref(false);
const scrollDuration = ref("5s");

let bubbleTimer: any = null;
let typingTimer: any = null;
const audioSource = shallowRef<AudioBufferSourceNode | null>(null);
const lipSyncInterval: any = null;
const isTyping = ref(false);
// --- 核心逻辑：拖拽窗口 ---
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const startDrag = (e: MouseEvent) => {
  isDragging = true;
  dragOffset = { x: e.clientX, y: e.clientY };
  window.addEventListener("pointermove", handleDrag);
  window.addEventListener("pointerup", stopDrag);
};

const handleDrag = async (e: PointerEvent) => {
  if (!isDragging) return;

  // 使用 Web API 获取屏幕尺寸 (比 Tauri Monitor API 更符合前端坐标系)
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  let newX = e.screenX - dragOffset.x;
  let newY = e.screenY - dragOffset.y;

  // 边界限制
  if (newX < 0) newX = 0;
  if (newY < 0) newY = 0;
  if (newX > screenWidth - winWidth) newX = screenWidth - winWidth;
  if (newY > screenHeight - winHeight) newY = screenHeight - winHeight;

  await appWindow.setPosition(new LogicalPosition(newX, newY));
};

const stopDrag = () => {
  isDragging = false;
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
};

// --- 核心逻辑：打字机与滚动 ---
const typeWriter = (text: string, onComplete: () => void) => {
  if (typingTimer) clearInterval(typingTimer);
  bubbleText.value = "";
  let i = 0;
  // 打字速度
  const speed = 80;
  isTyping.value = true;
  isScrolling.value = false; // 打字时绝对不准滚

  typingTimer = setInterval(() => {
    bubbleText.value += text.charAt(i);
    i++;
    if (i >= text.length) {
      clearInterval(typingTimer);
      typingTimer = null;
      isTyping.value = false;
      onComplete();
    }
  }, speed);
};

const checkScroll = () => {
  if (!textRef.value || !containerRef.value) return;
  const textWidth = textRef.value.scrollWidth;
  const containerWidth = containerRef.value.clientWidth;

  // 加上 2px 容错
  if (textWidth > containerWidth + 2) {
    isScrolling.value = true;
    const distance = textWidth - containerWidth + 20;
    // 动态速度：40px/s，最少滚动3秒
    const duration = Math.max(3, distance / 40);
    scrollDuration.value = `${duration}s`;
    // 设置 CSS 变量
    containerRef.value.style.setProperty("--scroll-distance", `-${distance}px`);
  } else {
    isScrolling.value = false;
    containerRef.value.style.removeProperty("--scroll-distance");
  }
};

const onScrollEnd = () => {
  // 滚动结束后，停留 2 秒再关闭
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    showBubble.value = false;
  }, 2000);
};

// --- 主交互函数 ---
const speak = async (text: string) => {
  showBubble.value = true;
  isScrolling.value = false;
  if (bubbleTimer) clearTimeout(bubbleTimer);

  // TODO: 1. 尝试获取后端音频
  // 2. 启动打字机
  typeWriter(text, async () => {
    await nextTick();
    checkScroll();

    // 如果不需要滚动，则使用倒计时关闭
    if (!isScrolling.value) {
      const stayTime = Math.max(2000, text.length * 200);
      bubbleTimer = setTimeout(() => {
        showBubble.value = false;
      }, stayTime);
    }
  });
};

onMounted(async () => {
  if (!canvasRef.value) return;
  // 获取屏幕可用区域 (排除任务栏)
  const screenW = window.screen.availWidth;
  const screenH = window.screen.availHeight;
  // 获取当前窗口大小 (或者直接写死 300 和 500)
  const winW = window.outerWidth;
  const winH = window.outerHeight;
  // 设置边缘距离
  const margin = 0;
  // 计算坐标 (屏幕宽 - 窗口宽 - 边距)
  const x = screenW - winW - margin;
  const y = screenH - winH - margin;
  // 移动窗口
  await appWindow.setPosition(new LogicalPosition(x, y));
  await appWindow.show();

  // 初始化 Pixi v6 应用
  const app = new PIXI.Application({
    view: canvasRef.value,
    autoStart: true,
    resizeTo: window,
    transparent: true,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });

  // 模型路径
  const modelPath = "https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples/Samples/Resources/Hiyori/Hiyori.model3.json";

  try {
    const model = await Live2DModel.from(modelPath);
    live2dModel.value = model;
    app.stage.addChild(model);
    const updateLayout = () => {
      // 获取 Pixi 渲染器的实际画面大小 (比 window.innerWidth 更准)
      const screenW = app.renderer.screen.width;
      const screenH = app.renderer.screen.height;
      // 1. 强制重置锚点为 (0,0) - 左上角，这样计算最不容易出错
      model.anchor.set(0, 0);
      // 2. 计算合适的缩放比例
      // 宽度占 80% 或 高度占 90%，取最小值，保证完全显示
      // 注意：这里用 model.internalModel.width 获取原始尺寸更保险
      const rawWidth = model.internalModel.originalWidth || model.width;
      const rawHeight = model.internalModel.originalHeight || model.height;
      const scaleX = screenW / rawWidth;
      const scaleY = screenH / rawHeight;
      const scale = Math.min(scaleX, scaleY); // 取更小的比例以适应窗口
      model.scale.set(scale);
      // 3. 物理计算居中坐标
      // 目标位置 = (屏幕总宽 - 模型实际宽) / 2
      const contentWidth = model.width; // 缩放后的宽度
      const contentHeight = model.height; // 缩放后的高度
      // X轴：居中
      model.x = (screenW - contentWidth) / 2;
      // Y轴：底部对齐 (屏幕高 - 模型高)
      model.y = screenH - contentHeight;
    };
    // 1. 立即执行一次
    updateLayout();
    // 2. 监听 Pixi 的 resize 事件 (当窗口大小改变时自动修正位置)
    app.renderer.on("resize", () => {
      updateLayout();
    });
    // 3. 点击事件
    model.on("hit", (hitAreas) => {
      if (hitAreas.includes("Body")) {
        model.motion("TapBody");
        speak("这是一段非常长的测试文本，用来演示气泡的跑马灯滚动效果，如果不滚动我就要睡着了zzZ");
      }
    });

    app.stage.addChild(model);
  } catch (e) {
    console.error("Live2D 加载失败:", e);
  }
});

// 清理事件
onUnmounted(() => {
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
  if (typingTimer) clearInterval(typingTimer);
  if (bubbleTimer) clearTimeout(bubbleTimer);
  if (lipSyncInterval) clearInterval(lipSyncInterval);
  if (audioSource.value) {
    try {
      audioSource.value.stop();
    } catch {}
  }
});
</script>

<style scoped lang="scss">
/* 气泡容器样式 */
.bubble {
  top: 5px; /* 位于窗口顶部 10% 处 */
  max-width: 88%; /* 限制最大宽度 */
  background-color: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  justify-content: center; /* 默认居中 */
  align-items: center;
  overflow: hidden; /* 隐藏溢出文字 */

  /* 小三角 */
  &::after {
    content: "";
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid rgba(255, 255, 255, 0.95);
  }

  /* 长文本模式：左对齐，防止开头被切掉 */
  &.is-long-text,
  &.is-typing {
    justify-content: flex-start;
  }
}

/* 文字样式 */
.bubble-text {
  display: inline-block;
  white-space: nowrap;
  padding: 0;

  &.scrolling {
    animation-name: marquee;
    animation-timing-function: linear;
    animation-delay: 0.5s;
    animation-iteration-count: 1; /* 只滚一次 */
    animation-direction: normal;
    animation-fill-mode: forwards; /* 停在最后 */
  }
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(var(--scroll-distance));
  }
}

/* Vue Transition */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
