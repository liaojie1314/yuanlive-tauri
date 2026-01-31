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
import { invoke } from "@tauri-apps/api/core";
import { LogicalPosition } from "@tauri-apps/api/window";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { TauriCommandEnum } from "@/enums";

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
const isTyping = ref(false);

let bubbleTimer: any = null;
let typingTimer: any = null;

// 音频与口型相关
const audioContext = shallowRef<AudioContext | null>(null);
const audioSource = shallowRef<AudioBufferSourceNode | null>(null);
let lipSyncInterval: any = null;
const synth = window.speechSynthesis; // 浏览器原生TTS

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
  if (newX > screenWidth - winWidth - 10) newX = screenWidth - winWidth - 10;
  if (newY > screenHeight - winHeight) newY = screenHeight - winHeight;
  await appWindow.setPosition(new LogicalPosition(newX, newY));
};

const stopDrag = () => {
  isDragging = false;
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
};

// --- 核心逻辑：音频管理 (清理与停止) ---
const stopSpeaking = () => {
  // 1. 停止后端音频
  if (audioSource.value) {
    try {
      audioSource.value.stop();
    } catch {}
    audioSource.value = null;
  }
  // 2. 停止原生 TTS
  synth?.cancel();

  // 3. 停止口型动画
  if (lipSyncInterval) {
    clearInterval(lipSyncInterval);
    lipSyncInterval = null;
  }

  // 4. 恢复闭嘴状态
  if (live2dModel.value?.internalModel?.coreModel) {
    live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", 0);
  }
};

// --- 核心逻辑：播放后端音频 (精准口型) ---
const playAudioWithLipSync = async (audioData: Uint8Array) => {
  stopSpeaking(); // 先清理

  if (!audioContext.value) {
    audioContext.value = new AudioContext();
  }
  if (!live2dModel.value) return;

  try {
    const audioBuffer = await audioContext.value.decodeAudioData(audioData.buffer as ArrayBuffer);
    const newSource = audioContext.value.createBufferSource();
    newSource.buffer = audioBuffer;
    audioSource.value = newSource;

    const analyser = audioContext.value.createAnalyser();
    analyser.fftSize = 256;
    newSource.connect(analyser);
    analyser.connect(audioContext.value.destination);

    newSource.start(0);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    lipSyncInterval = setInterval(() => {
      if (!live2dModel.value?.internalModel?.coreModel) return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      const checkCount = Math.min(20, dataArray.length);
      for (let i = 0; i < checkCount; i++) sum += dataArray[i];
      const avg = sum / checkCount;

      let openValue = avg / 60;
      if (openValue > 1) openValue = 1;
      if (openValue < 0.1) openValue = 0;

      live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", openValue);
    }, 33);

    newSource.onended = () => {
      stopSpeaking();
    };
  } catch (err) {
    console.error("音频解码/播放失败", err);
  }
};

// --- 核心逻辑：播放系统 TTS (降级方案 - 随机口型) ---
const playSystemTTS = async (text: string) => {
  stopSpeaking(); // 先清理
  // 1. 尝试使用浏览器原生 API
  if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 1.0;
    // 模拟口型
    utterance.onstart = () => {
      startRandomLipSync(); // 把下面的定时器逻辑抽成一个函数方便复用
    };
    utterance.onend = () => stopSpeaking();
    utterance.onerror = () => {
      // 如果浏览器报错，也尝试切到 Rust
      invokeRustTTS(text);
    };
    window.speechSynthesis.speak(utterance);
    return;
  }
  // 2. 如果浏览器不支持，调用 Rust
  console.log("浏览器不支持 TTS，切换到 Rust 后端...");
  await invokeRustTTS(text);
};

const invokeRustTTS = async (text: string) => {
  try {
    // 开始模拟口型 (因为系统 TTS 不给回调，我们只能估算时间)
    startRandomLipSync();
    // 1. 自动识别语言
    const lang = detectLanguage(text);
    console.log(`识别语言: ${lang}, 调用系统 TTS...`);
    // 2. 传给 Rust
    await invoke(TauriCommandEnum.SPEAK_SYSTEM, { text, lang });
    // 3. 估算结束时间 (清理口型)
    // 英文语速通常比中文快，可以微调
    const charRate = lang === "zh" ? 250 : 150;
    const duration = Math.max(2000, text.length * charRate);
    setTimeout(() => {
      stopSpeaking();
    }, duration);
  } catch (e) {
    console.error("Rust TTS 也失败了:", e);
    stopSpeaking();
  }
};

const detectLanguage = (text: string): string => {
  // 正则表达式：只要包含任何中文字符，就认为是中文
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return "zh";
  }
  // 否则默认英文
  return "en";
};

// 随机口型
const startRandomLipSync = () => {
  if (lipSyncInterval) clearInterval(lipSyncInterval);
  lipSyncInterval = setInterval(() => {
    if (!live2dModel.value?.internalModel?.coreModel) return;
    const value = Math.random() * 0.8;
    live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", value);
  }, 100);
};

// --- 核心逻辑：打字机 ---
const typeWriter = (text: string, onComplete: () => void) => {
  if (typingTimer) clearInterval(typingTimer);
  bubbleText.value = "";
  let i = 0;
  const speed = 80;
  isTyping.value = true;
  isScrolling.value = false;

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

// --- 核心逻辑：跑马灯计算 ---
const checkScroll = () => {
  if (!textRef.value || !containerRef.value) return;
  const textWidth = textRef.value.scrollWidth;
  const containerWidth = containerRef.value.clientWidth;

  if (textWidth > containerWidth + 2) {
    isScrolling.value = true;
    const distance = textWidth - containerWidth + 20; // +20 缓冲，防止切字
    const duration = Math.max(3, distance / 40);
    scrollDuration.value = `${duration}s`;
    containerRef.value.style.setProperty("--scroll-distance", `-${distance}px`);
  } else {
    isScrolling.value = false;
    containerRef.value.style.removeProperty("--scroll-distance");
  }
};

const onScrollEnd = () => {
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

  // 1. 音频播放策略 (优先后端 -> 降级前端)
  if (live2dModel.value) {
    try {
      // 如果后端没准备好，这里会报错，自动跳到 catch
      const audioRes: number[] = await invoke("fetch_audio_tts", { text });
      if (!audioRes || audioRes.length === 0) throw new Error("Empty Audio");
      await playAudioWithLipSync(new Uint8Array(audioRes));
    } catch (e) {
      // 降级使用浏览器 TTS
      playSystemTTS(text);
    }
  }

  // 2. 视觉打字机
  typeWriter(text, async () => {
    await nextTick();
    checkScroll();

    if (!isScrolling.value) {
      const stayTime = Math.max(2500, text.length * 200);
      bubbleTimer = setTimeout(() => {
        showBubble.value = false;
      }, stayTime);
    }
  });
};

onMounted(async () => {
  if (!canvasRef.value) return;

  // 1. 窗口右下角定位
  const screenW = window.screen.availWidth;
  const screenH = window.screen.availHeight;
  const winW = window.outerWidth;
  const winH = window.outerHeight;
  const x = screenW - winW; // 紧贴右边
  const y = screenH - winH; // 紧贴底边
  await appWindow.setPosition(new LogicalPosition(x - 10, y));
  await appWindow.show();

  // 2. Pixi 初始化
  const app = new PIXI.Application({
    view: canvasRef.value,
    autoStart: true,
    resizeTo: window,
    backgroundAlpha: 0, // 完全透明
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });

  // 3. Live2D 模型加载
  const modelPath = "https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples/Samples/Resources/Hiyori/Hiyori.model3.json";

  try {
    const model = await Live2DModel.from(modelPath);
    live2dModel.value = model;
    app.stage.addChild(model);

    // 布局与自适应
    const updateLayout = () => {
      const screenW = app.renderer.screen.width;
      const screenH = app.renderer.screen.height;

      model.anchor.set(0, 0); // 锚点左上角

      // 撑满宽度，高度留空
      const rawWidth = model.internalModel.originalWidth || model.width;
      const rawHeight = model.internalModel.originalHeight || model.height;
      const scaleX = screenW / rawWidth;
      const scaleY = (screenH * 0.9) / rawHeight;
      const scale = Math.min(scaleX, scaleY);

      model.scale.set(scale);

      // 居中底部对齐
      model.x = (screenW - model.width) / 2;
      model.y = screenH - model.height;
    };

    updateLayout();
    app.renderer.on("resize", updateLayout);

    // 点击事件
    model.on("hit", (hitAreas) => {
      if (hitAreas.includes("Body")) {
        model.motion("TapBody");
        speak("hello world");
      }
    });
  } catch (e) {
    console.error("Live2D Load Failed:", e);
  }
});

onUnmounted(() => {
  stopSpeaking();
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
  if (typingTimer) clearInterval(typingTimer);
  if (bubbleTimer) clearTimeout(bubbleTimer);
  if (audioContext.value) {
    try {
      audioContext.value.close();
    } catch {}
  }
});
</script>

<style scoped lang="scss">
.bubble {
  top: 10px;
  max-width: 90%;
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
  overflow: hidden;

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

  /* 打字时或长文本时：靠左对齐，防止跳动 */
  &.is-long-text,
  &.is-typing {
    justify-content: flex-start;
  }
}

.bubble-text {
  display: inline-block;
  white-space: nowrap;
  padding: 0;

  &.scrolling {
    animation-name: marquee;
    animation-timing-function: linear;
    animation-delay: 0.5s; /* 读完停半秒再滚 */
    animation-iteration-count: 1;
    animation-direction: normal;
    animation-fill-mode: forwards;
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
