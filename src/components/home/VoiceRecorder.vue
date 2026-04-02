<template>
  <div class="voice-recorder-container">
    <!-- 录音状态显示 -->
    <div class="voice-recorder-main">
      <!-- 录音状态文字 -->
      <div class="voice-status">
        <div v-if="!isRecording && !audioBlob && !isProcessing">
          <span class="text-#909090 flex-y-center gap-6px select-none">
            {{ t("components.voiceRecorder.tapPrefix") }}
            <svg class="size-14px color-#13987f"><use href="#voice"></use></svg>
            {{ t("components.voiceRecorder.tapSuffix") }}
          </span>
        </div>

        <div v-if="isRecording" class="status-recording">
          <div class="recording-animation">
            <div class="pulse-dot"></div>
          </div>
          <span>{{ formatTime(recordingTime) }} {{ t("components.voiceRecorder.recording") }}</span>
        </div>

        <div v-if="!isRecording && isProcessing" class="status-processing">
          <div class="processing-animation">
            <div class="loading-spinner"></div>
          </div>
          <span>{{ t("components.voiceRecorder.processing") }}</span>
        </div>

        <div v-if="!isRecording && audioBlob && !isProcessing" class="status-completed">
          <div class="playback-controls">
            <button class="play-btn" @click="togglePlayback">
              <svg v-if="!isPlaying" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" />
              </svg>
            </button>
            <span>{{ formatTime(recordingDuration) }}</span>
          </div>
        </div>
      </div>

      <!-- 录音控制按钮 -->
      <div class="voice-controls">
        <!-- 未录音状态 -->
        <div v-if="!isRecording && !audioBlob && !isProcessing" class="controls-idle">
          <div
            class="record-btn"
            @mousedown="startRecording"
            @mouseup="stopRecording"
            @mouseleave="stopRecording"
            @touchstart="startRecording"
            @touchend="stopRecording">
            <svg><use href="#voice"></use></svg>
          </div>
          <div class="cancel-btn" @click="handleCancel">
            <svg><use href="#close"></use></svg>
          </div>
        </div>

        <!-- 录音中状态 -->
        <div v-if="isRecording" class="controls-recording">
          <div class="stop-btn" @click="stopRecording">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M18,18H6V6H18V18Z" />
            </svg>
          </div>
          <div class="cancel-record-btn" @click="cancelRecording">
            <svg><use href="#close"></use></svg>
          </div>
        </div>

        <!-- 处理中状态 -->
        <div v-if="!isRecording && isProcessing" class="controls-processing"></div>

        <!-- 录音完成状态 -->
        <div v-if="!isRecording && audioBlob && !isProcessing" class="controls-completed">
          <div class="refresh-btn" @click="reRecord">
            <svg><use href="#refresh"></use></svg>
          </div>
          <div
            class="transcribe-btn"
            :title="t('components.voiceRecorder.transcribe')"
            :disabled="isTranscribing"
            @click="handleTranscribe">
            <i-mdi-format-text-variant-outline v-if="!isTranscribing" class="h-5 w-5" />
            <div v-else class="loading-spinner"></div>
          </div>
          <div class="send-btn" :disabled="sending" @click="handleSend">
            <svg v-if="!sending"><use href="#send"></use></svg>
            <div v-else class="loading-spinner"></div>
          </div>
          <div class="cancel-btn" @click="handleCancel">
            <svg><use href="#close"></use></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { MittEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt";
import { useVoiceRecordRust } from "@/hooks/useVoiceRecordRust";
import { remove } from "@tauri-apps/plugin-fs";

const { t } = useI18n();

// 事件定义
const emit = defineEmits<{
  cancel: [];
  send: [voiceData: any];
}>();

let whisperWorker: Worker | null = null;

const isTranscribing = ref(false);
// 录音状态
const audioBlob = ref<Blob | null>(null);
const recordingDuration = ref(0);
const sending = ref(false);
const localAudioPath = ref<string>("");

// 播放状态
const isPlaying = ref(false);
const isProcessing = ref(false);
const audioElement = ref<HTMLAudioElement | null>(null);

// 语音录制功能
const {
  isRecording,
  recordingTime,
  startRecording: startRecord,
  stopRecording: stopRecord,
  cancelRecording: cancelRecord,
  formatTime
} = useVoiceRecordRust({
  onStart: () => {
    console.log("开始录音");
  },
  onStop: (blob, duration, localPath) => {
    console.log("录音结束", duration, "本地路径:", localPath);
    audioBlob.value = blob;
    recordingDuration.value = duration;
    localAudioPath.value = localPath;
    isProcessing.value = false;
    createAudioElement();
  },
  onError: () => {
    window.$message?.error(t("components.voiceRecorder.error"));
    isProcessing.value = false;
  }
});

/** 初始化 Worker */
const initWhisperWorker = () => {
  if (!whisperWorker) {
    whisperWorker = new Worker(new URL("@/workers/whisper.worker.ts", import.meta.url), {
      type: "module"
    });
  }
  return whisperWorker;
};

/** 处理语音转文字 */
const handleTranscribe = async () => {
  if (!audioBlob.value) return;

  try {
    isTranscribing.value = true;

    // 解码音频：这一步必须在主线程做，因为 Web Worker 里没有完整的 AudioContext API
    const arrayBuffer = await audioBlob.value.arrayBuffer();
    const audioContext = new window.AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const audioData = audioBuffer.getChannelData(0); // 提取 Float32Array 数据

    // 初始化并调用 Worker
    const worker = initWhisperWorker();

    worker.onmessage = (e) => {
      const { status, text, error } = e.data;

      if (status === "loading") {
        console.log("Whisper: 正在加载模型...");
      } else if (status === "processing") {
        console.log("Whisper: 模型加载完毕，正在转写音频...");
      } else if (status === "success") {
        // 转写成功，回填到输入框
        if (text) {
          useMitt.emit(MittEnum.FILL_MESSAGE_INPUT, text);
          handleCancel(); // 关闭录音面板
          window.$message?.success(t("components.voiceRecorder.msg.transcribeSuccess"));
        } else {
          window.$message?.warning(t("components.voiceRecorder.msg.noClearSound"));
        }
        isTranscribing.value = false;
      } else if (status === "error") {
        window.$message?.error("模型转写失败: " + error);
        isTranscribing.value = false;
      }
    };

    // 将解析好的浮点数组发给 Worker 进行繁重的张量计算
    worker.postMessage({ type: "transcribe", audioData });
  } catch (error) {
    console.error("音频解码失败:", error);
    window.$message?.error(t("components.voiceRecorder.msg.modelLoadOrTranscribeFailed"));
    isTranscribing.value = false;
  }
};

/** 开始录音 */
const startRecording = async () => {
  await startRecord();
};

/** 停止录音 */
const stopRecording = async () => {
  if (isRecording.value) {
    isProcessing.value = true;
  }
  await stopRecord();
};

/** 重置录音状态 */
const resetRecordingState = () => {
  // 清理音频播放器
  if (audioElement.value) {
    audioElement.value.pause();
    if (audioElement.value.src) {
      URL.revokeObjectURL(audioElement.value.src);
    }
    audioElement.value = null;
  }

  // 重置所有状态
  audioBlob.value = null;
  recordingDuration.value = 0;
  localAudioPath.value = "";
  isPlaying.value = false;
  isProcessing.value = false;
};

/** 取消录音 */
const cancelRecording = () => {
  cancelRecord();
  audioBlob.value = null;
  recordingDuration.value = 0;
  isProcessing.value = false;
};

/** 重新录制 */
const reRecord = () => {
  resetRecordingState();
};

/** 创建音频元素用于播放 */
const createAudioElement = () => {
  if (audioBlob.value) {
    const url = URL.createObjectURL(audioBlob.value);
    audioElement.value = new Audio(url);

    audioElement.value.addEventListener("ended", () => {
      isPlaying.value = false;
    });
  }
};

/** 切换播放状态 */
const togglePlayback = () => {
  if (audioElement.value) {
    if (isPlaying.value) {
      audioElement.value.pause();
    } else {
      audioElement.value.play();
    }
    isPlaying.value = !isPlaying.value;
  }
};

/** 发送语音 */
const handleSend = async () => {
  if (!audioBlob.value || !localAudioPath.value) {
    console.log("🎤 缺少音频数据，退出发送");
    return;
  }

  try {
    sending.value = true;

    // 直接使用本地路径，不需要重新上传文件
    // 这样和其他文件发送逻辑保持一致，都是先缓存到本地再处理
    const voiceData = {
      localPath: localAudioPath.value,
      size: audioBlob.value.size,
      duration: recordingDuration.value,
      filename: `voice_${Date.now()}.mp3`,
      type: "audio/mp3"
    };

    console.log("🎤 发送语音数据:", voiceData);
    emit("send", voiceData);

    // 发送后立即重置状态，避免下次打开时还显示这条录音
    resetRecordingState();
  } catch (error) {
    console.error("🎤 发送语音失败:", error);
  } finally {
    sending.value = false;
  }
};

/** 取消/关闭 */
const handleCancel = () => {
  // 清理资源
  if (audioElement.value) {
    audioElement.value.pause();
    URL.revokeObjectURL(audioElement.value.src);
  }

  if (localAudioPath.value) {
    remove(localAudioPath.value).catch(() => {});
  }

  // 恢复出厂状态
  resetRecordingState();

  emit("cancel");
};

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause();
    URL.revokeObjectURL(audioElement.value.src);
  }
  if (whisperWorker) {
    whisperWorker.terminate();
    whisperWorker = null;
  }
});
</script>

<style scoped lang="scss">
@mixin base-control-button($dark-bg, $bg) {
  @apply flex-center size-36px text-#fff cursor-pointer rounded-full;
  background-color: $bg;
  [data-theme="dark"] & {
    background-color: $dark-bg;
  }
}

.voice-recorder-container {
  @apply h-89.5px rounded-8px relative flex w-full flex-col bg-[--bg-color];
}

.voice-recorder-main {
  @apply gap-22px flex h-full flex-col items-center justify-center;
}

.voice-status {
  @apply text-(14px [--text-color] center) max-h-24px;

  .status-recording {
    @apply flex-y-center gap-8px text-#13987f select-none;

    .recording-animation {
      position: relative;
      .pulse-dot {
        @apply size-8px bg-#13987f rounded-full;
        animation: pulse 1.5s infinite;
      }
    }
  }

  .status-processing {
    @apply flex-y-center gap-8px text-[--user-text-color] select-none;

    .processing-animation {
      position: relative;
      .loading-spinner {
        @apply size-12px rounded-full;
        border: 2px solid transparent;
        border-top: 2px solid var(--user-text-color);
        animation: spin 1s linear infinite;
      }
    }
  }

  .status-completed {
    .playback-controls {
      @apply flex-y-center gap-8px;

      .play-btn {
        @apply flex-center size-30px text-#13987f cursor-pointer border-none bg-inherit;

        svg {
          @apply size-16px;
        }

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}

.voice-controls {
  @apply flex-center gap-16px;

  .controls-idle,
  .controls-recording,
  .controls-processing,
  .controls-completed {
    @apply flex-y-center gap-12px;
  }

  svg {
    @apply size-18px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .record-btn {
    @include base-control-button(#13987f80, #13987f);
  }

  .transcribe-btn {
    @include base-control-button(#2980b980, #3498db);

    .loading-spinner {
      @apply size-16px rounded-full;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      animation: spin 1s linear infinite;
    }
  }

  .stop-btn {
    @include base-control-button(#e74c3c96, #e74c3c);
  }

  .refresh-btn {
    @include base-control-button(#f39c1280, #f39c12);
  }

  .send-btn {
    @include base-control-button(#13987f80, #13987f);

    .loading-spinner {
      @apply size-16px rounded-full;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      animation: spin 1s linear infinite;
    }
  }

  .cancel-btn,
  .cancel-record-btn {
    @include base-control-button(#95a5a640, #95a5a690);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
