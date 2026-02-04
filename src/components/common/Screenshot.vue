<template>
  <div ref="canvasbox" class="canvasbox">
    <canvas ref="drawCanvas" class="draw-canvas"></canvas>
    <canvas ref="maskCanvas" class="mask-canvas"></canvas>
    <canvas ref="imgCanvas" class="img-canvas"></canvas>
    <div ref="magnifier" class="magnifier">
      <canvas ref="magnifierCanvas"></canvas>
    </div>
    <!-- 选区拖动区域 -->
    <div ref="selectionArea" class="selection-area" v-show="showButtonGroup" :style="selectionAreaStyle">
      <!-- 内部拖动区域 -->
      <div
        :class="['drag-area', currentDrawTool ? 'cannot-drag' : 'can-drag']"
        :title="t('components.screenshot.tooltipDrag')"
        @mousedown="handleSelectionDragStart"
        @mousemove="handleSelectionDragMove"
        @mouseup="handleSelectionDragEnd"
        @dblclick="confirmSelection"></div>

      <!-- resize控制点 - 四个角 -->
      <div
        :class="['resize-handle', 'resize-nw', { disabled: currentDrawTool }]"
        :title="t('components.screenshot.tooltipResize')"
        @mousedown.stop="handleResizeStart($event, 'nw')"></div>
      <div
        :class="['resize-handle', 'resize-ne', { disabled: currentDrawTool }]"
        :title="t('components.screenshot.tooltipResize')"
        @mousedown.stop="handleResizeStart($event, 'ne')"></div>
      <div
        :class="['resize-handle', 'resize-sw', { disabled: currentDrawTool }]"
        :title="t('components.screenshot.tooltipResize')"
        @mousedown.stop="handleResizeStart($event, 'sw')"></div>
      <div
        :class="['resize-handle', 'resize-se', { disabled: currentDrawTool }]"
        :title="t('components.screenshot.tooltipResize')"
        @mousedown.stop="handleResizeStart($event, 'se')"></div>

      <!-- resize控制点 - 四条边的中间 -->
      <div
        :class="['resize-handle', 'resize-n', { disabled: currentDrawTool }]"
        :title="t('components.screenshot.tooltipResize')"
        @mousedown.stop="handleResizeStart($event, 'n')"></div>
      <div
        :class="['resize-handle', 'resize-e', { disabled: currentDrawTool }]"
        :title="t('components.screenshot.tooltipResize')"
        @mousedown.stop="handleResizeStart($event, 'e')"></div>
      <div
        :class="['resize-handle', 'resize-s', { disabled: currentDrawTool }]"
        :title="t('components.screenshot.tooltipResize')"
        @mousedown.stop="handleResizeStart($event, 's')"></div>
      <div
        :class="['resize-handle', 'resize-w', { disabled: currentDrawTool }]"
        :title="t('components.screenshot.tooltipResize')"
        @mousedown.stop="handleResizeStart($event, 'w')"></div>

      <!-- 圆角控制器 -->
      <div class="border-radius-controller" :style="borderRadiusControllerStyle" @click.stop>
        <label>{{ t("components.screenshot.borderRadius") }}:</label>
        <input type="range" :value="borderRadius" @input="handleBorderRadiusChange" min="0" max="100" step="1" />
        <span>{{ borderRadius }}px</span>
      </div>
    </div>

    <div ref="buttonGroup" class="button-group" v-show="showButtonGroup && !isDragging && !isResizing">
      <span
        :class="{ active: currentDrawTool === 'rect' }"
        :title="t('components.screenshot.toolRect')"
        @click="drawImgCanvas('rect')">
        <svg><use href="#square"></use></svg>
      </span>
      <span
        :class="{ active: currentDrawTool === 'circle' }"
        :title="t('components.screenshot.toolCircle')"
        @click="drawImgCanvas('circle')">
        <svg><use href="#round"></use></svg>
      </span>
      <span
        :class="{ active: currentDrawTool === 'arrow' }"
        :title="t('components.screenshot.toolArrow')"
        @click="drawImgCanvas('arrow')">
        <svg><use href="#arrow-right-up"></use></svg>
      </span>
      <span
        :class="{ active: currentDrawTool === 'mosaic' }"
        :title="t('components.screenshot.toolMosaic')"
        @click="drawImgCanvas('mosaic')">
        <svg><use href="#mosaic"></use></svg>
      </span>
      <!-- 重做 -->
      <span :title="t('components.screenshot.redo')" @click="drawImgCanvas('redo')">
        <svg><use href="#refresh"></use></svg>
      </span>
      <!-- 撤回：当没有涂鸦时禁用 -->
      <span
        :class="{ disabled: !canUndo }"
        :aria-disabled="!canUndo"
        :title="t('components.screenshot.undo')"
        @click.stop="drawImgCanvas('undo')">
        <svg><use href="#return"></use></svg>
      </span>
      <span :title="t('components.screenshot.confirm')" @click="confirmSelection">
        <svg><use href="#check-small"></use></svg>
      </span>
      <span :title="t('components.screenshot.cancel')" @click="cancelSelection">
        <svg><use href="#close"></use></svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from "vue";
import { useI18n } from "vue-i18n";
import { emitTo } from "@tauri-apps/api/event";
import { writeImage } from "@tauri-apps/plugin-clipboard-manager";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { TauriCommandEnum } from "@/enums";
import { isMac } from "@/utils/PlatformUtils";
import { useCanvasTool } from "@/hooks/useCanvasTool";
import { ErrorType, invokeWithErrorHandler } from "@/utils/TauriInvokeHandler.ts";

type ScreenConfig = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  scaleX: number;
  scaleY: number;
  isDrawing: boolean;
  width: number;
  height: number;
};

// 获取当前窗口实例
const { t } = useI18n();
const appWindow = WebviewWindow.getCurrent();

// 图像层
const imgCanvas: Ref<HTMLCanvasElement | null> = ref(null);
const imgCtx: Ref<CanvasRenderingContext2D | null> = ref(null);

// 蒙版层
const maskCanvas: Ref<HTMLCanvasElement | null> = ref(null);
const maskCtx: Ref<CanvasRenderingContext2D | null> = ref(null);

// 绘图层
const drawCanvas: Ref<HTMLCanvasElement | null> = ref(null);
const drawCtx: Ref<CanvasRenderingContext2D | null> = ref(null);
let drawTools: any;
// 是否可撤回
const canUndo = ref(false);

// 放大镜
const magnifier: Ref<HTMLDivElement | null> = ref(null);
const magnifierCanvas: Ref<HTMLCanvasElement | null> = ref(null);
const magnifierCtx: Ref<CanvasRenderingContext2D | null> = ref(null);
const magnifierWidth: number = 120; // 放大镜的宽度
const magnifierHeight: number = 120; // 放大镜的高度
const zoomFactor: number = 3; // 放大的倍数

// 按钮组
const buttonGroup: Ref<HTMLDivElement | null> = ref(null);
const showButtonGroup: Ref<boolean> = ref(false); // 控制按钮组显示

// 选区拖动区域
const selectionArea: Ref<HTMLDivElement | null> = ref(null);
const selectionAreaStyle: Ref<any> = ref({});
const isDragging: Ref<boolean> = ref(false);
const dragOffset: Ref<{ x: number; y: number }> = ref({ x: 0, y: 0 });

// 圆角控制器样式
const borderRadiusControllerStyle: Ref<any> = ref({});
// 定义一个全局变量用于存储动画帧 ID
let rafId: number | null = null;
// 防止重复初始化的锁
const isInitializing = ref(false);
// 存储取消监听的函数
let unlistenCapture: (() => void) | null = null;
let unlistenCaptureReset: (() => void) | null = null;

// resize相关
const isResizing: Ref<boolean> = ref(false);
const resizeDirection: Ref<string> = ref("");
const resizeStartPosition: Ref<{ x: number; y: number; width: number; height: number; left: number; top: number }> =
  ref({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    left: 0,
    top: 0
  });

// 圆角控制
const borderRadius: Ref<number> = ref(0);

// 截屏信息
const screenConfig: Ref<ScreenConfig> = ref({
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  scaleX: 0,
  scaleY: 0,
  isDrawing: false,
  width: 0,
  height: 0
});

// 截屏图片
let screenshotImage: HTMLImageElement;
let isImageLoaded: boolean = false;

// 当前选择的绘图工具
const currentDrawTool: Ref<string | null> = ref(null);

// 性能优化：鼠标移动事件节流（仅 macOS）
let mouseMoveThrottleId: number | null = null;

// 窗口状态恢复函数
const restoreWindowState = async () => {
  await appWindow.hide();
};

/**
 * 绘制图形
 * @param {string} type - 图形类型
 */
const drawImgCanvas = (type: string) => {
  if (!drawTools) {
    console.warn("绘图工具未初始化");
    return;
  }

  const drawableTypes = ["rect", "circle", "arrow", "mosaic"];

  if (drawableTypes.includes(type)) {
    // 如果点击的是当前已激活的工具，保持选中，不进行任何操作（不可取消，只能切换其他选项）
    if (currentDrawTool.value === type) {
      return;
    }

    // 先停止之前的工具
    if (currentDrawTool.value) {
      drawTools.stopDrawing && drawTools.stopDrawing();
    }

    // 激活新的绘图工具
    currentDrawTool.value = type;

    // 启用绘图Canvas事件接收
    if (drawCanvas.value) {
      drawCanvas.value.style.pointerEvents = "auto";
    }

    // 绘制马赛克时设置笔宽
    if (type === "mosaic") {
      drawTools.drawMosaicBrushSize && drawTools.drawMosaicBrushSize(20);
    }

    // 调用绘图方法，确保绘图工具被正确激活
    try {
      drawTools.draw(type);
      console.log(`绘图工具已激活: ${type}`);
    } catch (error) {
      console.error(`绘图工具激活失败: ${type}`, error);
      currentDrawTool.value = null;
      // 激活失败时也要禁用事件
      if (drawCanvas.value) {
        drawCanvas.value.style.pointerEvents = "none";
      }
    }
  } else if (type === "redo") {
    // 需求：点击“重做”清空绘图画布的全部涂鸦
    if (drawTools.clearAll) {
      drawTools.clearAll();
    }
    // 清空后重置工具状态并禁用绘图事件穿透
    currentDrawTool.value = null;
    drawTools.resetState && drawTools.resetState();
    drawTools.clearEvents && drawTools.clearEvents();
    if (drawCanvas.value) {
      drawCanvas.value.style.pointerEvents = "none";
      drawCanvas.value.style.zIndex = "5";
    }
    console.log("已清空全部涂鸦 (通过重做按钮)");
  } else if (type === "undo") {
    // 没有可撤回的内容时直接忽略点击
    if (!canUndo.value) return;
    // 先停止可能正在进行的绘制，确保一次点击立即生效
    drawTools.stopDrawing && drawTools.stopDrawing();
    drawTools.undo && drawTools.undo();
    console.log("执行撤销");
  }
};

// 重置绘图工具状态
const resetDrawTools = () => {
  currentDrawTool.value = null;
  if (drawTools) {
    // 停止当前绘图操作
    drawTools.stopDrawing && drawTools.stopDrawing();
    // 重置绘图工具到默认状态
    drawTools.resetState && drawTools.resetState();
    // 清除绘图工具的事件监听
    drawTools.clearEvents && drawTools.clearEvents();
  }

  // 清除绘图canvas的内容
  if (drawCtx.value && drawCanvas.value) {
    drawCtx.value.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height);
    console.log("绘图内容已清除");
  }

  // 重置时禁用绘图canvas事件，让事件穿透到选区
  if (drawCanvas.value) {
    drawCanvas.value.style.pointerEvents = "none";
    drawCanvas.value.style.zIndex = "5";
  }

  console.log("绘图工具已重置");
};

const initCanvas = async () => {
  // 如果正在初始化中，直接忽略本次请求，防止双重加载
  if (isInitializing.value) {
    console.warn("⚠️ initCanvas 正在运行，跳过重复调用");
    return;
  }

  isInitializing.value = true;

  try {
    // 1. 清理
    if (magnifier.value) magnifier.value.style.display = "none";
    if (drawTools) {
      drawTools.dispose?.() || drawTools.clearEvents?.();
      drawTools = null;
    }
    isImageLoaded = false;
    borderRadius.value = 0;
    screenConfig.value = {
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      scaleX: 1,
      scaleY: 1,
      isDrawing: false,
      width: 0,
      height: 0
    };

    // 2. 截图请求
    const currentX = window.screenX + window.innerWidth / 2;
    const currentY = window.screenY + window.innerHeight / 2;

    const screenshotData = await invokeWithErrorHandler(
      TauriCommandEnum.SCREENSHOT,
      { x: currentX, y: currentY },
      { customErrorMessage: "截图失败", errorType: ErrorType.Client }
    );

    if (!screenshotData) return;

    // 3. 加载与初始化
    if (imgCanvas.value && maskCanvas.value && drawCanvas.value) {
      await new Promise<void>((resolve) => {
        screenshotImage = new Image();

        screenshotImage.onload = () => {
          // 二次检查防止组件卸载
          const imgEl = imgCanvas.value;
          const maskEl = maskCanvas.value;
          const drawEl = drawCanvas.value;
          if (!imgEl || !maskEl || !drawEl) {
            resolve();
            return;
          }

          const realWidth = screenshotImage.naturalWidth;
          const realHeight = screenshotImage.naturalHeight;
          const dpr = window.devicePixelRatio || 1;
          const cssStyleWidth = realWidth / dpr;
          const cssStyleHeight = realHeight / dpr;

          console.log(`📊 适配数据: 物理=${realWidth}x${realHeight}, DPR=${dpr}`);

          // 设置尺寸
          [imgEl, maskEl, drawEl].forEach((cvs) => {
            cvs.width = realWidth;
            cvs.height = realHeight;
            cvs.style.width = `${cssStyleWidth}px`;
            cvs.style.height = `${cssStyleHeight}px`;
          });

          // 获取 Context
          imgCtx.value = imgEl.getContext("2d", { willReadFrequently: true });
          maskCtx.value = maskEl.getContext("2d");
          drawCtx.value = drawEl.getContext("2d", { willReadFrequently: true });

          if (imgCtx.value && maskCtx.value && drawCtx.value) {
            // 1. 清空并绘制图片层
            imgCtx.value.clearRect(0, 0, realWidth, realHeight);
            imgCtx.value.drawImage(screenshotImage, 0, 0);

            screenConfig.value.scaleX = dpr;
            screenConfig.value.scaleY = dpr;

            // 2. 清空绘图工具层
            drawCtx.value.clearRect(0, 0, realWidth, realHeight);

            // 3. 强制清空蒙层画布！
            // 这一步解决了"1秒后变黑"的问题。无论之前是否残留，现在必须归零。
            maskCtx.value.clearRect(0, 0, realWidth, realHeight);
            drawTools = useCanvasTool(drawCanvas, drawCtx, imgCtx, screenConfig);
            drawEl.style.pointerEvents = "none";
            drawEl.style.zIndex = "5";

            if (drawTools?.canUndo) {
              watch(drawTools.canUndo, (val) => (canUndo.value = val), { immediate: true });
            }

            // 此时 maskCtx 是干净的，调用 drawMask 只会画这一层
            drawMask();

            isImageLoaded = true;
            console.log("✅ 适配完成，初始化结束");
            resolve();
          }
        };

        screenshotImage.onerror = () => {
          console.error("图片加载失败");
          resolve();
        };

        screenshotImage.src = `data:image/png;base64,${screenshotData}`;
      });
    }

    bindEvents();
  } catch (error) {
    console.error("初始化过程出错:", error);
  } finally {
    setTimeout(() => (isInitializing.value = false), 1000);
  }
};

/**
 * 绑定全局和 Canvas 事件
 * 采用“先移除后添加”的策略，防止重复绑定导致内存泄漏或逻辑错误
 */
const bindEvents = () => {
  // 1. 针对 maskCanvas (遮罩层) 的鼠标事件
  // 用户在未选区时，是在 maskCanvas 上进行拖拽框选的
  if (maskCanvas.value) {
    // 移除旧事件
    maskCanvas.value.removeEventListener("mousedown", handleMaskMouseDown);
    maskCanvas.value.removeEventListener("mousemove", handleMaskMouseMove);
    maskCanvas.value.removeEventListener("mouseup", handleMaskMouseUp);
    maskCanvas.value.removeEventListener("contextmenu", handleRightClick);

    // 添加新事件
    maskCanvas.value.addEventListener("mousedown", handleMaskMouseDown);
    maskCanvas.value.addEventListener("mousemove", handleMaskMouseMove);
    maskCanvas.value.addEventListener("mouseup", handleMaskMouseUp);
    maskCanvas.value.addEventListener("contextmenu", handleRightClick);
  }

  // 2. 全局键盘事件 (例如按 ESC 退出截图)
  document.removeEventListener("keydown", handleKeyDown);
  document.addEventListener("keydown", handleKeyDown);

  // 3. 全局右键事件 (防止弹出浏览器默认菜单，通常用于退出或取消)
  document.removeEventListener("contextmenu", handleRightClick);
  document.addEventListener("contextmenu", handleRightClick);

  // 4. 全局点击事件 (用于点击空白处取消当前激活的绘图工具等)
  document.removeEventListener("mousedown", handleGlobalMouseDown);
  document.addEventListener("mousedown", handleGlobalMouseDown);

  console.log("✅ 事件监听已重新绑定");
};

const handleMagnifierMouseMove = (event: MouseEvent) => {
  if (!magnifier.value || !imgCanvas.value || !imgCtx.value) return;

  // 在拖动选区时隐藏放大镜，仅在调整大小和绘制时显示
  if (isDragging.value) {
    magnifier.value.style.display = "none";
    return;
  }

  // 如果已经选择了区域，但当前不在拖动或调整大小，则隐藏放大镜
  if (showButtonGroup.value && !isDragging.value && !isResizing.value) {
    magnifier.value.style.display = "none";
    return;
  }

  // 确保图像已加载
  if (!isImageLoaded) {
    magnifier.value.style.display = "none";
    return;
  }

  // 初始化放大镜画布
  if (magnifierCanvas.value && magnifierCtx.value === null) {
    magnifierCanvas.value.width = magnifierWidth;
    magnifierCanvas.value.height = magnifierHeight;
    magnifierCtx.value = magnifierCanvas.value.getContext("2d");
  }

  if (!magnifierCtx.value) return;

  magnifier.value.style.display = "block";

  // 统一使用 clientX/clientY + canvas 的 boundingClientRect 计算相对画布的坐标
  const clientX = (event as MouseEvent).clientX;
  const clientY = (event as MouseEvent).clientY;
  const rect = imgCanvas.value.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;

  // 定位放大镜（使用视口坐标放置，避免偏移）
  let magnifierTop = clientY + 20;
  let magnifierLeft = clientX + 20;

  if (magnifierTop + magnifierHeight > window.innerHeight) {
    magnifierTop = clientY - magnifierHeight - 20;
  }
  if (magnifierLeft + magnifierWidth > window.innerWidth) {
    magnifierLeft = clientX - magnifierWidth - 20;
  }

  magnifier.value.style.top = `${magnifierTop}px`;
  magnifier.value.style.left = `${magnifierLeft}px`;

  // 计算源图像中的采样区域（相对画布坐标再乘缩放因子）
  const sourceX = mouseX * screenConfig.value.scaleX - magnifierWidth / zoomFactor / 2;
  const sourceY = mouseY * screenConfig.value.scaleY - magnifierHeight / zoomFactor / 2;
  const sourceWidth = magnifierWidth / zoomFactor;
  const sourceHeight = magnifierHeight / zoomFactor;

  // 清除放大镜画布
  magnifierCtx.value.clearRect(0, 0, magnifierWidth, magnifierHeight);

  // 绘制放大的图像
  magnifierCtx.value.drawImage(
    imgCanvas.value,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    magnifierWidth,
    magnifierHeight
  );

  // 在放大镜中心绘制十字线
  magnifierCtx.value.strokeStyle = "#13987f";
  magnifierCtx.value.lineWidth = 1;
  magnifierCtx.value.beginPath();
  magnifierCtx.value.moveTo(magnifierWidth / 2, 0);
  magnifierCtx.value.lineTo(magnifierWidth / 2, magnifierHeight);
  magnifierCtx.value.moveTo(0, magnifierHeight / 2);
  magnifierCtx.value.lineTo(magnifierWidth, magnifierHeight / 2);
  magnifierCtx.value.stroke();
};

const handleMaskMouseDown = (event: MouseEvent) => {
  // 禁止未加载或已存在选区时操作
  if (!isImageLoaded || showButtonGroup.value) return;

  // 立即取消可能存在的上一帧渲染请求，防止"双重蒙层"重影
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  const offsetEvent = event as any;

  screenConfig.value.startX = Math.round(offsetEvent.offsetX * screenConfig.value.scaleX);
  screenConfig.value.startY = Math.round(offsetEvent.offsetY * screenConfig.value.scaleY);

  // 重置终点为起点
  screenConfig.value.endX = screenConfig.value.startX;
  screenConfig.value.endY = screenConfig.value.startY;

  screenConfig.value.isDrawing = true;

  // 立即初始化干净的蒙层
  if (maskCtx.value && maskCanvas.value) {
    maskCtx.value.clearRect(0, 0, maskCanvas.value.width, maskCanvas.value.height);
    maskCtx.value.fillStyle = "rgba(0, 0, 0, 0.4)";
    maskCtx.value.fillRect(0, 0, maskCanvas.value.width, maskCanvas.value.height);
  }
};

/**
 * 核心渲染帧函数
 * @param drawBorder 是否绘制边框 (拖动选区时为 false，因为 DOM 元素已有边框)
 */
const renderMaskFrame = (currentX: number, currentY: number, drawBorder: boolean = true) => {
  if (!maskCtx.value || !maskCanvas.value) return;

  const width = maskCanvas.value.width;
  const height = maskCanvas.value.height;
  const { startX, startY } = screenConfig.value;

  // 1. 彻底清空画布 (防止颜色叠加变深)
  maskCtx.value.clearRect(0, 0, width, height);

  // 2. 绘制全屏半透明遮罩
  maskCtx.value.fillStyle = "rgba(0, 0, 0, 0.4)";
  maskCtx.value.fillRect(0, 0, width, height);

  // 3. 计算标准化的矩形
  const drawX = Math.min(startX, currentX);
  const drawY = Math.min(startY, currentY);
  const drawW = Math.abs(currentX - startX);
  const drawH = Math.abs(currentY - startY);

  // 4. 挖空选区
  if (drawW > 0 && drawH > 0) {
    maskCtx.value.clearRect(drawX, drawY, drawW, drawH);
  }

  // 5. 绘制选区边框 (仅在创建选区时绘制，拖动时由 DOM 负责显示)
  if (drawBorder) {
    maskCtx.value.strokeStyle = "#13987f";
    maskCtx.value.lineWidth = 2;
    maskCtx.value.strokeRect(drawX, drawY, drawW, drawH);
    // 绘制尺寸文字
    drawSizeText(maskCtx.value, drawX, drawY, drawW, drawH);
  }
};

const handleMaskMouseMove = (event: MouseEvent) => {
  handleMagnifierMouseMove(event);

  if (!screenConfig.value.isDrawing || !maskCtx.value || !maskCanvas.value) return;

  const offsetEvent = event as any;
  const currentX = Math.round(offsetEvent.offsetX * screenConfig.value.scaleX);
  const currentY = Math.round(offsetEvent.offsetY * screenConfig.value.scaleY);

  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    renderMaskFrame(currentX, currentY, true);
    rafId = null;
  });
};

const handleMaskMouseUp = (event: MouseEvent) => {
  if (!screenConfig.value.isDrawing) return;

  // 停止拖动时，取消所有挂起的渲染帧
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  screenConfig.value.isDrawing = false;

  const offsetEvent = event as any;
  screenConfig.value.endX = offsetEvent.offsetX * screenConfig.value.scaleX;
  screenConfig.value.endY = offsetEvent.offsetY * screenConfig.value.scaleY;

  screenConfig.value.width = Math.abs(screenConfig.value.endX - screenConfig.value.startX);
  screenConfig.value.height = Math.abs(screenConfig.value.endY - screenConfig.value.startY);

  if (screenConfig.value.width > 5 && screenConfig.value.height > 5) {
    if (magnifier.value) magnifier.value.style.display = "none";
    redrawSelection();
    showButtonGroup.value = true;
    nextTick(() => {
      updateButtonGroupPosition();
    });
  }
};

// 计算矩形区域工具栏位置
const updateButtonGroupPosition = () => {
  // 增加 imgCanvas 检查
  if (!buttonGroup.value || !imgCanvas.value) return;

  // 按钮组不可见、正在拖动或正在调整大小时，不进行定位
  if (!showButtonGroup.value || isDragging.value || isResizing.value) {
    updateSelectionAreaPosition();
    return;
  }

  const { scaleX, scaleY, startX, startY, endX, endY } = screenConfig.value;

  // 获取选区边界 (CSS像素)
  const maxX = Math.max(startX, endX) / scaleX;
  const maxY = Math.max(startY, endY) / scaleY; // 选区底部 Y 坐标

  // 获取容器尺寸 (使用 imgCanvas 的尺寸，最准确)
  const containerWidth = imgCanvas.value.offsetWidth;
  const containerHeight = imgCanvas.value.offsetHeight;

  const el = buttonGroup.value;
  // 重置样式以便正确测量
  el.style.width = "max-content";
  el.style.whiteSpace = "nowrap";

  const rect = el.getBoundingClientRect();
  const toolHeight = rect.height;
  const toolWidth = rect.width;

  // 1. 计算水平位置 (默认右对齐)
  let left = maxX - toolWidth;
  // 边界检查：防止溢出屏幕左/右边界 (保持 10px 间距)
  if (left < 10) left = 10;
  if (left + toolWidth > containerWidth - 10) left = containerWidth - toolWidth - 10;

  // 2. 计算垂直位置
  // 策略：默认放在选区下方 (10px 间距)
  let top = maxY + 10;

  // 检查是否超出容器底部
  // 如果 (当前Top + 工具栏高度) 超过了 容器高度
  if (top + toolHeight > containerHeight) {
    // 翻转策略：放在选区【内部】的底部 (10px 间距)
    // 公式：选区底边Y - 工具栏高度 - 间距
    top = maxY - toolHeight - 10;
  }

  // 安全检查：如果翻转后顶出了屏幕上边缘（极少数情况），强制吸顶
  if (top < 0) top = 10;

  // 应用位置
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;

  // 同步更新选区拖动框位置
  updateSelectionAreaPosition();
};

// 更新选区拖动区域位置
const updateSelectionAreaPosition = () => {
  if (!selectionArea.value) return;

  const { scaleX, scaleY, startX, startY, endX, endY } = screenConfig.value;

  // 矩形的边界
  const minX = Math.min(startX, endX) / scaleX;
  const minY = Math.min(startY, endY) / scaleY;
  const maxX = Math.max(startX, endX) / scaleX;
  const maxY = Math.max(startY, endY) / scaleY;

  selectionAreaStyle.value = {
    left: `${minX}px`,
    top: `${minY}px`,
    width: `${maxX - minX}px`,
    height: `${maxY - minY}px`,
    borderRadius: `${borderRadius.value}px`,
    border: "2px solid #13987f"
  };

  // 更新圆角控制器位置，确保不超出屏幕边界
  updateBorderRadiusControllerPosition(minX, minY);
};

// 更新圆角控制器位置
const updateBorderRadiusControllerPosition = (selectionLeft: number, selectionTop: number) => {
  if (!imgCanvas.value) return;

  const controllerHeight = 35; // 控制器高度
  const controllerWidth = 120; // 控制器宽度
  const containerWidth = imgCanvas.value.offsetWidth; // 使用 Canvas 宽度

  let left = selectionLeft;
  let top = selectionTop - controllerHeight;

  // 确保控制器不超出屏幕左边界
  if (left < 0) {
    left = 0;
  }

  // 确保控制器不超出屏幕右边界 (使用 containerWidth)
  if (left + controllerWidth > containerWidth) {
    left = containerWidth - controllerWidth - 10;
  }

  // 确保控制器不超出屏幕上边界
  if (top < 0) {
    top = selectionTop + 4; // 如果超出上边界，显示在选区内部
  }

  borderRadiusControllerStyle.value = {
    left: `${left - selectionLeft}px`, // 相对于选区的位置
    top: `${top - selectionTop}px`
  };
};

// 选区拖动开始
const handleSelectionDragStart = (event: MouseEvent) => {
  // 如果有绘图工具处于激活状态，禁止拖动
  if (currentDrawTool.value) {
    event.preventDefault();
    event.stopPropagation();
    return; // 直接返回，不执行拖动
  }

  // 确保拖动功能不受绘图工具状态影响
  event.preventDefault();
  event.stopPropagation();

  isDragging.value = true;
  dragOffset.value = {
    x: event.clientX - parseFloat(selectionAreaStyle.value.left),
    y: event.clientY - parseFloat(selectionAreaStyle.value.top)
  };

  // 添加全局鼠标事件监听
  document.addEventListener("mousemove", handleSelectionDragMove);
  document.addEventListener("mouseup", handleSelectionDragEnd);

  console.log("开始拖动，隐藏按钮组");
};

// 选区拖动移动
const handleSelectionDragMove = (event: MouseEvent) => {
  // 必须检查 imgCanvas 是否存在
  if (!isDragging.value || !imgCanvas.value) return;

  event.preventDefault();

  const newLeft = event.clientX - dragOffset.value.x;
  const newTop = event.clientY - dragOffset.value.y;

  const selectionWidth = parseFloat(selectionAreaStyle.value.width);
  const selectionHeight = parseFloat(selectionAreaStyle.value.height);

  // [关键修复] 使用 clientWidth (内容宽度) 而不是 window.innerWidth
  // offsetWidth 包含边框，clientWidth 不包含，通常 clientWidth 更准确用于内部定位
  const containerWidth = imgCanvas.value.clientWidth;
  const containerHeight = imgCanvas.value.clientHeight;

  const maxLeft = containerWidth - selectionWidth;
  const maxTop = containerHeight - selectionHeight;

  // 严格限制坐标
  const constrainedLeft = Math.max(0, Math.min(newLeft, maxLeft));
  const constrainedTop = Math.max(0, Math.min(newTop, maxTop));

  selectionAreaStyle.value.left = `${constrainedLeft}px`;
  selectionAreaStyle.value.top = `${constrainedTop}px`;

  // 重新绑定样式，防止丢失
  selectionAreaStyle.value.border = "2px solid #13987f";
  selectionAreaStyle.value.borderRadius = `${borderRadius.value}px`;

  // 更新 screenConfig (同步物理坐标)
  const { scaleX, scaleY } = screenConfig.value;
  screenConfig.value.startX = constrainedLeft * scaleX;
  screenConfig.value.startY = constrainedTop * scaleY;
  screenConfig.value.endX = (constrainedLeft + selectionWidth) * scaleX;
  screenConfig.value.endY = (constrainedTop + selectionHeight) * scaleY;

  // [关键] 调用 redrawSelection (只挖空，不画线)，因为 DOM 元素此时正在跟着鼠标动
  redrawSelection();

  if (!isDragging.value) {
    updateButtonGroupPosition();
  }
};

// 选区拖动结束
const handleSelectionDragEnd = () => {
  isDragging.value = false;

  // 移除全局鼠标事件监听
  document.removeEventListener("mousemove", handleSelectionDragMove);
  document.removeEventListener("mouseup", handleSelectionDragEnd);

  // 结束拖动后隐藏放大镜
  if (magnifier.value) {
    magnifier.value.style.display = "none";
  }

  nextTick(() => {
    updateButtonGroupPosition();
  });

  console.log("拖动结束，显示按钮组");
};

// resize开始
const handleResizeStart = (event: MouseEvent, direction: string) => {
  // 如果有绘图工具处于激活状态，禁止resize
  if (currentDrawTool.value) {
    event.preventDefault();
    event.stopPropagation();
    return; // 直接返回，不执行resize
  }

  event.preventDefault();
  event.stopPropagation();

  isResizing.value = true;
  resizeDirection.value = direction;

  resizeStartPosition.value = {
    x: event.clientX,
    y: event.clientY,
    width: parseFloat(selectionAreaStyle.value.width),
    height: parseFloat(selectionAreaStyle.value.height),
    left: parseFloat(selectionAreaStyle.value.left),
    top: parseFloat(selectionAreaStyle.value.top)
  };

  // 添加全局鼠标事件监听
  document.addEventListener("mousemove", handleResizeMove);
  document.addEventListener("mouseup", handleResizeEnd);
};

// resize移动
const handleResizeMove = (event: MouseEvent) => {
  // 必须检查 imgCanvas 是否存在
  if (!isResizing.value || !imgCanvas.value) return;

  event.preventDefault();
  handleMagnifierMouseMove(event);

  const deltaX = event.clientX - resizeStartPosition.value.x;
  const deltaY = event.clientY - resizeStartPosition.value.y;

  let newLeft = resizeStartPosition.value.left;
  let newTop = resizeStartPosition.value.top;
  let newWidth = resizeStartPosition.value.width;
  let newHeight = resizeStartPosition.value.height;

  // 必须包含这个 switch 才能改变大小
  switch (resizeDirection.value) {
    case "nw": // 左上
      newLeft += deltaX;
      newTop += deltaY;
      newWidth -= deltaX;
      newHeight -= deltaY;
      break;
    case "ne": // 右上
      newTop += deltaY;
      newWidth += deltaX;
      newHeight -= deltaY;
      break;
    case "sw": // 左下
      newLeft += deltaX;
      newWidth -= deltaX;
      newHeight += deltaY;
      break;
    case "se": // 右下
      newWidth += deltaX;
      newHeight += deltaY;
      break;
    case "n": // 上
      newTop += deltaY;
      newHeight -= deltaY;
      break;
    case "e": // 右
      newWidth += deltaX;
      break;
    case "s": // 下
      newHeight += deltaY;
      break;
    case "w": // 左
      newLeft += deltaX;
      newWidth -= deltaX;
      break;
  }

  // [边界限制] 使用容器尺寸
  const containerWidth = imgCanvas.value.offsetWidth;
  const containerHeight = imgCanvas.value.offsetHeight;

  // 1. 限制左上角
  newLeft = Math.max(0, newLeft);
  newTop = Math.max(0, newTop);

  // 2. 限制右下角不溢出
  if (newLeft + newWidth > containerWidth) {
    newWidth = containerWidth - newLeft;
  }
  if (newTop + newHeight > containerHeight) {
    newHeight = containerHeight - newTop;
  }

  // 3. 最小尺寸限制
  const minSize = 20;
  newWidth = Math.max(minSize, newWidth);
  newHeight = Math.max(minSize, newHeight);

  // 应用新样式
  selectionAreaStyle.value = {
    left: `${newLeft}px`,
    top: `${newTop}px`,
    width: `${newWidth}px`,
    height: `${newHeight}px`,
    borderRadius: `${borderRadius.value}px`,
    border: "2px solid #13987f"
  };

  // 同步更新 screenConfig
  const { scaleX, scaleY } = screenConfig.value;
  screenConfig.value.startX = newLeft * scaleX;
  screenConfig.value.startY = newTop * scaleY;
  screenConfig.value.endX = (newLeft + newWidth) * scaleX;
  screenConfig.value.endY = (newTop + newHeight) * scaleY;

  redrawSelection();

  if (showButtonGroup.value) {
    updateButtonGroupPosition();
  }
};

// resize结束
const handleResizeEnd = () => {
  isResizing.value = false;
  resizeDirection.value = "";

  // 移除全局鼠标事件监听
  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", handleResizeEnd);

  // 结束调整后隐藏放大镜
  if (magnifier.value) {
    magnifier.value.style.display = "none";
  }

  // 调整结束后再定位按钮组
  nextTick(() => {
    if (showButtonGroup.value) {
      updateButtonGroupPosition();
    }
  });
};

// 圆角变化处理
const handleBorderRadiusChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  borderRadius.value = parseInt(target.value, 10);

  // 更新选区样式，包括边框显示
  updateSelectionAreaPosition();
};

/**
 * 绘制矩形尺寸文本
 */
const drawSizeText = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  if (context) {
    // 对宽度和高度进行取整
    const roundedWidth = Math.round(Math.abs(width));
    const roundedHeight = Math.round(Math.abs(height));
    const sizeText = `${roundedWidth} x ${roundedHeight}`;

    // 确保文本始终显示在矩形的左上角
    const textX = width >= 0 ? x : x + width;
    const textY = height >= 0 ? y : y + height;

    // 设置字体和样式
    context.font = "14px Arial";
    context.fillStyle = "white";
    // 设置图像插值质量
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillText(sizeText, textX + 5, textY - 10); // 在矩形左上角并稍微偏移的位置绘制文本
  }
};

/**
 * 绘制蒙版
 */
const drawMask = () => {
  console.log("drawMask");
  if (maskCtx.value && maskCanvas.value) {
    const w = maskCanvas.value.width;
    const h = maskCanvas.value.height;
    maskCtx.value.clearRect(0, 0, w, h);

    maskCtx.value.fillStyle = "rgba(0, 0, 0, 0.4)";
    maskCtx.value.fillRect(0, 0, w, h);
  }
};

// 重绘蒙版为透明选区 + 无描边，避免与 DOM 选区边框重复
const redrawSelection = () => {
  if (!maskCtx.value || !maskCanvas.value) return;

  const { startX, startY, endX, endY } = screenConfig.value;

  // 复用 renderMaskFrame，传入 false 表示不画边框
  // 因为此时 DOM 元素 (.selection-area) 已经显示了绿色边框
  // 我们只需要 Canvas 负责把背景变暗并挖空中间即可
  // 这里的坐标需要转换，因为 renderMaskFrame 接收的是 currentX/Y
  // 我们直接用 endX, endY 即可（render 内部会自动 min/max 处理）

  // 但为了逻辑复用，我们这里手动写一下更清晰：
  const width = maskCanvas.value.width;
  const height = maskCanvas.value.height;
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const w = Math.abs(endX - startX);
  const h = Math.abs(endY - startY);

  // 1. 清空
  maskCtx.value.clearRect(0, 0, width, height);
  // 2. 铺满遮罩
  maskCtx.value.fillStyle = "rgba(0, 0, 0, 0.4)";
  maskCtx.value.fillRect(0, 0, width, height);
  // 3. 挖空
  if (w > 0 && h > 0) {
    maskCtx.value.clearRect(x, y, w, h);
  }
};

/**
 * 初始化放大镜
 */
const initMagnifier = () => {
  if (magnifierCanvas.value) {
    magnifierCanvas.value.width = magnifierWidth;
    magnifierCanvas.value.height = magnifierHeight;
    magnifierCtx.value = magnifierCanvas.value.getContext("2d", { willReadFrequently: true });
  }
};

const confirmSelection = async () => {
  // 立即隐藏放大镜，防止被截取到
  if (magnifier.value) {
    magnifier.value.style.display = "none";
  }

  // 检查图像是否已加载
  if (!isImageLoaded) {
    console.error("图像尚未加载完成，请稍后再试");
    await resetScreenshot();
    return;
  }

  const { startX, startY, endX, endY } = screenConfig.value;
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  if (width < 1 || height < 1) {
    console.error("❌选区尺寸无效:", { width, height });
    await resetScreenshot();
    return;
  }

  // 计算选区的左上角位置
  const rectX = Math.min(startX, endX);
  const rectY = Math.min(startY, endY);

  // 创建一个临时 canvas 来合成最终图像
  const mergedCanvas = document.createElement("canvas");
  const mergedCtx = mergedCanvas.getContext("2d");

  // 设置合成canvas的尺寸与imgCanvas相同
  mergedCanvas.width = imgCanvas.value!.width;
  mergedCanvas.height = imgCanvas.value!.height;

  if (mergedCtx) {
    try {
      // 先绘制原始截图（从imgCanvas）
      mergedCtx.drawImage(imgCanvas.value!, 0, 0);

      // 然后绘制用户的绘图内容（从drawCanvas），使用source-over模式确保正确合成
      mergedCtx.globalCompositeOperation = "source-over";
      mergedCtx.drawImage(drawCanvas.value!, 0, 0);

      // 创建最终的裁剪canvas
      const offscreenCanvas = document.createElement("canvas");
      const offscreenCtx = offscreenCanvas.getContext("2d");

      // 设置临时 canvas 的尺寸
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;

      if (offscreenCtx) {
        // 从合成后的canvas裁剪选区
        offscreenCtx.drawImage(
          mergedCanvas,
          rectX,
          rectY,
          width,
          height, // 裁剪区域
          0,
          0,
          width,
          height // 绘制到临时 canvas 的区域
        );

        // 如果设置了圆角，则将裁剪结果应用圆角蒙版，导出带透明圆角的 PNG
        if (borderRadius.value > 0) {
          const scale = screenConfig.value.scaleX || 1;
          const r = Math.min(borderRadius.value * scale, width / 2, height / 2);
          if (r > 0) {
            offscreenCtx.save();
            // 仅保留圆角矩形内的内容
            offscreenCtx.globalCompositeOperation = "destination-in";

            offscreenCtx.beginPath();
            // 在 (0,0,width,height) 上构建圆角矩形路径
            offscreenCtx.moveTo(r, 0);
            offscreenCtx.lineTo(width - r, 0);
            offscreenCtx.quadraticCurveTo(width, 0, width, r);
            offscreenCtx.lineTo(width, height - r);
            offscreenCtx.quadraticCurveTo(width, height, width - r, height);
            offscreenCtx.lineTo(r, height);
            offscreenCtx.quadraticCurveTo(0, height, 0, height - r);
            offscreenCtx.lineTo(0, r);
            offscreenCtx.quadraticCurveTo(0, 0, r, 0);
            offscreenCtx.closePath();
            offscreenCtx.fill();

            offscreenCtx.restore();
          }
        }

        // 测试：检查canvas数据是否有效
        try {
          offscreenCtx.getImageData(0, 0, Math.min(10, width), Math.min(10, height));
        } catch (error) {
          console.error("获取ImageData失败,可能是安全限制:", error);
        }

        offscreenCanvas.toBlob(async (blob) => {
          if (blob && blob.size > 0) {
            try {
              // 将 Blob 转换为 ArrayBuffer 以便通过 Tauri 事件传递
              const arrayBuffer = await blob.arrayBuffer();
              const buffer = new Uint8Array(arrayBuffer);

              try {
                await emitTo("home", "screenshot", {
                  type: "image",
                  buffer: Array.from(buffer),
                  mimeType: "image/png"
                });
              } catch (e) {
                console.warn("发送截图到主窗口失败:", e);
              }

              try {
                await writeImage(buffer);
                window.$message?.success(t("components.screenshot.saveSuccess"));
              } catch (clipboardError) {
                console.error("复制到剪贴板失败:", clipboardError);
                window.$message?.error(t("components.screenshot.saveFailed"));
              }

              await resetScreenshot();
            } catch (error) {
              window.$message?.error(t("components.screenshot.saveFailed"));
              await resetScreenshot();
            }
          } else {
            window.$message?.error(t("components.screenshot.saveFailed"));
            await resetScreenshot();
          }
        }, "image/png");
      }
    } catch (error) {
      console.error("Canvas操作失败:", error);
      window.$message?.error(t("components.screenshot.saveFailed"));
      await resetScreenshot();
    }
  }
};

const resetScreenshot = async () => {
  try {
    // 1. 停止动画帧
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    // 2. 清理定时器
    if (isMac() && mouseMoveThrottleId) {
      clearTimeout(mouseMoveThrottleId);
      mouseMoveThrottleId = null;
    }

    // 3. 重置工具
    resetDrawTools();

    // 4. 重置状态
    showButtonGroup.value = false;
    isImageLoaded = false;
    borderRadius.value = 0;
    isDragging.value = false;
    isResizing.value = false;

    screenConfig.value = {
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      scaleX: 1,
      scaleY: 1,
      isDrawing: false,
      width: 0,
      height: 0
    };

    // 5. 强制销毁 Canvas 缓冲区
    // 直接把 width 设为 0，这比 clearRect 更彻底，
    // 能确保下次 initCanvas 时是从一张全新的白纸开始，绝对没有缓存残留。
    const canvases = [imgCanvas.value, maskCanvas.value, drawCanvas.value];
    canvases.forEach((cvs) => {
      if (cvs) {
        cvs.width = 0;
        cvs.height = 0;
      }
    });

    // 6. 隐藏放大镜
    if (magnifier.value) {
      magnifier.value.style.display = "none";
    }

    // 7. 隐藏窗口
    await restoreWindowState();
  } catch (error) {
    console.error("Reset Error:", error);
    await restoreWindowState();
  }
};

// 全局鼠标点击处理，用于取消绘图工具
const handleGlobalMouseDown = (event: MouseEvent) => {
  // 只有在绘图工具激活且按钮组显示时才考虑处理
  if (!currentDrawTool.value || !showButtonGroup.value) return;

  // 如果点击发生在按钮组内，直接返回，避免误操作
  if (buttonGroup.value && buttonGroup.value.contains(event.target as Node)) {
    return;
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    resetScreenshot();
  }
};

const handleRightClick = (event: MouseEvent) => {
  // 阻止默认右键菜单
  event.preventDefault();
  resetScreenshot();
};

const cancelSelection = () => {
  resetScreenshot();
};

// 截图处理函数
const handleScreenshot = () => {
  // 每次开始截图时重置所有状态
  resetDrawTools();
  appWindow.show();
  initCanvas();
  initMagnifier();
};

onMounted(async () => {
  // 获取并存储 unlisten 函数
  // 这样当组件重新加载时，我们可以清除旧的监听器，防止累积
  unlistenCapture = await appWindow.listen("capture", () => {
    // 如果正在初始化，则忽略新的请求
    if (isInitializing.value) return;

    console.log("📥 收到 capture 事件");
    resetDrawTools();
    initCanvas();
    initMagnifier();
  });

  unlistenCaptureReset = await appWindow.listen("capture-reset", () => {
    console.log("📥 收到 capture-reset 事件");
    resetDrawTools();
    resetScreenshot();
  });

  window.addEventListener("trigger-screenshot", handleScreenshot);
});

onUnmounted(() => {
  // 清理性能优化相关的定时器
  if (isMac() && mouseMoveThrottleId) {
    clearTimeout(mouseMoveThrottleId);
    mouseMoveThrottleId = null;
  }

  // 手动销毁工具实例
  if (drawTools?.dispose) {
    drawTools.dispose();
  }

  // 执行 Tauri 事件的取消监听函数
  if (unlistenCapture) {
    unlistenCapture();
    unlistenCapture = null;
  }
  if (unlistenCaptureReset) {
    unlistenCaptureReset();
    unlistenCaptureReset = null;
  }

  // 清理 DOM 事件
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("contextmenu", handleRightClick);
  document.removeEventListener("mousedown", handleGlobalMouseDown);

  if (maskCanvas.value) {
    maskCanvas.value.removeEventListener("contextmenu", handleRightClick);
  }

  window.removeEventListener("trigger-screenshot", handleScreenshot);
});
</script>

<style scoped lang="scss">
.canvasbox {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: transparent;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
}

.magnifier {
  position: absolute;
  pointer-events: none;
  width: 120px;
  height: 120px;
  border: 1px solid #ccc;
  border-radius: 12px;
  overflow: hidden;
  display: none;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.img-canvas {
  z-index: 0;
}

.mask-canvas {
  z-index: 1;
}

.draw-canvas {
  z-index: 5;
  pointer-events: none;
}

.magnifier canvas {
  display: block;
  z-index: 2;
}

.selection-area {
  position: absolute;
  z-index: 2;
  background: transparent;
  box-sizing: border-box;
}

.drag-area {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  z-index: 10;
  background: transparent;
}

.drag-area.can-drag {
  cursor: move;
}

.drag-area.cannot-drag {
  cursor: not-allowed;
}

.resize-handle {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  z-index: 4;
  transition: all 0.2s;
}

.resize-handle.disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.5;
}

/* 四个角的控制点 */
.resize-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

/* 四条边中间的控制点 */
.resize-n {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-e {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-s {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-w {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: w-resize;
}

.button-group {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 999;
  white-space: nowrap;
  overflow: visible;

  span {
    cursor: pointer;
    min-width: 30px;
    height: 30px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    flex: 0 0 auto;

    svg {
      width: 22px;
      height: 22px;
    }

    &:hover svg {
      color: #13987f;
    }

    &.active svg {
      color: #13987f;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
}

.border-radius-controller {
  position: absolute;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 999;
  white-space: nowrap;

  label {
    margin: 0;
  }

  input[type="range"] {
    width: 60px;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
    outline: none;
    margin: 0;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }
  }

  span {
    font-size: 11px;
    min-width: 25px;
  }
}
</style>
