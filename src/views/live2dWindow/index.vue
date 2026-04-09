<template>
  <main class="relative size-full overflow-hidden bg-transparent select-none">
    <transition name="fade">
      <div
        v-if="showBubble"
        ref="containerRef"
        class="bubble absolute left-1/2 z-10 -translate-x-1/2 transform"
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
    </transition>

    <div
      v-show="!isSleeping"
      class="toolbar-container absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 items-center transition-opacity duration-500 max-h-[100%] overflow-y-auto py-2">
      <div title="语音连麦" class="action-btn group" @click="handleVoiceChat">
        <i-mdi-microphone
          class="text-20px"
          :class="{ 'text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]': isVoiceChatting }" />
      </div>
      <div title="视觉捕获 (开关)" class="action-btn group" @click="captureScreen">
        <i-mdi-monitor-screenshot
          class="text-20px"
          :class="{ 'text-[#13987f] drop-shadow-[0_0_8px_rgba(19,152,127,0.8)]': isVisionActive }" />
      </div>
      <div title="键鼠接管 (Agent)" class="action-btn group" @click="operateKeyboard">
        <i-mdi-robot-outline class="text-20px" />
      </div>

      <div title="面部捕捉 (皮套模式)" class="action-btn group" @click="toggleFaceTracking">
        <i-mdi-face-recognition
          class="text-20px"
          :class="{ 'text-[#13987f] drop-shadow-[0_0_8px_rgba(19,152,127,0.8)]': isFaceTracking }" />
      </div>

      <div class="w-20px h-2px bg-white/40 rounded-full my-1"></div>

      <div title="专注番茄钟" class="action-btn group" @click="startPomodoro">
        <i-mdi-timer-sand class="text-20px" />
      </div>
      <div title="环境音乐 (开关)" class="action-btn group" @click="playMusic">
        <i-mdi-music-note
          class="text-20px"
          :class="{ 'text-[#13987f] drop-shadow-[0_0_8px_rgba(19,152,127,0.8)] animate-bounce': isListeningMusic }" />
      </div>
      <div
        title="左键记灵感 / 右键看记录"
        class="action-btn group"
        @click="quickMemo"
        @contextmenu.prevent="showMemoList = true">
        <i-mdi-notebook-edit class="text-20px" />
      </div>

      <div class="w-20px h-2px bg-white/40 rounded-full my-1"></div>

      <div title="切换形象" class="action-btn group" @click="switchLive2dModel">
        <i-mdi-account-switch class="text-20px" />
      </div>
      <div title="鼠标穿透 (防误触) [CommandOrControl+Shift+R]" class="action-btn group" @click="toggleClickThrough">
        <i-mdi-mouse-off class="text-20px" :class="{ 'text-red-400': isClickThrough }" />
      </div>
      <div title="去休息吧 (休眠)" class="action-btn group" @click="sleepMode">
        <i-mdi-power-sleep class="text-20px" />
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="showMemoInput"
        class="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 w-[260px] p-4 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl flex flex-col gap-2">
        <div class="flex items-center gap-2 text-[#13987f] font-bold text-14px px-1">
          <i-mdi-notebook-edit />
          <span>灵感捕捉</span>
        </div>

        <n-input
          ref="memoInputRef"
          type="textarea"
          placeholder="一闪而过的念头..."
          v-model:value="memoText"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :style="{ backgroundColor: 'rgba(255,255,255,0.5)' }"
          @keydown="handleKeydown" />

        <div class="text-[11px] text-gray-500/80 text-center mt-1">
          按
          <kbd class="bg-gray-100 px-1 rounded">Enter</kbd>
          保存 · 按
          <kbd class="bg-gray-100 px-1 rounded">Esc</kbd>
          取消
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="isPomodoroActive"
        class="absolute bottom-4 left-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-14px font-mono tracking-wider z-10 pointer-events-none flex items-center gap-2 shadow-lg">
        <i-mdi-timer-sand class="animate-pulse text-16px text-[#13987f]" />
        <span>{{ formatSecondsToTimeStr(pomodoroTimeLeft) }}</span>
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="showConvertMenu"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[250px] p-5 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-2xl flex flex-col gap-3">
        <div class="flex flex-col items-center gap-1">
          <i-mdi-file-swap class="text-32px text-[#13987f]" />
          <span class="text-14px font-bold text-gray-800 text-center break-all">
            {{ getFileName(droppedFilePath) }}
          </span>
          <span class="text-12px text-gray-500">你想让我把它变成什么格式？</span>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-2">
          <n-button
            v-for="ext in availableFormats"
            class="py-1.5 px-2 bg-black/5 hover:bg-[#13987f] hover:text-white rounded-lg text-12px font-bold transition-colors shadow-sm"
            :key="ext"
            @click="startConversion(ext)">
            {{ ext.toUpperCase() }}
          </n-button>
        </div>

        <n-button class="mt-2 text-12px text-gray-400 hover:text-gray-600 transition-colors" @click="cancelConversion">
          取消
        </n-button>
      </div>
    </transition>
    <canvas
      ref="canvasRef"
      class="block cursor-grab active:cursor-grabbing transition-all duration-1000"
      :class="{ 'opacity-50 brightness-50': isSleeping }"
      @mousedown="startDrag"></canvas>
    <n-drawer placement="right" v-model:show="showMemoList" :width="250">
      <n-drawer-content title="💡 灵感碎片" closable>
        <n-empty v-if="agentStore.memos.length === 0" description="脑子里空空的~" class="mt-10" />

        <n-flex vertical gap="12" v-else>
          <div
            v-for="memo in agentStore.memos"
            class="p-3 bg-black/5 rounded-lg relative group transition-all hover:bg-black/10"
            :key="memo.id">
            <p class="text-14px text-gray-700 m-0 whitespace-pre-wrap leading-relaxed">{{ memo.content }}</p>

            <div class="flex justify-between items-center mt-2">
              <span class="text-11px text-gray-400">{{ formatTime(memo.timestamp) }}</span>
              <i-mdi-delete
                title="删除"
                class="opacity-0 group-hover:opacity-100 cursor-pointer text-red-400 hover:text-red-600 transition-opacity"
                @click="agentStore.deleteMemo(memo.id)" />
            </div>
          </div>
        </n-flex>
      </n-drawer-content>
    </n-drawer>
  </main>
  <video ref="videoRef" autoplay playsinline class="hidden"></video>
</template>

<script setup lang="ts">
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { LogicalPosition } from "@tauri-apps/api/window";
import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { getAllWebviewWindows, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { EventEnum, TauriCommandEnum } from "@/enums";
import { useLive2D } from "@/hooks/useLive2D";
import { useAgentStore } from "@/stores/agent";
import { useLocalTTS } from "@/hooks/useLocalTTS";
import { formatSecondsToTimeStr, formatTime } from "@/utils/FormattingUtils";

const agentStore = useAgentStore();
const appWindow = getCurrentWebviewWindow();
const { readAloud, stop: stopSpeaking, isPlaying } = useLocalTTS();
const { initEngine, loadModel, setFaceTracking, triggerMotion, setFocus, live2dModel } = useLive2D();

const farewellPhrases = [
  "那我先撤啦，换个伙伴来陪你~",
  "拜拜咯，下个小可爱马上就来！",
  "换班时间到！一会见~",
  "溜了溜了，希望你会喜欢新朋友！",
  "我去休息啦，马上叫别人来接班~"
];

let bubbleTimer: any = null;
let typingTimer: any = null;
let lipSyncInterval: any = null;
let pomodoroTimer: any = null;
let isDragging = false;
let unlistenAudio: any = null;
let dragOffset = { x: 0, y: 0 };
let mediaRecorder: MediaRecorder | null = null;
let wsEventListener: any = null;
// VAD 静音检测所需变量
let vadAudioCtx: AudioContext | null = null;
let vadAnalyser: AnalyserNode | null = null;
let vadDataArray: Uint8Array | null = null;
let lastSpeakTime = 0;
let camera: Camera | null = null;
let faceMesh: FaceMesh | null = null;
// 面部捕捉 (VTuber 模式)
const isFaceTracking = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const isPomodoroActive = ref(false);
const pomodoroTimeLeft = ref(25 * 60);
const isSleeping = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);
// 气泡相关
const showBubble = ref(false);
const bubbleText = ref("");
const containerRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);
const isScrolling = ref(false);
const scrollDuration = ref("5s");
const isTyping = ref(false);
// 备忘录与工具状态
const showMemoInput = ref(false);
const memoText = ref("");
const memoInputRef = ref<any>(null);
const showMemoList = ref(false);
const isClickThrough = ref(false);
const isVisionActive = ref(false);
const currentVisualContext = ref("");
const isListeningMusic = ref(false);
const isVoiceChatting = ref(false);
const showConvertMenu = ref(false);
const droppedFilePath = ref("");
const availableFormats = ref<string[]>([]);
const isConverting = ref(false);

/**
 * 从文件路径中提取文件名
 * @param path 文件路径
 * @returns 文件名
 */
const getFileName = (path: string) => path.split(/[/\\]/).pop() || "未知文件";

/**
 * 根据文件后缀推断可以转换的格式
 * @param ext 文件后缀
 * @returns 可以转换的格式列表
 */
const getFormatsByExt = (ext: string) => {
  ext = ext.toLowerCase();
  const imageExts = ["png", "jpg", "jpeg", "webp", "bmp", "ico"];
  const videoExts = ["mp4", "webm", "avi", "mov"];
  const audioExts = ["mp3", "wav", "ogg", "flac"];

  if (imageExts.includes(ext)) return imageExts.filter((e) => e !== ext);
  if (videoExts.includes(ext)) return [...videoExts.filter((e) => e !== ext), "gif", "mp3"];
  if (audioExts.includes(ext)) return audioExts.filter((e) => e !== ext);
  return [];
};

/** 取消转换 */
const cancelConversion = () => {
  showConvertMenu.value = false;
  droppedFilePath.value = "";
};

/**
 * 开始转换
 * @param targetExt 目标格式
 */
const startConversion = async (targetExt: string) => {
  showConvertMenu.value = false;
  isConverting.value = true;

  speak(`好的！正在拼命施展魔法，把文件转成 ${targetExt.toUpperCase()} 格式...`);
  triggerMotion("TapBody");

  try {
    const outPath = await invoke<string>(TauriCommandEnum.CONVERT_FILE, {
      sourcePath: droppedFilePath.value,
      targetExt
    });
    speak("转换完成啦！文件已经保存在原来所在的目录咯~");
    console.log("转换成功，文件路径:", outPath);
  } catch (error) {
    console.error("转换失败:", error);
    speak(typeof error === "string" ? error : "哎呀，魔法失效了，转换失败...");
  } finally {
    isConverting.value = false;
  }
};

/**
 * 计算两点之间真实 2D 物理距离的辅助函数
 * @param p1 点1
 * @param p2 点2
 * @returns 两点之间的距离
 */
const calcDistance = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

/** 切换面部捕捉 (VTuber 模式) */
const toggleFaceTracking = async () => {
  if (isSleeping.value) return;
  isFaceTracking.value = !isFaceTracking.value;

  if (isFaceTracking.value) {
    speak("正在建立神经链接，初次加载 AI 模型需要几十秒，请稍等哦...");
    setFocus(0, 0);

    faceMesh = new FaceMesh({
      locateFile: (file) => `https://fastly.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    let isModelReallyReady = false;

    faceMesh.onResults((results) => {
      if (!isFaceTracking.value) return;

      if (!isModelReallyReady) {
        isModelReallyReady = true;
        speak("神经链接完成！动动脑袋和嘴巴试试看？");
      }

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const chin = landmarks[152];
        const topHead = landmarks[10];

        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const eyeDistX = calcDistance(leftEye, rightEye);
        const targetX = Math.max(-30, Math.min(30, ((nose.x - eyeCenterX) / eyeDistX) * -150));

        const verticalCenter = (chin.y + topHead.y) / 2;
        const faceHeight = chin.y - topHead.y;
        const targetY = Math.max(-30, Math.min(30, ((nose.y - verticalCenter) / faceHeight) * -200));

        const rollAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
        const targetZ = Math.max(-30, Math.min(30, rollAngle * (180 / Math.PI)));

        const leftEAR = calcDistance(landmarks[145], landmarks[159]) / calcDistance(landmarks[33], landmarks[133]);
        const rightEAR = calcDistance(landmarks[374], landmarks[386]) / calcDistance(landmarks[362], landmarks[263]);

        const mouthOpenDist = calcDistance(landmarks[13], landmarks[14]);
        const targetMouth = Math.max(0, Math.min(1, (mouthOpenDist / faceHeight - 0.015) * 15));
        setFaceTracking({
          x: targetX,
          y: targetY,
          z: targetZ,
          eyeL: leftEAR > 0.16 ? 1 : 0,
          eyeR: rightEAR > 0.16 ? 1 : 0,
          mouth: targetMouth
        });
      } else {
        setFaceTracking(null);
      }
    });

    try {
      await faceMesh.initialize();
      if (videoRef.value) {
        camera = new Camera(videoRef.value, {
          onFrame: async () => {
            if (faceMesh && isFaceTracking.value) await faceMesh.send({ image: videoRef.value! });
          },
          width: 480,
          height: 360
        });
        camera.start();
      }
    } catch (e) {
      speak("哎呀，AI 模型加载失败了，请检查一下网络哦。");
      isFaceTracking.value = false;
    }
  } else {
    speak("面部追踪已断开~");
    if (camera) {
      camera.stop();
      camera = null;
    }
    if (faceMesh) {
      faceMesh.close();
      faceMesh = null;
    }
    setFaceTracking(null);
    setFocus(0, 0);
  }
};

/** 开始随机口型动画 (根据 isPlaying 状态自动触发) */
const startRandomLipSync = () => {
  if (lipSyncInterval) clearInterval(lipSyncInterval);
  lipSyncInterval = setInterval(() => {
    if (!live2dModel.value?.internalModel?.coreModel) return;
    const value = Math.random() * 0.8;
    live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", value);
  }, 100);
};

/** 停止口型动画 */
const stopLipSync = () => {
  if (lipSyncInterval) {
    clearInterval(lipSyncInterval);
    lipSyncInterval = null;
  }
  if (live2dModel.value?.internalModel?.coreModel) {
    live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", 0);
  }
};

/**
 * 开始拖拽窗口
 * @param e 鼠标事件对象，包含初始点击位置
 */
const startDrag = (e: MouseEvent) => {
  isDragging = true;
  dragOffset = { x: e.clientX, y: e.clientY };
  window.addEventListener("pointermove", handleDrag);
  window.addEventListener("pointerup", stopDrag);
};

/**
 * 处理窗口拖拽
 * @param e 指针事件对象，包含当前鼠标位置
 */
const handleDrag = async (e: PointerEvent) => {
  if (!isDragging) return;
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  let newX = e.screenX - dragOffset.x;
  let newY = e.screenY - dragOffset.y;

  if (newX < 0) newX = 0;
  if (newY < 0) newY = 0;
  if (newX > screenWidth - winWidth - 10) newX = screenWidth - winWidth - 10;
  if (newY > screenHeight - winHeight) newY = screenHeight - winHeight;
  await appWindow.setPosition(new LogicalPosition(newX, newY));
};

/** 停止拖拽窗口 */
const stopDrag = () => {
  isDragging = false;
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
};

/**
 * 打字机效果
 * @param text 要打字的文本
 * @param onComplete 打字完成回调
 */
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

/** 检查是否需要跑马灯效果 */
const checkScroll = () => {
  if (!textRef.value || !containerRef.value) return;
  const textWidth = textRef.value.scrollWidth;
  const containerWidth = containerRef.value.clientWidth;

  if (textWidth > containerWidth + 2) {
    isScrolling.value = true;
    const distance = textWidth - containerWidth + 20;
    const duration = Math.max(3, distance / 40);
    scrollDuration.value = `${duration}s`;
    containerRef.value.style.setProperty("--scroll-distance", `-${distance}px`);
  } else {
    isScrolling.value = false;
    containerRef.value.style.removeProperty("--scroll-distance");
  }
};

/** 跑马灯滚动结束后，延迟隐藏气泡 */
const onScrollEnd = () => {
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    showBubble.value = false;
  }, 2000);
};

/**
 * 主交互函数：播放文本
 * @param text 要播放的文本
 */
const speak = async (text: string) => {
  showBubble.value = true;
  isScrolling.value = false;
  if (bubbleTimer) clearTimeout(bubbleTimer);
  if (typingTimer) clearInterval(typingTimer);

  bubbleText.value = "🤔...";
  isTyping.value = false;

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
  await readAloud(text);
};

/** 处理语音聊天 */
const handleVoiceChat = async () => {
  if (isSleeping.value) return;

  if (isVoiceChatting.value) {
    isVoiceChatting.value = false;
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    if (vadAudioCtx) {
      vadAudioCtx.close();
      vadAudioCtx = null;
    }
    if (wsEventListener) {
      wsEventListener();
      wsEventListener = null;
    }
    speak("连麦已断开，有需要随时叫我哦~");
    return;
  }

  try {
    speak("麦克风已接通，你可以直接跟我说话啦~");
    wsEventListener = await listen("websocket-event", (event: any) => {
      const wsEvent = event.payload;
      if (wsEvent.type === "messageReceived" && wsEvent.message.type === "AI_REPLY") {
        if (wsEvent.message.text) speak(wsEvent.message.text);
      }
    });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    vadAudioCtx = new AudioContext();
    const source = vadAudioCtx.createMediaStreamSource(stream);
    vadAnalyser = vadAudioCtx.createAnalyser();
    vadAnalyser.fftSize = 256;
    source.connect(vadAnalyser);
    vadDataArray = new Uint8Array(vadAnalyser.frequencyBinCount);

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0 && isVoiceChatting.value) {
        vadAnalyser!.getByteFrequencyData(vadDataArray as any);
        const sum = vadDataArray!.reduce((a, b) => a + b, 0);
        const avgVolume = sum / vadDataArray!.length;
        const now = Date.now();
        if (avgVolume > 10) lastSpeakTime = now;

        if (now - lastSpeakTime < 1500) {
          const buffer = await e.data.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          await invoke("ws_send_message", { params: { data: { type: "USER_AUDIO", audio: base64Audio } } });
        }
      }
    };
    mediaRecorder.start(500);
    isVoiceChatting.value = true;
  } catch (e) {
    speak("哎呀，麦克风没打开，或者网络不通哦...");
    isVoiceChatting.value = false;
  }
};

/** 捕获屏幕 */
const captureScreen = async () => {
  if (isSleeping.value) return;
  isVisionActive.value = !isVisionActive.value;
  if (isVisionActive.value) {
    speak("视觉模块已开启，我会留意你的屏幕哦~");
    triggerMotion("TapBody");
    try {
      const pos = await appWindow.outerPosition();
      const base64Data = await invoke<string>("screenshot", { x: pos.x, y: pos.y });
      currentVisualContext.value = `data:image/png;base64,${base64Data}`;
    } catch (error) {
      isVisionActive.value = false;
    }
  } else {
    speak("视觉模块已关闭，我不看啦~");
    currentVisualContext.value = "";
  }
};

/** Agent 键鼠接管 */
const operateKeyboard = async () => {
  if (isSleeping.value) return;
  speak("Agent 权限已确认！准备给你变个小魔术...");
  triggerMotion("TapBody");

  setTimeout(async () => {
    speak("请双手离开键盘和鼠标哦！3... 2... 1...");
    setTimeout(async () => {
      try {
        const screenW = window.screen.availWidth;
        const screenH = window.screen.availHeight;
        const centerX = Math.floor(screenW / 2);
        const centerY = Math.floor(screenH / 2);

        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX, y: centerY, click: false });
        await new Promise((r) => setTimeout(r, 500));
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX + 100, y: centerY, click: false });
        await new Promise((r) => setTimeout(r, 200));
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX + 100, y: centerY + 100, click: false });
        await new Promise((r) => setTimeout(r, 200));
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX, y: centerY + 100, click: false });
        await new Promise((r) => setTimeout(r, 200));
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX, y: centerY, click: true });
        await new Promise((r) => setTimeout(r, 500));
        await invoke(TauriCommandEnum.AGENT_TYPE_TEXT, { text: "Hello! I am HuaYan, your AI Desktop Agent!" });

        speak("操作完毕！我是不是越来越像个真正的人类了？");
      } catch (e) {
        speak("哎呀，系统底层好像不让我碰鼠标呢...");
      }
    }, 3000);
  }, 4000);
};

/** 启动番茄钟 */
const startPomodoro = () => {
  if (isPomodoroActive.value) {
    clearInterval(pomodoroTimer);
    isPomodoroActive.value = false;
    speak("番茄钟已取消，不要有压力，随时可以重新开始哦~");
    return;
  }
  isPomodoroActive.value = true;
  pomodoroTimeLeft.value = 25 * 60;
  speak("好的，接下来25分钟我会安静陪你，专注加油哦！");
  triggerMotion("TapBody");

  pomodoroTimer = setInterval(() => {
    if (pomodoroTimeLeft.value > 0) pomodoroTimeLeft.value--;
    else {
      clearInterval(pomodoroTimer);
      isPomodoroActive.value = false;
      speak("时间到啦！辛苦了，站起来活动一下，喝口水吧~");
    }
  }, 1000);
};

/** 跟随音乐 */
const playMusic = async () => {
  if (isSleeping.value) return;
  isListeningMusic.value = !isListeningMusic.value;

  if (isListeningMusic.value) {
    speak("音乐雷达已开启，放首动感的歌试试吧~");
    try {
      await invoke(TauriCommandEnum.TOGGLE_SYSTEM_AUDIO_LISTEN, { enable: true });
      let smoothedEnergy = 0;
      unlistenAudio = await listen<number>("system-audio-level", (event) => {
        if (!live2dModel.value?.internalModel?.coreModel) return;
        const rms = event.payload;
        const targetEnergy = Math.min(1.0, Math.max(0, rms * 2.5 > 0.03 ? rms * 2.5 : 0));
        smoothedEnergy += (targetEnergy - smoothedEnergy) * 0.2;

        const time = Date.now() / 300;
        const swing = Math.sin(time) * 15 * smoothedEnergy;

        live2dModel.value.internalModel.coreModel.setParameterValueById("ParamBodyAngleY", swing);
        live2dModel.value.internalModel.coreModel.setParameterValueById("ParamBodyAngleZ", swing * 0.5);
        live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", smoothedEnergy * 0.8);
      });
    } catch (e) {
      isListeningMusic.value = false;
      speak(typeof e === "string" ? e : "哎呀，抓不到系统的声音呢...");
    }
  } else {
    speak("音乐雷达已关闭~");
    try {
      await invoke(TauriCommandEnum.TOGGLE_SYSTEM_AUDIO_LISTEN, { enable: false });
    } catch (e) {}
    if (unlistenAudio) {
      unlistenAudio();
      unlistenAudio = null;
    }
    if (live2dModel.value) {
      live2dModel.value.internalModel.coreModel.setParameterValueById("ParamBodyAngleY", 0);
      live2dModel.value.internalModel.coreModel.setParameterValueById("ParamBodyAngleZ", 0);
      live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", 0);
    }
  }
};

/** 快速记事 */
const quickMemo = async () => {
  if (isSleeping.value) return;
  showMemoInput.value = true;
  memoText.value = "";
  speak("想到什么啦？快写下来~");
  await nextTick();
  memoInputRef.value?.focus();
};

/** 隐藏记事框 */
const hideMemo = () => {
  showMemoInput.value = false;
  memoText.value = "";
};

/** 处理键盘事件 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    if (e.shiftKey) return;
    e.preventDefault();
    saveMemo();
  } else if (e.key === "Escape") hideMemo();
};

/** 保存记事 */
const saveMemo = () => {
  if (!memoText.value.trim()) {
    hideMemo();
    return;
  }
  agentStore.addMemo(memoText.value);
  hideMemo();
  speak("记下来啦，放心交给我吧！");
  triggerMotion("TapBody");
};

/** 切换模型 */
const switchLive2dModel = () => {
  const randomPhrase = farewellPhrases[Math.floor(Math.random() * farewellPhrases.length)];
  speak(randomPhrase);
  setTimeout(() => {
    agentStore.nextLive2dModel();
  }, 3000);
};

/** 切换点击穿透 */
const toggleClickThrough = async () => {
  isClickThrough.value = !isClickThrough.value;
  await appWindow.setIgnoreCursorEvents(isClickThrough.value);

  if (isClickThrough.value) {
    if (canvasRef.value) canvasRef.value.style.opacity = "0.7";
    speak("已开启防误触，现在你点不到我啦！按下 CommandOrControl+Shift+R 随时解除哦~");
  } else {
    if (canvasRef.value) canvasRef.value.style.opacity = "1";
    speak("实体化恢复！我又可以被摸到啦~");
  }
};

/** 进入睡眠模式 */
const sleepMode = () => {
  if (isSleeping.value) return;
  isSleeping.value = true;
  speak("我先去眯一会儿，工作加油哦，点我就可以唤醒我~");
  setFocus(0, 0);
};

watch(isPlaying, (val) => {
  if (val) startRandomLipSync();
  else stopLipSync();
});

onMounted(async () => {
  if (!canvasRef.value) return;

  const windows = await getAllWebviewWindows();
  const isLoginWindowAlive = windows.some((w) => w.label === "login");

  const screenW = window.screen.availWidth;
  const screenH = window.screen.availHeight;
  await appWindow.setPosition(new LogicalPosition(screenW - window.outerWidth - 10, screenH - window.outerHeight));

  if (agentStore.isOpenAgent && !isLoginWindowAlive) await appWindow.show();
  else await appWindow.hide();

  const unlistenLogin = await listen(EventEnum.LOGIN_SUCCESS, async () => {
    if (agentStore.isOpenAgent) {
      await appWindow.show();
      speak("欢迎回来！我已经准备好陪你工作啦~");
      triggerMotion("TapBody");
    }
  });

  const unlistenLogout = await listen(EventEnum.LOGOUT, async () => {
    await appWindow.hide();
  });

  (window as any).__unlistenLogin = unlistenLogin;
  (window as any).__unlistenLogout = unlistenLogout;

  watch(
    () => agentStore.isOpenAgent,
    async (newVal) => {
      if (newVal) {
        await appWindow.show();
        speak("我回来啦！有什么需要帮忙的吗？");
        triggerMotion("TapBody");
      } else {
        speak("那我先去休息啦，有事在设置里叫我哦~");
        setTimeout(async () => {
          await appWindow.hide();
        }, 3000);
      }
    }
  );

  initEngine(canvasRef.value);
  await loadModel(agentStore.currentLive2dUrl, (hitAreas) => {
    if (isSleeping.value) {
      isSleeping.value = false;
      speak("唔...主人你叫我呀，我醒啦！");
      return;
    }
    if (isPomodoroActive.value) {
      const focusQuotes = ["嘘，专心工作哦~", "我在看着你呢，别摸鱼啦！", "快写代码，写完再陪你玩~"];
      speak(focusQuotes[Math.floor(Math.random() * focusQuotes.length)]);
      return;
    }
    if (hitAreas.includes("Body")) {
      triggerMotion("TapBody");
      speak("有什么我可以帮你的吗？");
    }
  });

  watch(
    () => agentStore.currentLive2dUrl,
    (newUrl) => loadModel(newUrl)
  );

  const unlistenMouse = await listen<[number, number]>("global-mouse-move", async (event) => {
    if (!live2dModel.value || isSleeping.value || isFaceTracking.value) return;
    try {
      const [globalPhysicalX, globalPhysicalY] = event.payload;
      const pos = await appWindow.outerPosition();
      const factor = await appWindow.scaleFactor();
      setFocus(globalPhysicalX / factor - pos.x / factor, globalPhysicalY / factor - pos.y / factor);
    } catch (e) {}
  });

  (window as any).__unlistenMouse = unlistenMouse;

  try {
    const shortcutKey = "CommandOrControl+Shift+R";
    if (await isRegistered(shortcutKey)) await unregister(shortcutKey);
    await register(shortcutKey, (event) => {
      if (event.state === "Pressed") toggleClickThrough();
    });
  } catch (e) {
    console.error("全局快捷键强绑失败:", e);
  }

  const unlistenDragEnter = await listen("tauri://drag-enter", () => {
    if (isSleeping.value || isConverting.value) return;
    triggerMotion("TapBody");
  });

  const unlistenDragDrop = await listen<{ paths: string[] }>("tauri://drag-drop", (event) => {
    if (isSleeping.value || isConverting.value) return;
    const paths = event.payload.paths;
    if (paths && paths.length > 0) {
      droppedFilePath.value = paths[0];
      const formats = getFormatsByExt(paths[0].split(".").pop() || "");
      if (formats.length > 0) {
        availableFormats.value = formats;
        showConvertMenu.value = true;
        speak("哇，是给我的文件吗？你想把它变成什么样子？");
      } else {
        speak("呜...这种格式的文件我还不认识呢，换个图片或视频试试吧？");
      }
    }
  });

  (window as any).__unlistenDragEnter = unlistenDragEnter;
  (window as any).__unlistenDragDrop = unlistenDragDrop;
});

onUnmounted(async () => {
  stopSpeaking();
  stopLipSync();
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
  if (typingTimer) clearInterval(typingTimer);
  if (bubbleTimer) clearTimeout(bubbleTimer);

  if ((window as any).__unlistenMouse) (window as any).__unlistenMouse();
  if ((window as any).__unlistenLogin) (window as any).__unlistenLogin();
  if ((window as any).__unlistenLogout) (window as any).__unlistenLogout();

  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  if (vadAudioCtx) vadAudioCtx.close();
  if (wsEventListener) wsEventListener();

  try {
    await unregister("CommandOrControl+Shift+R");
  } catch (e) {}
  if (camera) camera.stop();
  if (faceMesh) faceMesh.close();

  if ((window as any).__unlistenDragEnter) (window as any).__unlistenDragEnter();
  if ((window as any).__unlistenDragDrop) (window as any).__unlistenDragDrop();
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

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #f0f0f0; // 非悬浮亮灰图标
  transition: all 0.3s ease-out; // 更自然的过渡效果

  filter: drop-shadow(0 0 4px rgba(19, 152, 127, 0.4));

  &:hover {
    color: #13987f; // 图标变主题绿
    // 光晕加深，微放
    filter: drop-shadow(0 0 8px rgba(19, 152, 127, 0.8));
    transform: translateY(-2px) scale(1.05); // 上浮并微小缩放，灵动
  }

  &:active {
    // 微沉，光晕变淡，模拟点击压力感
    transform: translateY(1px) scale(1);
    filter: drop-shadow(0 0 2px rgba(19, 152, 127, 0.2));
  }
}

.toolbar-container {
  /* 隐藏 Firefox 和 IE 的滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;

  /* 隐藏 Chrome, Safari 和 Opera 的滚动条 */
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
