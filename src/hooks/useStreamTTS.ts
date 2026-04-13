import { invoke, Channel } from "@tauri-apps/api/core";

export const useStreamTTS = () => {
  let mediaSource: MediaSource | null = null;
  let sourceBuffer: SourceBuffer | null = null;
  let audio: HTMLAudioElement | null = null;
  let queue: Uint8Array[] = [];
  let isAppending = false;

  const isPlaying = ref(false);
  const isLoading = ref(false);
  const currentRequestId = ref<string | null>(null);

  /**
   * 将 base64 字符串转换为 Uint8Array
   * @param base64 base64 字符串
   * @returns Uint8Array
   */
  const base64ToUint8Array = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  /** 处理队列中的音频数据 */
  const processQueue = () => {
    if (!sourceBuffer || sourceBuffer.updating || queue.length === 0) return;
    isAppending = true;
    const chunk = queue.shift();
    if (chunk) {
      sourceBuffer.appendBuffer(chunk as BufferSource);
    }
  };

  /** 停止播放 */
  const stop = async () => {
    if (currentRequestId.value) {
      // 呼叫后端的取消任务命令，节约带宽
      try {
        await invoke("ai_message_cancel_stream", { requestId: currentRequestId.value });
      } catch (_) {}
      currentRequestId.value = null;
    }

    if (audio) {
      audio.pause();
      audio.src = "";
      audio = null;
    }
    if (mediaSource && mediaSource.readyState === "open") {
      try {
        mediaSource.endOfStream();
      } catch (_) {}
    }
    queue = [];
    isPlaying.value = false;
    isLoading.value = false;
  };

  /** 朗读文本 */
  const readAloud = async (text: string) => {
    await stop();

    isLoading.value = true;
    currentRequestId.value = `tts_${Date.now()}`;

    audio = new Audio();
    mediaSource = new MediaSource();
    audio.src = URL.createObjectURL(mediaSource);

    audio.onplaying = () => {
      isLoading.value = false;
      isPlaying.value = true;
    };

    mediaSource.addEventListener("sourceopen", () => {
      // 注意：这里的 mime codec 必须和你后端返回的音频格式强一致！
      // 如果后端生成的是 MP3: 'audio/mpeg'
      // 如果后端生成的是 WAV: 'audio/wav; codecs="1"'
      sourceBuffer = mediaSource!.addSourceBuffer("audio/mpeg");

      sourceBuffer.addEventListener("updateend", () => {
        isAppending = false;
        processQueue();
      });

      audio!.play().catch((e) => console.error("自动播放失败:", e));
    });

    const onEvent = new Channel();
    onEvent.onmessage = (event: any) => {
      if (event.eventType === "chunk" && event.data) {
        const bytes = base64ToUint8Array(event.data);
        queue.push(bytes);
        if (!isAppending) processQueue();
      } else if (event.eventType === "done") {
        // 监听最后的 chunk 播放完毕后，关闭流
        const checkEnd = setInterval(() => {
          if (queue.length === 0 && !sourceBuffer?.updating) {
            if (mediaSource?.readyState === "open") mediaSource.endOfStream();
            clearInterval(checkEnd);
          }
        }, 100);
      } else if (event.eventType === "error") {
        console.error("TTS 流错误:", event.error);
        stop();
      }
    };

    try {
      await invoke("ai_tts_stream", {
        body: { text },
        requestId: currentRequestId.value,
        onEvent
      });
    } catch (e) {
      console.error("发起 TTS 请求失败:", e);
      stop();
    }
  };

  return { readAloud, stop, isPlaying, isLoading };
};
