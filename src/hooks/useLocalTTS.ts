import { ref, shallowRef } from "vue";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { TauriCommandEnum } from "@/enums";
import { useAgentStore } from "@/stores/agent";

let ttsWorker: Worker | null = null;
let isKokoroReady = false;
let initKokoroPromise: Promise<void> | null = null;
let globalAudioContext: AudioContext | null = null;

export const useLocalTTS = () => {
  const isPlaying = ref(false);
  const isLoading = ref(false);
  const audioSource = shallowRef<AudioBufferSourceNode | null>(null);
  const agentStore = useAgentStore();

  /** 停止播放 */
  const stop = () => {
    if (audioSource.value) {
      try {
        audioSource.value.stop();
      } catch {}
      audioSource.value = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    isPlaying.value = false;
    isLoading.value = false;
  };

  /** 获取全局 AudioContext 并解锁 */
  const getAudioContext = () => {
    if (!globalAudioContext) globalAudioContext = new AudioContext();
    if (globalAudioContext.state === "suspended") globalAudioContext.resume();
    return globalAudioContext;
  };

  /**
   * 检测文本语言
   * @param text 要检测的语言文本
   * @returns 语言代码
   */
  const detectLanguage = (text: string) => (/[\u4e00-\u9fa5]/.test(text) ? "zh" : "en");

  /** 初始化 Kokoro 引擎 */
  const initKokoro = () => {
    if (isKokoroReady) return Promise.resolve();
    if (!initKokoroPromise) {
      initKokoroPromise = new Promise((resolve, reject) => {
        ttsWorker = new Worker(new URL("@/workers/kokoro.worker.ts", import.meta.url), { type: "module" });
        const handler = (e: MessageEvent) => {
          if (e.data.action === "init") {
            ttsWorker?.removeEventListener("message", handler);
            if (e.data.status === "success") {
              isKokoroReady = true;
              resolve();
            } else reject(e.data.error);
          }
        };
        ttsWorker.addEventListener("message", handler);
        ttsWorker.postMessage({ action: "init" });
      });
    }
    return initKokoroPromise;
  };

  /** 播放 Kokoro 引擎 */
  const playKokoro = async (text: string, model: any) => {
    await initKokoro();
    const baseModelsDir: string = await invoke(TauriCommandEnum.GET_MODELS_DIR);
    const assetBaseUrl = convertFileSrc(baseModelsDir);
    const voiceId = model.voiceId || "af_bella";

    // 向 Worker 发送生成指令
    const result = await new Promise<any>((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.action === "generate") {
          ttsWorker?.removeEventListener("message", handler);
          if (e.data.status === "success") resolve(e.data);
          else reject(e.data.error);
        }
      };
      ttsWorker?.addEventListener("message", handler);
      ttsWorker?.postMessage({ action: "generate", text, voiceId, assetBaseUrl });
    });

    const ctx = getAudioContext();
    const audioBuffer = ctx.createBuffer(1, result.audio.length, result.sampling_rate);
    audioBuffer.copyToChannel(result.audio, 0);
    playAudioBuffer(audioBuffer);
  };

  /**
   * 播放 Piper 引擎
   * @param text 要播放的文本
   * @param model 模型配置
   */
  const playPiper = async (text: string, model: any) => {
    const baseModelsDir: string = await invoke(TauriCommandEnum.GET_MODELS_DIR);
    const separator = baseModelsDir.includes("\\") ? "\\" : "/";
    const modelPath = `${baseModelsDir}${separator}${model.fileName}`;
    const outputPath = `${baseModelsDir}${separator}temp_chat_read.wav`;

    await invoke(TauriCommandEnum.GENERATE_PIPER_SPEECH, { text, modelPath, outputPath });

    const audioUrl = convertFileSrc(outputPath);
    const response = await fetch(`${audioUrl}?t=${Date.now()}`);
    const arrayBuffer = await response.arrayBuffer();

    const ctx = getAudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    playAudioBuffer(audioBuffer);
  };

  /**
   * 播放系统 TTS 引擎
   * @param text 要播放的文本
   */
  const playSystem = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.onstart = () => {
      isLoading.value = false;
      isPlaying.value = true;
    };
    utterance.onend = () => stop();
    utterance.onerror = () => stop();
    window.speechSynthesis.speak(utterance);
  };

  /**
   * 播放 AudioBuffer 内容
   * @param audioBuffer
   */
  const playAudioBuffer = (audioBuffer: AudioBuffer) => {
    stop();
    const ctx = getAudioContext();
    const newSource = ctx.createBufferSource();
    newSource.buffer = audioBuffer;
    newSource.connect(ctx.destination);
    newSource.onended = () => {
      isPlaying.value = false;
    };

    audioSource.value = newSource;
    newSource.start(0);
    isLoading.value = false;
    isPlaying.value = true;
  };

  /**
   * 朗读文本
   * @param text 要朗读的文本
   */
  const readAloud = async (text: string) => {
    stop();
    isLoading.value = true;
    try {
      const lang = detectLanguage(text);
      const targetModel = agentStore.activeModels[lang];
      if (!targetModel) throw new Error("无可用本地模型");

      if (targetModel.engine === "Piper") {
        await playPiper(text, targetModel);
      } else if (targetModel.engine === "Kokoro") {
        await playKokoro(text, targetModel); // 🌟 Kokoro 完美打通！
      }
    } catch (e) {
      console.warn("本地引擎失败，切回系统 TTS", e);
      playSystem(text);
    }
  };

  return { readAloud, stop, isPlaying, isLoading };
};
