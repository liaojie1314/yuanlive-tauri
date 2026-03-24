<template>
  <main
    class="flex size-full flex-col overflow-hidden bg-[--right-bg-color] text-[--text-color] transition-colors duration-300 select-none">
    <action-bar />

    <div
      data-tauri-drag-region
      class="h-50px px-20px z-50 flex flex-none items-center justify-between border-b border-[--line-color] bg-[--tray-bg-color] backdrop-blur-md">
      <span class="text-(14px [--text-color]) ml-4 font-bold">直播工作台</span>
      <n-tag size="small" round :type="statusType" :bordered="false">
        {{ statusText }}
        <template #icon v-if="isStreaming">
          <div class="size-6px animate-pulse rounded-full bg-current"></div>
        </template>
      </n-tag>
    </div>

    <div class="p-20px gap-20px flex h-full flex-1 overflow-hidden">
      <div class="flex h-full min-w-0 flex-1 flex-col gap-4">
        <div
          class="rounded-12px group relative min-h-0 flex-1 overflow-hidden border border-[--line-color] bg-[--right-bg-color] shadow-sm">
          <canvas
            ref="canvasEl"
            class="size-full object-contain"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"></canvas>

          <div
            v-if="!isStreaming && !isPreviewing"
            class="absolute inset-0 z-10 flex-col-x-center justify-center bg-[--bg-modal] backdrop-blur-sm">
            <span class="text-(24px [--text-color]) font-bold tracking-widest opacity-80">WAITING FOR SIGNAL</span>
            <span class="text-(12px [--left-text-color]) mt-2">请配置参数并开始推流</span>
          </div>

          <transition name="fade">
            <div
              v-if="showStatusToast"
              class="text-(10px [--text-color]) pointer-events-none absolute right-4 bottom-4 rounded-full border border-[--line-color] bg-[--bg-popover] px-3 py-1 shadow-md backdrop-blur-md select-none">
              {{
                currentMode === "FFmpeg"
                  ? "🚀 FFmpeg Accelerated"
                  : currentMode === "WebRTC"
                    ? "⚡ WebRTC Native"
                    : "IDLE"
              }}
            </div>
          </transition>
        </div>

        <div
          class="rounded-12px p-16px flex h-auto flex-none items-center gap-8 border border-[--line-color] bg-[--bg-setting-item] shadow-sm">
          <div class="flex-1">
            <div class="text-(12px [--left-text-color]) mb-1 flex justify-between">
              <span>系统音量 (屏幕)</span>
              <span>{{ (sysVolume * 100).toFixed(0) }}%</span>
            </div>
            <n-slider
              v-model:value="sysVolume"
              :step="0.1"
              :max="1.5"
              :format-tooltip="(v: number) => `${(v * 100).toFixed(0)}%`" />
          </div>
          <div class="flex-1">
            <div class="text-(12px [--left-text-color]) mb-1 flex justify-between">
              <span>麦克风增强</span>
              <span>{{ (micVolume * 100).toFixed(0) }}%</span>
            </div>
            <n-slider
              v-model:value="micVolume"
              :step="0.1"
              :max="2.0"
              :format-tooltip="(v: number) => `${(v * 100).toFixed(0)}%`" />
          </div>
        </div>
      </div>

      <div
        class="w-320px rounded-12px flex h-full flex-col overflow-hidden border border-[--line-color] bg-[--bg-setting-item] shadow-sm backdrop-blur-md">
        <div class="p-20px pb-10px flex-none border-b border-[--line-color]">
          <div class="text-(16px [--text-color]) flex-y-center gap-2 font-bold">
            <span class="i-carbon-settings text-[--action-bar-icon-color]"></span>
            推流配置
          </div>
        </div>

        <div class="min-h-0 flex-1 bg-[--right-bg-color]">
          <n-scrollbar content-class="p-20px pt-0">
            <n-flex vertical class="mt-4" :size="16">
              <div class="p-12px rounded-8px bg-[--left-item-bg-color]">
                <span class="text-(12px [--left-text-color]) mb-1 block">推流房间号</span>
                <n-input
                  placeholder="room-001"
                  class="!bg-transparent"
                  v-model:value="roomId"
                  :disabled="isStreaming || isPreviewing"
                  :bordered="false" />
              </div>

              <n-divider class="!my-0 bg-[--line-color]" />

              <n-flex vertical :size="12">
                <div class="flex-between-center">
                  <span class="text-(14px [--text-color]) font-bold">画面合成 & 美颜</span>
                  <n-switch size="small" v-model:value="beautyConfig.enable">
                    <template #checked>ON</template>
                    <template #unchecked>OFF</template>
                  </n-switch>
                </div>

                <n-collapse-transition :show="beautyConfig.enable">
                  <div class="rounded-8px flex flex-col gap-4 border border-[--line-color] bg-[--bg-left-menu] p-3">
                    <div class="flex-y-center gap-2">
                      <span class="text-(12px [--left-text-color]) w-8 text-right">磨皮</span>
                      <n-slider class="flex-1" v-model:value="beautyConfig.smooth" :step="0.1" :min="0" :max="2" />
                    </div>
                    <div class="flex-y-center gap-2">
                      <span class="text-(12px [--left-text-color]) w-8 text-right">美白</span>
                      <n-slider class="flex-1" v-model:value="beautyConfig.whiten" :step="0.05" :min="1.0" :max="1.5" />
                    </div>
                    <div class="flex-y-center gap-2">
                      <span class="text-(12px [--left-text-color]) w-8 text-right">红润</span>
                      <n-slider class="flex-1" v-model:value="beautyConfig.rosy" :step="0.05" :min="1.0" :max="2.0" />
                    </div>
                  </div>
                </n-collapse-transition>

                <div
                  class="p-10px rounded-8px flex-between-center border border-[--line-color] bg-[--left-item-bg-color]">
                  <span class="text-(13px [--user-text-color])">画中画摄像头</span>
                  <n-switch size="small" v-model:value="enableCamera" :disabled="isStreaming" />
                </div>
              </n-flex>

              <n-divider class="!my-2 bg-[--line-color]" />

              <div class="mb-2 flex-between-center">
                <span class="text-(14px [--text-color]) font-bold">✨ 趣味滤镜</span>
              </div>

              <n-select size="small" class="mb-3" v-model:value="effectConfig.mode" :options="effectOptions" />

              <div v-if="effectConfig.mode === 'bulge'" class="rounded-8px mb-2 bg-[--bg-left-menu] p-2">
                <div class="flex-y-center gap-2">
                  <span class="text-(10px [--left-text-color])">变形程度</span>
                  <n-slider class="flex-1" v-model:value="effectConfig.bulgeStrength" :step="0.1" :min="-1" :max="1" />
                </div>
              </div>

              <div v-if="effectConfig.mode === 'mosaic'" class="rounded-8px mb-2 bg-[--bg-left-menu] p-2">
                <div class="flex-y-center gap-2">
                  <span class="text-(10px [--left-text-color])">格子大小</span>
                  <n-slider class="flex-1" v-model:value="effectConfig.mosaicScale" :step="1" :min="5" :max="50" />
                </div>
              </div>

              <div class="flex-y-center gap-2">
                <span class="text-(12px [--left-text-color]) w-8 text-right">暗角</span>
                <n-slider class="flex-1" v-model:value="effectConfig.vignette" :step="0.05" :min="0" :max="0.8" />
              </div>

              <n-divider class="!my-2 bg-[--line-color]" />

              <div class="flex-between-center">
                <span class="text-(12px [--text-color]) font-bold">🟢 绿幕抠图</span>
                <n-switch size="small" v-model:value="beautyConfig.greenScreen" />
              </div>

              <n-collapse-transition :show="beautyConfig.greenScreen">
                <div class="rounded-8px mt-2 flex flex-col gap-2 border border-[--line-color] bg-[--bg-left-menu] p-2">
                  <div class="flex-y-center gap-2">
                    <span class="text-(10px [--left-text-color]) w-8 text-right">容差</span>
                    <n-slider
                      class="flex-1"
                      v-model:value="beautyConfig.greenSimilarity"
                      :step="0.01"
                      :min="0"
                      :max="0.6" />
                  </div>

                  <div class="flex-y-center gap-2">
                    <span class="text-(10px [--left-text-color]) w-8 text-right">平滑</span>
                    <n-slider
                      class="flex-1"
                      v-model:value="beautyConfig.greenSmoothness"
                      :step="0.01"
                      :min="0"
                      :max="0.4" />
                  </div>

                  <div class="text-(10px [--user-text-color]) px-1">* 提示: 请保证光线均匀，避免阴影</div>
                </div>
              </n-collapse-transition>

              <n-divider class="!my-2 bg-[--line-color]" />
              <div class="flex-between-center">
                <span class="text-(12px [--text-color]) font-bold">🤖 AI 虚拟背景</span>
                <n-switch size="small" v-model:value="beautyConfig.virtualBg" />
              </div>
              <n-collapse-transition :show="beautyConfig.virtualBg">
                <div class="rounded-8px mt-2 flex flex-col gap-3 border border-[--line-color] bg-[--bg-left-menu] p-3">
                  <span class="text-xs text-[--left-text-color]">背景模式</span>

                  <div class="grid h-16 grid-cols-3 gap-2">
                    <div
                      class="group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all"
                      :class="
                        beautyConfig.bgType === 'green'
                          ? 'border-green-500 bg-green-900/20'
                          : 'border-[--line-color] bg-[--left-item-bg-color] hover:border-[--disabled-color]'
                      "
                      @click="beautyConfig.bgType = 'green'">
                      <div class="size-6 rounded bg-[#00FF00] shadow-lg"></div>
                      <span class="absolute bottom-1 text-[10px] text-[--left-text-color]">绿幕</span>
                    </div>

                    <div
                      class="group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all"
                      :class="
                        beautyConfig.bgType === 'blur'
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-[--line-color] bg-[--left-item-bg-color] hover:border-[--disabled-color]'
                      "
                      @click="beautyConfig.bgType = 'blur'">
                      <div class="i-carbon-blur mb-2 text-xl text-[--left-text-color]"></div>
                      <span class="absolute bottom-1 text-[10px] text-[--left-text-color]">虚化</span>
                    </div>

                    <div
                      class="group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all"
                      :class="
                        beautyConfig.bgType === 'image'
                          ? 'border-purple-500'
                          : 'border-[--line-color] bg-[--left-item-bg-color] hover:border-[--disabled-color]'
                      "
                      @click="handleImageModeClick">
                      <img
                        v-if="bgImage.src"
                        class="absolute inset-0 size-full object-cover opacity-60 transition-opacity group-hover:opacity-40"
                        :src="bgImage.src" />

                      <div class="z-10 flex-col-x-center">
                        <div
                          class="text-xl text-[--text-color]"
                          :class="bgImage.src ? 'i-carbon-image-copy' : 'i-carbon-add'"></div>
                        <span class="mt-1 text-[10px] text-[--left-text-color]">
                          {{ bgImage.src ? (beautyConfig.bgType === "image" ? "更换" : "自定义") : "上传" }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </n-collapse-transition>
              <n-divider class="!my-2 bg-[--line-color]" />

              <div class="flex-between-center">
                <span class="text-(12px [--text-color]) font-bold">🖼️ 品牌水印</span>
                <n-switch size="small" v-model:value="watermarkConfig.enable" />
              </div>

              <n-collapse-transition :show="watermarkConfig.enable">
                <div class="rounded-8px mt-2 flex flex-col gap-2 border border-[--line-color] bg-[--bg-left-menu] p-2">
                  <div class="mb-1 flex-y-center gap-2">
                    <div class="relative flex-1">
                      <n-button
                        size="tiny"
                        ghost
                        block
                        class="!text-(10px [--left-text-color])"
                        @click="handleLogoUpload">
                        {{ logoImg.src ? "更换图片" : "上传 Logo (PNG/JPG)" }}
                      </n-button>
                    </div>
                  </div>

                  <div class="flex-y-center gap-2">
                    <span class="text-(10px [--left-text-color]) w-8 text-right">大小</span>
                    <n-slider class="flex-1" v-model:value="watermarkConfig.scale" :step="0.05" :min="0.1" :max="2.0" />
                  </div>

                  <div class="flex-y-center gap-2">
                    <span class="text-(10px [--left-text-color]) w-8 text-right">透明</span>
                    <n-slider class="flex-1" v-model:value="watermarkConfig.opacity" :step="0.05" :min="0" :max="1.0" />
                  </div>

                  <div class="flex-y-center gap-2">
                    <span class="text-(10px [--left-text-color]) w-8 text-right">X轴</span>
                    <n-slider class="flex-1" v-model:value="watermarkConfig.x" :step="10" :min="0" :max="1800" />
                  </div>

                  <div class="flex-y-center gap-2">
                    <span class="text-(10px [--left-text-color]) w-8 text-right">Y轴</span>
                    <n-slider class="flex-1" v-model:value="watermarkConfig.y" :step="10" :min="0" :max="1000" />
                  </div>
                </div>
              </n-collapse-transition>
            </n-flex>
          </n-scrollbar>
        </div>

        <div class="p-20px pt-10px flex-none bg-gradient-to-t from-[--right-bg-color] to-transparent">
          <n-button
            block
            class="!h-44px !text-16px !font-bold shadow-lg"
            :loading="loading"
            :type="isStreaming ? 'error' : 'primary'"
            @click="handleStreamToggle">
            {{ isStreaming ? "停止直播" : "开始直播" }}
          </n-button>

          <div class="text-(11px [--user-text-color]) mt-3 text-center">
            当前环境: {{ ffmpegInstalled ? "已检测到 FFmpeg" : "未检测到 FFmpeg (WebRTC)" }}
          </div>
        </div>
      </div>
    </div>

    <div class="hidden">
      <video ref="screenVideo" autoplay muted playsinline></video>
      <video ref="cameraVideo" autoplay muted playsinline></video>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import * as fx from "glfx";
import { fetch } from "@tauri-apps/plugin-http";
import { error } from "@tauri-apps/plugin-log";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { TauriCommandEnum } from "@/enums";
import { useWindow } from "@/hooks/useWindow";

const { t } = useI18n();

type SignalingProtocol = "srs-json" | "whip";
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const PIP_W = 480;
const PIP_H = 270;
const pipState = reactive({
  x: CANVAS_W - PIP_W - 40,
  y: CANVAS_H - PIP_H - 40,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  initialPipX: 0,
  initialPipY: 0
});
const roomId = ref("room1");
const token = ref("123456");
const isStreaming = ref(false);
const isPreviewing = ref(false);
const loading = ref(false);
const ffmpegInstalled = ref(false);
const enableCamera = ref(true);
const currentMode = ref<"FFmpeg" | "WebRTC" | "">("");
// 控制是否交换画面
const isSwapped = ref(false);
// 音量控制
const sysVolume = ref(0.8);
const micVolume = ref(1.2);

// DOM 引用
const canvasEl = ref<HTMLCanvasElement | null>(null);
const screenVideo = ref<HTMLVideoElement | null>(null);
const cameraVideo = ref<HTMLVideoElement | null>(null);

// 水印配置
const watermarkConfig = reactive({
  enable: true, // 开关
  opacity: 0.8, // 透明度 (0 ~ 1)
  scale: 0.5, // 缩放比例 (0.1 ~ 2.0)
  x: 50, // X 坐标
  y: 50 // Y 坐标
});

// 水印图片对象
const logoImg = new Image();

// 媒体对象
let screenStream: MediaStream | null = null;
let cameraStream: MediaStream | null = null;
let micStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let sysGain: GainNode | null = null;
let micGain: GainNode | null = null;
let mediaDest: MediaStreamAudioDestinationNode | null = null;

let drawTimer: number = 0;
let mediaRecorder: MediaRecorder | null = null; // FFmpeg 用
let pc: RTCPeerConnection | null = null; // WebRTC 用

const beautyConfig = reactive({
  enable: true, // 总开关
  smooth: 0.5, // 磨皮 (Blur): 0 ~ 2
  whiten: 1.1, // 美白 (Brightness): 1.0 ~ 1.5
  rosy: 1.1, // 红润 (Saturate): 1.0 ~ 2.0
  vignette: 0, // 暗角强度 (0 ~ 1)
  greenScreen: false, // 绿幕开关
  greenSimilarity: 0.4, // 容差
  greenSmoothness: 0.08, // 平滑度
  virtualBg: false, // 虚拟背景开关
  bgType: "green" // 'green' | 'blur' | 'image'
});

// --- 特效配置 ---
const effectConfig = reactive({
  vignette: 0, // 暗角强度 0~1
  // 当前选择的特效模式
  // 'none' | 'bulge' (哈哈镜) | 'mosaic' (马赛克) | 'ink' (水墨) | 'retro' (复古)
  mode: "none",
  // 哈哈镜参数
  bulgeStrength: 0.5, // -1 (挤压) ~ 1 (膨胀)
  // 马赛克参数
  mosaicScale: 20 // 格子大小
});

// 特效选项 (用于 Select 组件)
const effectOptions = [
  { label: "无特效", value: "none" },
  { label: "🤪 哈哈镜", value: "bulge" },
  { label: "🧩 蜂巢马赛克", value: "mosaic" },
  { label: "✒️ 水墨素描", value: "ink" },
  { label: "🎞️ 复古旧电影", value: "retro" }
];

// 临时 Canvas，用于 CPU 绿幕处理
const tmpCanvas = document.createElement("canvas");
const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true }); // 优化读取性能

const showStatusToast = ref(false);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// fxCanvas: 用于处理美颜的离屏 WebGL 画布
let fxCanvas: any = null;
// fxTexture: 用于接收摄像头画面的纹理
let fxTexture: any = null;

// AI 分割实例
let selfieSegmentation: SelfieSegmentation | null = null;
// 虚拟背景图片 (如果是纯色背景，这个可以不用)
const bgImage = new Image();
bgImage.src = "";

const { createWebviewWindow } = useWindow();

// 监听模式变化
watch(
  currentMode,
  () => {
    // 只要模式变化（或者是特定的非空模式），就显示提示
    showStatusToast.value = true;
    // 清除上一次的计时器（防止频繁切换时闪烁）draw
    if (toastTimer) clearTimeout(toastTimer);
    // 5秒后隐藏
    toastTimer = setTimeout(() => {
      showStatusToast.value = false;
    }, 5000);
  },
  { immediate: true }
);

// 计算最终的滤镜字符串
const currentFilter = computed(() => {
  if (!beautyConfig.enable) return "none";
  // 磨皮用 blur，美白用 brightness，红润用 saturate
  // contrast(0.95) 是为了配合美白，防止过曝，让光线更柔和
  return `blur(${beautyConfig.smooth}px) brightness(${beautyConfig.whiten * 100}%) saturate(${beautyConfig.rosy * 100}%) contrast(95%)`;
});

const statusText = computed(() => {
  if (isStreaming.value) return "LIVE ON AIR";
  if (loading.value) return "INITIALIZING...";
  return "READY";
});

const statusType = computed(() => {
  if (isStreaming.value) return "error";
  if (loading.value) return "warning";
  return "success";
});

// --- 核心逻辑：开关直播 ---
const handleStreamToggle = async () => {
  if (isStreaming.value) {
    await stopEverything();
  } else {
    await startEverything();
    await createWebviewWindow("弹幕", "danmaku", 400, 720, "", false);
  }
};

const startEverything = async () => {
  if (!roomId.value) return window.$message.warning(t("record.roomIdRequired"));
  loading.value = true;

  try {
    // 1. 获取屏幕流
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 1920, height: 1080, frameRate: 30 },
      audio: true
    });

    if (screenVideo.value) {
      screenVideo.value.srcObject = screenStream;
      await screenVideo.value.play().catch((e) => console.error("屏幕视频播放失败:", e));
    }

    // 2. 获取麦克风
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false
    });

    // 3. 按需获取摄像头
    if (enableCamera.value) {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360 },
        audio: false
      });
      if (cameraVideo.value) {
        cameraVideo.value.srcObject = cameraStream;
        await cameraVideo.value.play().catch((e) => console.error("摄像头播放失败:", e));
      }
    }

    // 4. 启动混音器
    initAudioMixer();

    isPreviewing.value = true;
    isStreaming.value = true; // 预设为 true，防止循环刚开始就退出
    // 5. 启动 Canvas 渲染循环
    startCanvasLoop();

    // 6. 生成最终混合流
    // 画面来自 Canvas，声音来自 AudioContext
    const canvasStream = canvasEl.value!.captureStream(30);
    if (canvasStream.getVideoTracks().length === 0) {
      error("Canvas 捕获流失败");
    }
    const finalStream = new MediaStream([canvasStream.getVideoTracks()[0], mediaDest!.stream.getAudioTracks()[0]]);

    isPreviewing.value = true;

    // 7. 智能分流 (FFmpeg vs WebRTC)
    if (ffmpegInstalled.value) {
      await startFfmpegMode(finalStream);
    } else {
      await startWebRTCMode(finalStream);
    }

    // 8. 监听屏幕分享的原生停止按钮
    screenStream.getVideoTracks()[0].onended = () => {
      window.$message.info(t("record.screenShareEnded"));
      stopEverything();
    };

    isStreaming.value = true;
  } catch (err: any) {
    console.error(err);
    window.$message.error(t("record.startFailed", { error: err.message || t("record.unknownError") }));
    await stopEverything();
  } finally {
    loading.value = false;
  }
};

const stopEverything = async () => {
  loading.value = true;

  // 停止 Canvas
  cancelAnimationFrame(drawTimer);

  // 停止推流后端
  if (currentMode.value === "FFmpeg") {
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    await invoke(TauriCommandEnum.STOP_STREAM_PIPE).catch(() => {});
  } else if (currentMode.value === "WebRTC") {
    if (pc) pc.close();
  }
  // 停止所有媒体流
  [screenStream, cameraStream, micStream].forEach((stream) => {
    stream?.getTracks().forEach((t) => t.stop());
  });

  // 关闭 AudioContext
  if (audioContext && audioContext.state !== "closed") {
    await audioContext.close();
  }

  // 重置状态
  screenStream = null;
  cameraStream = null;
  micStream = null;
  audioContext = null;
  mediaRecorder = null;
  pc = null;

  if (screenVideo.value) screenVideo.value.srcObject = null;
  if (cameraVideo.value) cameraVideo.value.srcObject = null;

  isStreaming.value = false;
  isPreviewing.value = false;
  currentMode.value = "";
  loading.value = false;
};

// --- 模式 A: FFmpeg 推流 ---
const startFfmpegMode = async (stream: MediaStream) => {
  currentMode.value = "FFmpeg";

  // 启动 Rust 子进程
  await invoke(TauriCommandEnum.START_STREAM_PIPE, {
    roomId: roomId.value,
    token: token.value
  });

  // 使用 MediaRecorder 切片
  const options = { mimeType: "video/webm; codecs=h264" }; // 优先尝试 H264
  // 兼容性处理：如果不支持 h264，回退 vp9
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options.mimeType = "video/webm; codecs=vp9";
  }

  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = async (e) => {
    if (e.data.size > 0) {
      const buffer = await e.data.arrayBuffer();
      // 发送二进制数据给 Rust
      invoke(TauriCommandEnum.PUSH_STREAM_CHUNK, {
        data: Array.from(new Uint8Array(buffer))
      }).catch(() => {}); // 忽略传输过程中的轻微丢包
    }
  };

  mediaRecorder.start(100); // 100ms 切片频率
};

// --- 模式 B: WebRTC 推流 ---
const startWebRTCMode = async (stream: MediaStream) => {
  // 在这里切换协议： 'whip' (推荐) 或 'srs-json' (旧版兼容)
  const protocol: SignalingProtocol = "whip" as SignalingProtocol;

  currentMode.value = "WebRTC";

  pc = new RTCPeerConnection();

  // 添加轨道
  stream.getTracks().forEach((track) => {
    pc!.addTrack(track, stream);
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // SRS 服务器地址 (如果是 Docker 部署，确保 1985 端口已映射)
  const srsHost = "localhost";
  const srsPort = 1985;

  let remoteSdp = "";

  try {
    if (protocol === "srs-json") {
      // =================================================
      // 方案 A: SRS 私有 JSON 协议 (旧版兼容性好)
      // =================================================
      console.log("正在使用 SRS JSON 协议握手...");
      const apiUrl = `http://${srsHost}:${srsPort}/rtc/v1/publish/`;
      const streamUrl = `webrtc://${srsHost}/live/${roomId.value}?token=${token.value}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamurl: streamUrl,
          sdp: offer.sdp
        })
      });

      const data = await response.json();
      if (data.code !== 0) error(`SRS JSON Error: ${data.code}`);
      remoteSdp = data.sdp;
    } else {
      // =================================================
      // 方案 B: 标准 WHIP 协议 (推荐，通用性强)
      // =================================================
      console.log("正在使用标准 WHIP 协议握手...");

      // SRS v5/v6 的标准 WHIP 接口地址
      // 注意：SRS 的 WHIP 鉴权通常把参数拼接在 URL 后
      const whipUrl = `http://${srsHost}:${srsPort}/whip/v1/publish?app=live&stream=${roomId.value}&token=${token.value}`;

      const response = await fetch(whipUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp" // WHIP 核心特征
        },
        body: offer.sdp // 直接发送 SDP 文本
      });

      if (!response.ok) error(`WHIP Error: ${response.status}`);

      // WHIP 返回的是纯文本 SDP
      remoteSdp = await response.text();
    }

    // 设置远端描述 (握手完成)
    await pc.setRemoteDescription(
      new RTCSessionDescription({
        type: "answer",
        sdp: remoteSdp
      })
    );

    console.log(`WebRTC (${protocol}) 推流成功!`);
  } catch (e) {
    console.error("WebRTC Signaling Failed:", e);
    throw e;
  }
};

// --- 音频混音引擎 (AudioContext) ---
const initAudioMixer = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  audioContext = new AudioContext();
  mediaDest = audioContext.createMediaStreamDestination();

  // 1. 系统音频链路
  if (screenStream?.getAudioTracks().length) {
    const src = audioContext.createMediaStreamSource(screenStream);
    sysGain = audioContext.createGain();
    sysGain.gain.value = sysVolume.value; // 初始音量
    src.connect(sysGain).connect(mediaDest);
  }

  // 2. 麦克风链路
  if (micStream?.getAudioTracks().length) {
    const src = audioContext.createMediaStreamSource(micStream);
    micGain = audioContext.createGain();
    micGain.gain.value = micVolume.value; // 初始音量
    src.connect(micGain).connect(mediaDest);
  }
};

// 监听音量滑块变化
watch(sysVolume, (v) => {
  if (sysGain) sysGain.gain.value = v;
});
watch(micVolume, (v) => {
  if (micGain) micGain.gain.value = v;
});

// --- Canvas 渲染引擎 (集成 AI 虚拟背景 & 绿幕) ---
const startCanvasLoop = () => {
  if (!canvasEl.value) return;
  const ctx = canvasEl.value.getContext("2d", { alpha: false });
  if (!ctx) return;

  canvasEl.value.width = 1920;
  canvasEl.value.height = 1080;

  const PIP_W = 480;
  const PIP_H = 270;

  // 1. 初始化 WebGL (glfx) 并清理旧资源
  try {
    if (fxTexture) {
      try {
        fxTexture.destroy();
      } catch (e) {}
      fxTexture = null;
    }
    fxCanvas = fx.canvas();
  } catch (e) {
    console.error("WebGL 不支持:", e);
    fxCanvas = null;
  }

  // 2. 初始化离屏 Canvas
  const aiCanvas = document.createElement("canvas");
  const aiCtx = aiCanvas.getContext("2d", { willReadFrequently: true });

  // Bridge Canvas (过桥画布)
  const bridgeCanvas = document.createElement("canvas");
  const bridgeCtx = bridgeCanvas.getContext("2d", { willReadFrequently: true });

  // --- AI 结果处理回调 ---
  const handleAIResults = (results: any) => {
    if (!aiCtx) return;

    if (aiCanvas.width !== results.image.width) aiCanvas.width = results.image.width;
    if (aiCanvas.height !== results.image.height) aiCanvas.height = results.image.height;

    const w = aiCanvas.width;
    const h = aiCanvas.height;

    aiCtx.clearRect(0, 0, w, h);
    aiCtx.drawImage(results.segmentationMask, 0, 0, w, h);
    aiCtx.globalCompositeOperation = "source-in";
    aiCtx.drawImage(results.image, 0, 0, w, h);
    aiCtx.globalCompositeOperation = "destination-over";

    if (beautyConfig.bgType === "green") {
      aiCtx.fillStyle = "#00FF00";
      aiCtx.fillRect(0, 0, w, h);
    } else if (beautyConfig.bgType === "image") {
      if (bgImage && bgImage.complete) {
        aiCtx.drawImage(bgImage, 0, 0, w, h);
      } else {
        aiCtx.fillStyle = "#111";
        aiCtx.fillRect(0, 0, w, h);
      }
    } else if (beautyConfig.bgType === "blur") {
      aiCtx.fillStyle = "#333";
      aiCtx.fillRect(0, 0, w, h);
    }

    aiCtx.globalCompositeOperation = "source-over";
  };

  if (selfieSegmentation) {
    selfieSegmentation.onResults(handleAIResults);
  }

  // --- CPU 绿幕 (Fallback) ---
  const processChromaKeyCPU = (source: CanvasImageSource, width: number, height: number) => {
    if (!tmpCtx) return source;
    if (tmpCanvas.width !== width) tmpCanvas.width = width;
    if (tmpCanvas.height !== height) tmpCanvas.height = height;

    tmpCtx.clearRect(0, 0, width, height);
    tmpCtx.drawImage(source, 0, 0, width, height);

    const frameData = tmpCtx.getImageData(0, 0, width, height);
    const l = frameData.data.length / 4;
    const data = frameData.data;
    const similarity = beautyConfig.greenSimilarity;
    const threshold = 150 - similarity * 80;

    for (let i = 0; i < l; i++) {
      const offset = i * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      if (g < r || g < b) continue;
      const rbMax = Math.max(r, b);
      if (g - rbMax > threshold) data[offset + 3] = 0;
    }
    tmpCtx.putImageData(frameData, 0, 0);
    return tmpCanvas;
  };

  let lastSendTime = 0;

  const draw = async () => {
    if (!isStreaming.value && !isPreviewing.value) return;

    try {
      const videoEl = cameraVideo.value;

      // 阶段一：WebGL 预处理 (glfx)
      let processedCameraSource: any = videoEl; // 默认为原视频

      const isCameraReady = enableCamera.value && videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0;
      const needWebGL =
        fxCanvas && isCameraReady && (beautyConfig.enable || effectConfig.mode !== "none" || effectConfig.vignette > 0);

      if (needWebGL && videoEl) {
        try {
          if (!fxTexture) {
            fxTexture = fxCanvas.texture(videoEl);
          }
          fxTexture.loadContentsOf(videoEl);

          const chain = fxCanvas.draw(fxTexture);

          if (beautyConfig.enable) {
            chain
              .denoise(beautyConfig.smooth * 20)
              .brightnessContrast(beautyConfig.whiten - 1, 0)
              .hueSaturation(0, (beautyConfig.rosy - 1) * 0.4);
          }
          const w = videoEl.videoWidth || 640;
          const h = videoEl.videoHeight || 360;

          switch (effectConfig.mode) {
            case "bulge":
              chain.bulgePinch(w / 2, h / 2, h * 0.6, effectConfig.bulgeStrength);
              break;
            case "mosaic":
              chain.hexagonalPixelate(w / 2, h / 2, effectConfig.mosaicScale);
              break;
            case "ink":
              chain.ink(0.25);
              break;
            case "retro":
              chain.sepia(1).noise(0.1).vignette(0.4, 0.6);
              break;
          }
          if (effectConfig.vignette > 0 && effectConfig.mode !== "retro") {
            chain.vignette(0.5, effectConfig.vignette);
          }

          chain.update();

          if (bridgeCtx) {
            if (bridgeCanvas.width !== w) bridgeCanvas.width = w;
            if (bridgeCanvas.height !== h) bridgeCanvas.height = h;

            bridgeCtx.clearRect(0, 0, w, h);
            bridgeCtx.drawImage(fxCanvas, 0, 0, w, h);

            // 将处理源指向这个“安全”的 2D 画布
            processedCameraSource = bridgeCanvas;
          }
        } catch (e) {
          console.warn("WebGL 渲染异常 (自动降级):", e);
          processedCameraSource = videoEl;
          try {
            if (fxTexture) fxTexture.destroy();
            fxTexture = null;
          } catch (err) {}
        }
      }

      // 阶段二：背景处理 (AI > CPU绿幕)
      if (isCameraReady && videoEl) {
        const w = videoEl.videoWidth || 640;
        const h = videoEl.videoHeight || 360;

        // 选项 A: AI 虚拟背景
        if (beautyConfig.virtualBg && selfieSegmentation) {
          const now = performance.now();
          if (now - lastSendTime > 30) {
            lastSendTime = now;
            await selfieSegmentation.send({ image: processedCameraSource });
          }
          if (aiCanvas.width > 0) {
            processedCameraSource = aiCanvas;
          }
        }
        // 选项 B: CPU 绿幕
        else if (beautyConfig.greenScreen) {
          processedCameraSource = processChromaKeyCPU(processedCameraSource, w, h);
        }
      }

      // 阶段三：图层分配与合成
      let bgSource = isSwapped.value ? processedCameraSource : screenVideo.value;
      let pipSource = isSwapped.value ? screenVideo.value : processedCameraSource;

      if (!enableCamera.value) {
        bgSource = screenVideo.value;
        pipSource = null;
      }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // --- 绘制背景 ---
      const isBgRawVideo = bgSource === videoEl;
      const shouldApplyCssToBg =
        isBgRawVideo && beautyConfig.enable && !beautyConfig.greenScreen && !beautyConfig.virtualBg && !needWebGL;

      ctx.filter = shouldApplyCssToBg ? currentFilter.value : "none";

      if (bgSource && (bgSource instanceof HTMLCanvasElement || bgSource.readyState >= 2)) {
        ctx.drawImage(bgSource, 0, 0, CANVAS_W, CANVAS_H);
      } else {
        ctx.filter = "none";
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }

      // --- 绘制画中画 ---
      if (enableCamera.value && pipSource && (pipSource instanceof HTMLCanvasElement || pipSource.readyState >= 2)) {
        const isPipRawVideo = pipSource === videoEl;
        const shouldApplyCssToPip =
          isPipRawVideo && beautyConfig.enable && !beautyConfig.greenScreen && !beautyConfig.virtualBg && !needWebGL;

        ctx.filter = shouldApplyCssToPip ? currentFilter.value : "none";
        ctx.drawImage(pipSource, pipState.x, pipState.y, PIP_W, PIP_H);
        // 边框
        ctx.filter = "none";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.strokeRect(pipState.x, pipState.y, PIP_W, PIP_H);
      }
      // 阶段四：绘制水印 (Overlay)
      if (watermarkConfig.enable && logoImg.src && logoImg.complete && logoImg.naturalWidth > 0) {
        // 保存当前的透明度设置
        const prevAlpha = ctx.globalAlpha;
        // 应用水印透明度
        ctx.globalAlpha = watermarkConfig.opacity;
        // 计算绘制尺寸
        const drawW = logoImg.naturalWidth * watermarkConfig.scale;
        const drawH = logoImg.naturalHeight * watermarkConfig.scale;
        // 绘制图片
        ctx.drawImage(logoImg, watermarkConfig.x, watermarkConfig.y, drawW, drawH);
        // 恢复全局透明度 (非常重要！否则下一帧整个画面都会变半透明)
        ctx.globalAlpha = prevAlpha;
      }
    } catch (e) {
      console.warn("Draw loop error:", e);
    }
    drawTimer = requestAnimationFrame(draw);
  };

  draw();
};

const handleBgUpload = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Image",
          extensions: ["png", "jpg", "jpeg", "webp"]
        }
      ]
    });
    if (selected === null) return;
    const filePath = selected as string;
    const assetUrl = convertFileSrc(filePath);
    bgImage.src = assetUrl;
    // 图片加载成功后，自动切换到"自定义图"模式
    bgImage.onload = () => {
      beautyConfig.bgType = "image";
      window.$message.success(t("record.bgReplaceSuccess"));
    };
  } catch (err) {
    console.error("背景选择失败:", err);
    window.$message.error(t("record.imageLoadFailed"));
  }
};

const handleLogoUpload = async () => {
  try {
    // 1. 打开原生文件选择框
    const selected = await open({
      multiple: false, // 单选
      filters: [
        {
          name: "Image",
          extensions: ["png", "jpg", "jpeg", "webp"]
        }
      ]
    });
    // 用户取消了选择
    if (selected === null) return;
    // 2. 获取文件路径 (Tauri v2 open 返回的是 string | null)
    // 注意：如果是多选会返回 string[]，这里我们配置了 multiple: false
    const filePath = selected as string;
    // 3. 将本地路径转换为 Webview 可识别的 URL
    const assetUrl = convertFileSrc(filePath);
    // 4. 加载图片
    logoImg.src = assetUrl;
    logoImg.onload = () => {
      watermarkConfig.enable = true;
      window.$message.success(t("record.watermarkLoadSuccess"));
    };
  } catch (err) {
    console.error("文件选择失败:", err);
    window.$message.error(t("record.imageLoadFailed"));
  }
};

// 这里的 results 包含：image (原图), segmentationMask (蒙版)
const onSegmentationResults = (results: any) => {
  if (!canvasEl.value) return;
  const ctx = canvasEl.value.getContext("2d");
  if (!ctx) return;

  const width = canvasEl.value.width;
  const height = canvasEl.value.height;

  // 1. 清空画布
  ctx.clearRect(0, 0, width, height);

  // 2. 先把蒙版画上去
  // 蒙版里：人是主要内容，背景是透明/黑色
  ctx.drawImage(results.segmentationMask, 0, 0, width, height);

  // 3. 关键步骤：设置混合模式 'source-in'
  // 意思：只保留"画布上已有内容(蒙版)"和"新画内容(原图)"重叠的部分
  // 也就是：只保留人像区域
  ctx.globalCompositeOperation = "source-in";
  ctx.drawImage(results.image, 0, 0, width, height);

  // 4. 绘制背景
  // 设置混合模式 'destination-over'
  // 意思：把新内容画在现有内容(人像)的"后面"
  ctx.globalCompositeOperation = "destination-over";

  if (beautyConfig.bgType === "green") {
    // A. 填充纯绿色 (这就实现了你想要的"给背景添加绿幕")
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(0, 0, width, height);
  } else if (beautyConfig.bgType === "image") {
    // B. 绘制自定义图片
    ctx.drawImage(bgImage, 0, 0, width, height);
  } else {
    // C. 背景虚化 (稍微复杂点，需要再画一次原图并加模糊，这里简化为黑色)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);
  }

  // 5. 恢复混合模式，以免影响后续绘制
  ctx.globalCompositeOperation = "source-over";
};

// 智能点击处理：切换模式 OR 触发上传
const handleImageModeClick = () => {
  // 情况 1: 当前已经是 Image 模式 -> 用户的意图是"换一张图"
  if (beautyConfig.bgType === "image") {
    handleBgUpload();
    return;
  }
  // 情况 2: 当前不是 Image 模式 -> 用户的意图是"切换过去"
  beautyConfig.bgType = "image";
  // 顺便检查：如果切换过去了但还没图 -> 自动帮用户点开上传
  if (!bgImage.src) {
    handleBgUpload();
  }
};

// 将鼠标在 DOM 元素上的坐标 (e.offsetX) 转换为 Canvas 内部坐标 (1920x1080)
const getCanvasCoordinates = (e: MouseEvent) => {
  if (!canvasEl.value) return { x: 0, y: 0 };
  const rect = canvasEl.value.getBoundingClientRect();
  const domW = rect.width;
  const domH = rect.height;
  // 计算缩放比例 (object-fit: contain)
  const canvasRatio = CANVAS_W / CANVAS_H;
  const domRatio = domW / domH;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  if (domRatio > canvasRatio) {
    // 窗口太宽，左右有黑边
    const actualW = domH * canvasRatio;
    scale = CANVAS_H / domH;
    offsetX = (domW - actualW) / 2;
  } else {
    // 窗口太高，上下有黑边
    const actualH = domW / canvasRatio;
    scale = CANVAS_W / domW;
    offsetY = (domH - actualH) / 2;
  }
  // 映射坐标
  const x = (e.offsetX - offsetX) * scale;
  const y = (e.offsetY - offsetY) * scale;
  return { x, y };
};

// 鼠标按下 (开始拖拽检测)
const handleMouseDown = (e: MouseEvent) => {
  if (!enableCamera.value) return;
  const { x, y } = getCanvasCoordinates(e);
  // 判断是否点击在画中画区域内
  // 使用 pipState.x 代替原来的常量 PIP_X
  if (x >= pipState.x && x <= pipState.x + PIP_W && y >= pipState.y && y <= pipState.y + PIP_H) {
    pipState.isDragging = true;
    pipState.dragStartX = e.clientX; // 记录屏幕坐标用于计算位移
    pipState.dragStartY = e.clientY;
    pipState.initialPipX = pipState.x;
    pipState.initialPipY = pipState.y;
  }
};

// 鼠标移动 (执行拖拽)
const handleMouseMove = (e: MouseEvent) => {
  // 1. 改变鼠标样式：如果鼠标悬停在 PIP 上，显示抓手
  if (!pipState.isDragging) {
    const { x, y } = getCanvasCoordinates(e);
    const isHover = x >= pipState.x && x <= pipState.x + PIP_W && y >= pipState.y && y <= pipState.y + PIP_H;
    if (canvasEl.value) {
      // 如果开启了摄像头且悬停，显示 move 样式
      canvasEl.value.style.cursor = enableCamera.value && isHover ? "move" : "default";
    }
    return;
  }

  // 2. 执行拖拽逻辑
  if (pipState.isDragging) {
    const deltaX = e.clientX - pipState.dragStartX;
    const deltaY = e.clientY - pipState.dragStartY;
    // 重新计算 Canvas 缩放比例，因为 deltaX 是屏幕像素，需要转成 Canvas 内部像素
    const rect = canvasEl.value!.getBoundingClientRect();
    const domRatio = rect.width / rect.height;
    const canvasRatio = CANVAS_W / CANVAS_H;
    let scale = 1;
    if (domRatio > canvasRatio) {
      scale = CANVAS_H / rect.height;
    } else {
      scale = CANVAS_W / rect.width;
    }
    // 更新位置
    let newX = pipState.initialPipX + deltaX * scale;
    let newY = pipState.initialPipY + deltaY * scale;
    // 边界限制 (不让它跑出画布)
    newX = Math.max(0, Math.min(newX, CANVAS_W - PIP_W));
    newY = Math.max(0, Math.min(newY, CANVAS_H - PIP_H));
    pipState.x = newX;
    pipState.y = newY;
  }
};

// 鼠标松开 (结束拖拽 & 判断点击)
const handleMouseUp = (e: MouseEvent) => {
  if (pipState.isDragging) {
    // 计算总移动距离
    const dist = Math.sqrt((e.clientX - pipState.dragStartX) ** 2 + (e.clientY - pipState.dragStartY) ** 2);
    // 如果移动距离小于 5px，我们认为这是一次"点击"，触发画面交换
    if (dist < 5) {
      isSwapped.value = !isSwapped.value;
    }
    pipState.isDragging = false;
  }
};

// 确保鼠标移出画布时也停止拖拽
const handleMouseLeave = () => {
  pipState.isDragging = false;
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  try {
    ffmpegInstalled.value = await invoke(TauriCommandEnum.CHECK_FFMPEG_INSTALLED);
    console.log("[Env] FFmpeg:", ffmpegInstalled.value);
  } catch (e) {
    console.error("Environment check failed", e);
  }
  // 初始化人像分割模型
  selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => {
      // 指向本地 public 目录
      return `/selfie_segmentation/${file}`;
    }
  });

  selfieSegmentation.setOptions({
    modelSelection: 1 // 1 = Landscape(横屏模式，精度高), 0 = General(通用，速度快)
  });

  // 当 AI 处理完一帧后的回调
  selfieSegmentation.onResults(onSegmentationResults);
});

onUnmounted(() => {
  stopEverything();
});
</script>

<style scoped></style>
