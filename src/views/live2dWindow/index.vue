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
      class="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 items-center transition-opacity duration-500">
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
</template>

<script setup lang="ts">
import * as PIXI from "pixi.js";
import { listen } from "@tauri-apps/api/event";
import { Live2DModel } from "pixi-live2d-display";
import { LogicalPosition } from "@tauri-apps/api/window";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { getAllWebviewWindows, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { EventEnum, TauriCommandEnum } from "@/enums";
import { useAgentStore } from "@/stores/agent.ts";
import { formatSecondsToTimeStr, formatTime } from "@/utils/FormattingUtils";

const agentStore = useAgentStore();
const appWindow = getCurrentWebviewWindow();

const farewellPhrases = [
  "那我先撤啦，换个伙伴来陪你~",
  "拜拜咯，下个小可爱马上就来！",
  "换班时间到！一会见~",
  "溜了溜了，希望你会喜欢新朋友！",
  "我去休息啦，马上叫别人来接班~"
];
// 挂载 PIXI 到 window (插件必需)
(window as any).PIXI = PIXI;
let bubbleTimer: any = null;
let typingTimer: any = null;
let lipSyncInterval: any = null;
let kokoroTtsInstance: any = null;
let pomodoroTimer: any = null;
const synth = window.speechSynthesis; // 浏览器原生TTS
let isDragging = false;
let pixiApp: PIXI.Application | null = null;
let initPromise: Promise<void> | null = null;
let unlistenAudio: any = null;
let dragOffset = { x: 0, y: 0 };
let mediaRecorder: MediaRecorder | null = null;
let wsEventListener: any = null;
// VAD 静音检测所需变量
let vadAudioCtx: AudioContext | null = null;
let vadAnalyser: AnalyserNode | null = null;
let vadDataArray: Uint8Array | null = null;
let lastSpeakTime = 0; // 最后一次大声说话的时间戳
const ttsWorker = new Worker(new URL("@/workers/kokoro.worker.ts", import.meta.url), { type: "module" });

const isPomodoroActive = ref(false);
const pomodoroTimeLeft = ref(25 * 60); // 25分钟 (1500秒)
// 是否处于休眠状态
const isSleeping = ref(false);
const isTtsLoading = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const live2dModel = ref<any>(null);
// 气泡相关
const showBubble = ref(false);
const bubbleText = ref("");
const containerRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);
const isScrolling = ref(false);
const scrollDuration = ref("5s");
const isTyping = ref(false);
// 备忘录
const showMemoInput = ref(false);
const memoText = ref("");
const memoInputRef = ref<any>(null);
const showMemoList = ref(false);
const isClickThrough = ref(false);
const isVisionActive = ref(false);
const currentVisualContext = ref("");
const isListeningMusic = ref(false);
const isVoiceChatting = ref(false);

// 音频与口型相关
const audioContext = shallowRef<AudioContext | null>(null);
const audioSource = shallowRef<AudioBufferSourceNode | null>(null);

/** 初始化双引擎模型 */
const initKokoroTTS = async () => {
  if (kokoroTtsInstance) return;

  if (!initPromise) {
    initPromise = (async () => {
      isTtsLoading.value = true;
      try {
        console.log("后台线程: 开始加载 Kokoro 模型...");
        await runInWorker({ action: "init" });
        kokoroTtsInstance = true;
        console.log("✅ Kokoro 模型后台加载成功！");
      } catch (error) {
        console.error("❌ 后台模型加载失败:", error);
        initPromise = null;
        throw error;
      } finally {
        isTtsLoading.value = false;
      }
    })();
  }
  await initPromise;
};

/**
 * 使用 Piper 引擎生成语音
 * @param text 要播放的文本
 * @param model 当前使用的语音模型
 * @param onReady 音频准备完毕的回调函数
 */
const playPiperTTS = async (text: string, model: any, onReady: () => void) => {
  const lang = detectLanguage(text);
  // 1. 获取模型根目录
  const baseModelsDir: string = await invoke(TauriCommandEnum.GET_MODELS_DIR);
  const separator = baseModelsDir.includes("\\") ? "\\" : "/";
  // 2. 直接从传进来的 model 拿 fileName
  const modelPath = `${baseModelsDir}${separator}${model.fileName}`;
  const outputPath = `${baseModelsDir}${separator}temp_piper.wav`;
  console.log(`后台线程: Piper 使用 [${model.name}] 播报${lang}...`);
  // 3. 呼叫 Rust 端生成 .wav 文件
  await invoke(TauriCommandEnum.GENERATE_PIPER_SPEECH, {
    text,
    modelPath,
    outputPath
  });
  // 4. 读取刚生成的音频文件
  const audioUrl = convertFileSrc(outputPath);
  // 加上时间戳，强制突破浏览器的强缓存，否则永远只播第一句！
  const response = await fetch(`${audioUrl}?t=${Date.now()}`);
  if (!response.ok) throw new Error("读取音频文件失败");
  const arrayBuffer = await response.arrayBuffer();
  // 5. 解码为 AudioBuffer 并交给口型同步系统播放
  if (!audioContext.value) audioContext.value = new AudioContext();
  const audioBuffer = await audioContext.value.decodeAudioData(arrayBuffer);
  onReady();
  playAudioBufferWithLipSync(audioBuffer);
};

/**
 * 在 worker 中运行指定任务
 * @param payload 要发送到 worker 的任务数据
 */
const runInWorker = (payload: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      if (e.data.action === payload.action) {
        ttsWorker.removeEventListener("message", handler); // 用完就清理监听器
        if (e.data.status === "success") {
          resolve(e.data);
        } else {
          reject(new Error(e.data.error));
        }
      }
    };
    ttsWorker.addEventListener("message", handler);
    ttsWorker.postMessage(payload);
  });
};

/**
 * 播放 AudioBuffer 并同步口型
 * @param audioBuffer 要播放的音频缓冲区
 */
const playAudioBufferWithLipSync = (audioBuffer: AudioBuffer) => {
  stopSpeaking();
  const newSource = audioContext.value!.createBufferSource();
  newSource.buffer = audioBuffer;
  audioSource.value = newSource;
  const analyser = audioContext.value!.createAnalyser();
  analyser.fftSize = 256;
  newSource.connect(analyser);
  analyser.connect(audioContext.value!.destination);
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
  newSource.onended = () => stopSpeaking();
};

/**
 * 使用纯前端 Kokoro 生成英文音频
 * @param text 要播放的文本
 * @param model 当前使用的语音模型
 * @param onReady 音频准备完毕的回调函数
 */
const playLocalModelTTS = async (text: string, model: any, onReady: () => void) => {
  await initKokoroTTS();
  // 获取本地模型的根目录绝对路径
  const baseModelsDir: string = await invoke(TauriCommandEnum.GET_MODELS_DIR);
  const assetBaseUrl = convertFileSrc(baseModelsDir);
  const currentVoiceId = model.voiceId || "af_bella";
  console.log(`后台线程: Kokoro 使用 [${currentVoiceId}] 播报英文...`);

  // 把动态的 voiceId 传给 Worker
  const result = await runInWorker({
    action: "generate",
    text,
    voiceId: currentVoiceId,
    assetBaseUrl
  });

  if (!audioContext.value) audioContext.value = new AudioContext();
  const audioBuffer = audioContext.value.createBuffer(1, result.audio.length, result.sampling_rate);
  audioBuffer.copyToChannel(result.audio, 0);

  onReady();
  playAudioBufferWithLipSync(audioBuffer);
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

/** 停止拖拽窗口 */
const stopDrag = () => {
  isDragging = false;
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
};

/** 停止Speaking */
const stopSpeaking = () => {
  // 1. 停止后端音频
  if (audioSource.value) {
    try {
      audioSource.value.stop();
    } catch {}
    audioSource.value = null;
  }
  // 2. 停止原生 TTS
  if (synth && typeof synth.cancel === "function") {
    synth.cancel();
  }

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

/**
 * 播放系统 TTS (降级方案 - 随机口型)
 * @param text 要播放的文本
 */
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
};

/**
 * 调用 Rust 后端 TTS
 * @param text 要播放的文本
 */
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

/**
 * 自动识别文本语言
 * @param text 要识别的文本
 * @returns 识别到的语言，"zh" 或 "en"
 */
const detectLanguage = (text: string): string => {
  // 正则表达式：只要包含任何中文字符，就认为是中文
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return "zh";
  }
  // 否则默认英文
  return "en";
};

/** 开始随机口型动画 */
const startRandomLipSync = () => {
  if (lipSyncInterval) clearInterval(lipSyncInterval);
  lipSyncInterval = setInterval(() => {
    if (!live2dModel.value?.internalModel?.coreModel) return;
    const value = Math.random() * 0.8;
    live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", value);
  }, 100);
};

/**
 * 加载或切换 Live2D 模型
 * @param modelUrl 模型的 json 地址
 */
const loadLive2dModel = async (modelUrl: string) => {
  if (!pixiApp) return;

  try {
    // 1. 如果舞台上已经有旧模型，先销毁它释放内存，防止重叠
    if (live2dModel.value) {
      pixiApp.stage.removeChild(live2dModel.value);
      live2dModel.value.destroy();
      live2dModel.value = null;
    }

    // 2. 加载新模型
    const model = await Live2DModel.from(modelUrl);
    // 劫持底层 focus 方法，彻底切断所有视线追踪（包括插件自带的）
    const originalFocus = model.focus.bind(model);
    model.focus = (x: number, y: number, ...args: any[]) => {
      if (isSleeping.value) {
        // 如果在睡觉，不管是谁发来的转头指令，一律强制坐标归零，锁死正前方
        originalFocus(0, 0, ...args);
      } else {
        // 醒着的时候，正常放行
        originalFocus(x, y, ...args);
      }
    };
    live2dModel.value = model;
    pixiApp.stage.addChild(model);

    // 3. 布局与自适应适配
    const updateLayout = () => {
      const screenW = pixiApp!.renderer.screen.width;
      const screenH = pixiApp!.renderer.screen.height;

      model.anchor.set(0, 0); // 锚点左上角
      const rawWidth = model.internalModel.originalWidth || model.width;
      const rawHeight = model.internalModel.originalHeight || model.height;
      const scaleX = screenW / rawWidth;
      const scaleY = (screenH * 0.9) / rawHeight;
      const scale = Math.min(scaleX, scaleY);

      model.scale.set(scale);
      model.x = (screenW - model.width) / 2;
      model.y = screenH - model.height;
    };

    updateLayout();
    pixiApp.renderer.on("resize", updateLayout);

    // 4. 重新绑定点击互动事件
    model.on("hit", (hitAreas) => {
      // 如果正在睡觉，点击任何地方都会唤醒她
      if (isSleeping.value) {
        isSleeping.value = false;
        speak("唔...主人你叫我呀，我醒啦！");
        return; // 唤醒后直接结束，不触发日常对话
      }
      // 如果正在专注番茄钟，点击会触发简短提醒，而不是日常闲聊
      if (isPomodoroActive.value) {
        // 随机抽一句简短的鼓励/提醒，防止 TTS 声音太长打断思路
        const focusQuotes = ["嘘，专心工作哦~", "我在看着你呢，别摸鱼啦！", "快写代码，写完再陪你玩~"];
        speak(focusQuotes[Math.floor(Math.random() * focusQuotes.length)]);
        return;
      }
      // 日常点击身体的互动
      if (hitAreas.includes("Body")) {
        model.motion("TapBody");
        speak("有什么我可以帮你的吗？");
      }
    });
  } catch (e) {
    console.error("Live2D Load Failed:", e);
  }
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
    const distance = textWidth - containerWidth + 20; // +20 缓冲，防止切字
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

  // 让气泡先显示“思考中”，掩盖大模型生成的耗时
  bubbleText.value = "🤔...";
  isTyping.value = false;

  const startVisuals = () => {
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

  // 2. 音频生成智能路由管道
  if (live2dModel.value) {
    try {
      // 检测语言 ("zh" 还是 "en")
      const lang = detectLanguage(text);
      // 去字典里拿当前语言启用的模型
      const targetModel = agentStore.activeModels[lang];
      if (!targetModel) {
        throw new Error(`当前没有开启 [${lang === "zh" ? "中文" : "英文"}] 的本地模型，触发降级`);
      }
      // 根据拿到的模型引擎，分发给不同通道
      if (targetModel.engine === "Piper") {
        await playPiperTTS(text, targetModel, startVisuals);
      } else if (targetModel.engine === "Kokoro") {
        await playLocalModelTTS(text, targetModel, startVisuals);
      } else {
        throw new Error("未知的 AI 引擎");
      }
    } catch (e1) {
      console.warn("本地 TTS 跳过/失败，降级到系统 TTS:", e1);
      // 🥈 降级路线：原生 TTS兜底
      playSystemTTS(text);
      startVisuals();
    }
  } else {
    startVisuals();
  }
};

// --- AI 能力 ---
const handleVoiceChat = async () => {
  if (isSleeping.value) return;

  // 1. 关闭连麦
  if (isVoiceChatting.value) {
    isVoiceChatting.value = false;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
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

  // 2. 开启连麦
  try {
    speak("麦克风已接通，你可以直接跟我说话啦~");
    // === 🔽 下行：监听后端大模型发来的消息 ===
    wsEventListener = await listen("websocket-event", (event: any) => {
      const wsEvent = event.payload;
      // 过滤出收到消息的事件
      if (wsEvent.type === "messageReceived") {
        const msg = wsEvent.message;
        // 假设后端返回: { "type": "AI_REPLY", "text": "你好呀" }
        if (msg.type === "AI_REPLY" && msg.text) {
          speak(msg.text); // 直接调用你现成的 speak 函数播报！
        }
      }
    });
    // === 🔼 上行：获取麦克风流并做静音检测 (VAD) ===
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // 接入 VAD 分析器
    vadAudioCtx = new AudioContext();
    const source = vadAudioCtx.createMediaStreamSource(stream);
    vadAnalyser = vadAudioCtx.createAnalyser();
    vadAnalyser.fftSize = 256;
    source.connect(vadAnalyser);
    vadDataArray = new Uint8Array(vadAnalyser.frequencyBinCount);
    mediaRecorder = new MediaRecorder(stream);
    // 每 500ms 触发一次切片发送
    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0 && isVoiceChatting.value) {
        // 计算当前这 0.5 秒内的平均音量能量
        vadAnalyser!.getByteFrequencyData(vadDataArray as any);
        const sum = vadDataArray!.reduce((a, b) => a + b, 0);
        const avgVolume = sum / vadDataArray!.length;
        const now = Date.now();
        const SILENCE_THRESHOLD = 10; // 阈值：过滤风扇/底噪，人声通常大于 10
        const TAIL_MARGIN_MS = 1500; // 拖尾：停止说话后继续发送 1.5 秒，防断句
        if (avgVolume > SILENCE_THRESHOLD) {
          lastSpeakTime = now;
        }
        // 如果在说话，或者在停顿拖尾期内，则发送！
        if (now - lastSpeakTime < TAIL_MARGIN_MS) {
          const buffer = await e.data.arrayBuffer();
          // 转成 Base64
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          // 调用 Rust 的 ws_send_message 接口发送
          await invoke("ws_send_message", {
            params: {
              data: {
                type: "USER_AUDIO",
                audio: base64Audio
              }
            }
          });
        }
      }
    };
    mediaRecorder.start(500); // 启动录制，每 500ms 吐一次切片
    isVoiceChatting.value = true;
  } catch (e) {
    console.error("连麦初始化失败:", e);
    speak("哎呀，麦克风没打开，或者网络不通哦...");
    isVoiceChatting.value = false;
  }
};

const captureScreen = async () => {
  if (isSleeping.value) return;
  // 切换状态
  isVisionActive.value = !isVisionActive.value;
  if (isVisionActive.value) {
    speak("视觉模块已开启，我会留意你的屏幕哦~");
    if (live2dModel.value) live2dModel.value.motion("TapBody");
    try {
      const pos = await appWindow.outerPosition();
      const base64Data = await invoke<string>("screenshot", { x: pos.x, y: pos.y });
      currentVisualContext.value = `data:image/png;base64,${base64Data}`;
    } catch (error) {
      console.error("截图失败:", error);
      isVisionActive.value = false;
    }
  } else {
    speak("视觉模块已关闭，我不看啦~");
    currentVisualContext.value = "";
  }
};

// --- Agent 键鼠接管 ---
const operateKeyboard = async () => {
  if (isSleeping.value) return;

  speak("Agent 权限已确认！准备给你变个小魔术...");

  if (live2dModel.value) {
    live2dModel.value.motion("TapBody"); // 让她动一下，表示发功
  }

  // 延迟 4 秒执行，留给用户“双手离开键盘”的准备时间
  setTimeout(async () => {
    speak("请双手离开键盘和鼠标哦！3... 2... 1...");

    setTimeout(async () => {
      try {
        // 获取屏幕中心坐标
        const screenW = window.screen.availWidth;
        const screenH = window.screen.availHeight;
        const centerX = Math.floor(screenW / 2);
        const centerY = Math.floor(screenH / 2);

        // 1. 指挥 Rust 抢夺鼠标控制权，瞬间移动到屏幕正中央！
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX, y: centerY, click: false });

        // 2. 停顿 0.5 秒，营造真实感
        await new Promise((r) => setTimeout(r, 500));

        // 3. 围绕中心画一个正方形（模拟人类鼠标晃动寻找焦点）
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX + 100, y: centerY, click: false });
        await new Promise((r) => setTimeout(r, 200));
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX + 100, y: centerY + 100, click: false });
        await new Promise((r) => setTimeout(r, 200));
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX, y: centerY + 100, click: false });
        await new Promise((r) => setTimeout(r, 200));
        await invoke(TauriCommandEnum.AGENT_MOUSE_ACTION, { x: centerX, y: centerY, click: true }); // 最后点一下左键！

        // 4. 停顿一下，然后自动敲字！
        await new Promise((r) => setTimeout(r, 500));

        // （如果你此时鼠标焦点刚好在一个输入框里，比如记事本或浏览器地址栏，她就会直接把字打进去）
        await invoke(TauriCommandEnum.AGENT_TYPE_TEXT, { text: "Hello! I am HuaYan, your AI Desktop Agent!" });

        speak("操作完毕！我是不是越来越像个真正的人类了？");
      } catch (e) {
        console.error("Agent 操作失败:", e);
        speak("哎呀，系统底层好像不让我碰鼠标呢...");
      }
    }, 3000);
  }, 4000);
};

// --- 陪伴功能 ---
const startPomodoro = () => {
  // 如果已经在专注中，再次点击就是“提前取消”
  if (isPomodoroActive.value) {
    clearInterval(pomodoroTimer);
    isPomodoroActive.value = false;
    speak("番茄钟已取消，不要有压力，随时可以重新开始哦~");
    return;
  }

  // 开启番茄钟
  isPomodoroActive.value = true;
  pomodoroTimeLeft.value = 25 * 60; // 重置为 25 分钟
  speak("好的，接下来25分钟我会安静陪你，专注加油哦！");

  // 如果模型有举手的动作，可以顺便播一个，没有的话会自动忽略
  if (live2dModel.value) {
    live2dModel.value.motion("TapBody");
  }

  // 开始每秒倒计时
  pomodoroTimer = setInterval(() => {
    if (pomodoroTimeLeft.value > 0) {
      pomodoroTimeLeft.value--;
    } else {
      // 时间到！
      clearInterval(pomodoroTimer);
      isPomodoroActive.value = false;
      speak("时间到啦！辛苦了，站起来活动一下，喝口水吧~");
    }
  }, 1000);
};

const playMusic = async () => {
  if (isSleeping.value) return;

  isListeningMusic.value = !isListeningMusic.value;

  if (isListeningMusic.value) {
    speak("音乐雷达已开启，放首动感的歌试试吧~");
    console.log("🟢 [音频雷达] 已启动，正在监听系统声音...");

    try {
      // 通知 Rust 开启内录
      await invoke(TauriCommandEnum.TOGGLE_SYSTEM_AUDIO_LISTEN, { enable: true });

      let smoothedEnergy = 0;
      let lastLogTime = 0; // 用于日志节流

      // 高频接收系统音量
      unlistenAudio = await listen<number>("system-audio-level", (event) => {
        if (!live2dModel.value?.internalModel?.coreModel) return;

        const rms = event.payload;

        // 1. 降低增益倍数：从 6.0 降到 2.5 (如果还是很容易 100%，可以降到 1.5)
        let targetEnergy = rms * 2.5;

        // 2. 噪音门 (Noise Gate)：如果能量太小（系统底噪/白噪音），直接归零，防止她一直瞎哆嗦
        if (targetEnergy < 0.03) targetEnergy = 0;

        // 3. 封顶限制，防止超出 100%
        targetEnergy = Math.min(1.0, targetEnergy);

        // 4. 平滑插值 (Lerp)
        // 让当前的能量慢慢去追赶目标能量，0.2 是平滑系数（越小越丝滑，越大越神经质）
        smoothedEnergy += (targetEnergy - smoothedEnergy) * 0.2;

        const now = Date.now();
        if (smoothedEnergy > 0.05 && now - lastLogTime > 300) {
          const bar = "█".repeat(Math.floor(smoothedEnergy * 20));
          console.log(`🎵 [节奏感知] 能量: ${(smoothedEnergy * 100).toFixed(0).padStart(3, " ")}% | ${bar}`);
          lastLogTime = now;
        }

        // 身体摇摆
        const time = now / 300;
        const swing = Math.sin(time) * 15 * smoothedEnergy;

        live2dModel.value.internalModel.coreModel.setParameterValueById("ParamBodyAngleY", swing);
        live2dModel.value.internalModel.coreModel.setParameterValueById("ParamBodyAngleZ", swing * 0.5);

        // 嘴巴微张打节拍
        live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", smoothedEnergy * 0.8);
      });
    } catch (e) {
      console.warn("开启系统音频监听被拦截:", e);
      isListeningMusic.value = false;
      speak(typeof e === "string" ? e : "哎呀，抓不到系统的声音呢...");
    }
  } else {
    // 关闭监听
    console.log("🔴 [音频雷达] 已关闭。");
    speak("音乐雷达已关闭~");
    try {
      await invoke(TauriCommandEnum.TOGGLE_SYSTEM_AUDIO_LISTEN, { enable: false });
    } catch (e) {}

    if (unlistenAudio) {
      unlistenAudio();
      unlistenAudio = null;
    }

    // 将身体姿态归位回正
    if (live2dModel.value) {
      live2dModel.value.internalModel.coreModel.setParameterValueById("ParamBodyAngleY", 0);
      live2dModel.value.internalModel.coreModel.setParameterValueById("ParamBodyAngleZ", 0);
      live2dModel.value.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", 0);
    }
  }
};

// 唤出弹窗
const quickMemo = async () => {
  if (isSleeping.value) return; // 睡觉时不能记笔记
  showMemoInput.value = true;
  memoText.value = ""; // 清空上次的输入
  speak("想到什么啦？快写下来~");
  await nextTick();
  memoInputRef.value?.focus();
};

// 隐藏弹窗
const hideMemo = () => {
  showMemoInput.value = false;
  memoText.value = "";
};

// 统一的键盘事件拦截器
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    // 如果同时按下了 Shift 键，就放行，让 textarea 正常换行
    if (e.shiftKey) return;

    // 如果没按 Shift，就是纯回车，那么阻止默认换行行为，并保存！
    e.preventDefault();
    saveMemo();
  } else if (e.key === "Escape") {
    // 按 Esc 取消
    hideMemo();
  }
};

// 保存并收起
const saveMemo = () => {
  if (!memoText.value.trim()) {
    hideMemo(); // 如果没写字就按了回车，直接关掉即可
    return;
  }

  // 存入 Store
  agentStore.addMemo(memoText.value);
  hideMemo();

  // 给予正反馈
  speak("记下来啦，放心交给我吧！");

  // 如果模型有动作，让她开心地点个头或者举个手
  if (live2dModel.value) {
    live2dModel.value.motion("TapBody");
  }
};

// --- 控制功能 ---
const switchLive2dModel = () => {
  // 1. 随机抽取一句离别台词
  const randomPhrase = farewellPhrases[Math.floor(Math.random() * farewellPhrases.length)];
  // 2. 让当前的模型说出这句话
  speak(randomPhrase);
  console.log(`🎭 准备切换模型，当前模型正在道别: ${randomPhrase}`);
  // 3. 延迟 3 秒钟（预留给她发声和做口型的时间），然后再真正切换模型
  setTimeout(() => {
    agentStore.nextLive2dModel();
  }, 3000);
};

const toggleClickThrough = async () => {
  isClickThrough.value = !isClickThrough.value;
  // 让 Tauri 窗口忽略所有鼠标事件
  await appWindow.setIgnoreCursorEvents(isClickThrough.value);

  if (isClickThrough.value) {
    // 视觉提示：进入穿透模式时，让模型稍微变半透明一点，方便区分
    if (pixiApp && pixiApp.view) {
      (pixiApp.view as HTMLCanvasElement).style.opacity = "0.7";
    }
    speak("已开启防误触，现在你点不到我啦！按下 CommandOrControl+Shift+R 随时解除哦~");
  } else {
    // 恢复实体
    if (pixiApp && pixiApp.view) {
      (pixiApp.view as HTMLCanvasElement).style.opacity = "1";
    }
    speak("实体化恢复！我又可以被摸到啦~");
  }
};

const sleepMode = () => {
  if (isSleeping.value) return; // 如果已经在睡觉了，就不管了
  isSleeping.value = true;
  speak("我先去眯一会儿，工作加油哦，点我就可以唤醒我~");
  if (live2dModel.value) {
    live2dModel.value.focus(0, 0);
  }
};

onMounted(async () => {
  if (!canvasRef.value) return;

  const windows = await getAllWebviewWindows();
  const isLoginWindowAlive = windows.some((w) => w.label === "login");

  // 1. 窗口右下角定位
  const screenW = window.screen.availWidth;
  const screenH = window.screen.availHeight;
  const winW = window.outerWidth;
  const winH = window.outerHeight;
  const x = screenW - winW; // 紧贴右边
  const y = screenH - winH; // 紧贴底边
  await appWindow.setPosition(new LogicalPosition(x - 10, y));
  if (agentStore.isOpenAgent && !isLoginWindowAlive) {
    await appWindow.show();
  } else {
    await appWindow.hide();
  }

  // 监听用户登录成功事件
  const unlistenLogin = await listen(EventEnum.LOGIN_SUCCESS, async () => {
    if (agentStore.isOpenAgent) {
      await appWindow.show();
      speak("欢迎回来！我已经准备好陪你工作啦~");
      if (live2dModel.value) live2dModel.value.motion("TapBody");
    }
  });

  // 监听用户登出事件
  const unlistenLogout = await listen(EventEnum.LOGOUT, async () => {
    // 登出时，无论开关状态，必须强制隐藏桌宠
    await appWindow.hide();
  });

  // 挂载到 window，方便在 onUnmounted 里销毁
  (window as any).__unlistenLogin = unlistenLogin;
  (window as any).__unlistenLogout = unlistenLogout;

  watch(
    () => agentStore.isOpenAgent,
    async (newVal) => {
      if (newVal) {
        // 开关打开：显示窗口并打招呼
        await appWindow.show();
        speak("我回来啦！有什么需要帮忙的吗？");
        if (live2dModel.value) live2dModel.value.motion("TapBody");
      } else {
        // 开关关闭：道别后隐藏窗口
        speak("那我先去休息啦，有事在设置里叫我哦~");
        // 延迟 3 秒，等她把话说完再隐身
        setTimeout(async () => {
          await appWindow.hide();
        }, 3000);
      }
    }
  );

  // 2. Pixi 初始化
  pixiApp = new PIXI.Application({
    view: canvasRef.value,
    autoStart: true,
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });

  // 3. Live2D 模型加载
  await loadLive2dModel(agentStore.currentLive2dUrl);

  // 4. 监听 Store 中模型 URL 的变化，一旦变化自动热加载新模型！
  watch(
    () => agentStore.currentLive2dUrl,
    (newUrl) => {
      loadLive2dModel(newUrl);
    }
  );

  // 开启全局鼠标视线追踪
  const unlistenMouse = await listen<[number, number]>("global-mouse-move", async (event) => {
    if (!live2dModel.value) return;

    if (isSleeping.value) return;

    const [globalPhysicalX, globalPhysicalY] = event.payload;

    try {
      // 1. 获取当前窗口在屏幕上的绝对物理坐标
      const pos = await appWindow.outerPosition();
      // 2. 获取当前显示器的缩放比例 (比如 Windows 的 125%, 150%)
      const factor = await appWindow.scaleFactor();

      // 3. 将全局物理坐标 转化为 前端能理解的逻辑坐标
      const logicalGlobalX = globalPhysicalX / factor;
      const logicalGlobalY = globalPhysicalY / factor;
      const logicalWinX = pos.x / factor;
      const logicalWinY = pos.y / factor;

      // 4. 计算出鼠标相对于咱们透明窗口左上角的相对坐标
      const relX = logicalGlobalX - logicalWinX;
      const relY = logicalGlobalY - logicalWinY;

      // 5. 神奇的 focus 方法：无论坐标是正数还是负数（哪怕鼠标在屏幕边缘），
      // Pixi-Live2D 都会自动将其映射为正确的头部仰角和转头角度！
      live2dModel.value.focus(relX, relY);
    } catch (e) {
      // 忽略拖拽窗口时可能产生的短暂获取坐标异常
    }
  });

  // 记得将这个解绑函数存到一个外层变量里，方便在 onUnmounted 里调用
  (window as any).__unlistenMouse = unlistenMouse;

  // 强制绑定全局快捷键逻辑 ---
  try {
    const shortcutKey = "CommandOrControl+Shift+R";
    // 1. 检查是否已经被注册（比如上次关闭窗口时没卸载干净）
    const isReg = await isRegistered(shortcutKey);
    if (isReg) {
      console.log(`⚠️ 检测到快捷键 [${shortcutKey}] 被残留占用，正在强制释放...`);
      // 2. 强制强拆旧的绑定
      await unregister(shortcutKey);
    }
    // 3. 重新干净地绑定全新的事件
    await register(shortcutKey, (event) => {
      if (event.state === "Pressed") {
        toggleClickThrough();
      }
    });
    console.log(`✅ 快捷键 [${shortcutKey}] 强制绑定成功！`);
  } catch (e) {
    console.error("全局快捷键强绑失败:", e);
  }
});

onUnmounted(async () => {
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
  if ((window as any).__unlistenMouse) {
    (window as any).__unlistenMouse();
  }
  if ((window as any).__unlistenLogin) (window as any).__unlistenLogin();
  if ((window as any).__unlistenLogout) (window as any).__unlistenLogout();
  // 清理连麦
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (vadAudioCtx) {
    vadAudioCtx.close();
  }
  if (wsEventListener) {
    wsEventListener();
  }
  try {
    await unregister("CommandOrControl+Shift+R");
  } catch (e) {
    console.warn("注销全局快捷键失败:", e);
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
</style>
