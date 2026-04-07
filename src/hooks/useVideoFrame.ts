import { useI18n } from "vue-i18n";

export function useVideoFrame() {
  const { t } = useI18n();
  const videoUrl = ref<string>("");
  const frames = ref<string[]>([]);
  const isGenerating = ref(false);
  const videoDuration = ref<number>(0);

  const waitWithTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> => {
    let timeoutId: number;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(errorMsg)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  };

  const generateFrames = async (file: File, count: number = 8) => {
    isGenerating.value = true;
    frames.value = [];

    if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
    videoUrl.value = URL.createObjectURL(file);

    const video = document.createElement("video");
    // WebKitGTK 需要元素在 DOM 中才能稳定触发加载事件
    video.style.display = "none";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    document.body.appendChild(video);

    try {
      video.src = videoUrl.value;
      video.load();

      // 等待加载，最多等 10 秒
      await waitWithTimeout(
        new Promise((resolve, reject) => {
          video.onloadeddata = () => resolve(true);
          video.onerror = (e) => reject(e);
        }),
        10000,
        "视频加载超时，请检查视频格式或系统解码器"
      );

      videoDuration.value = video.duration;
      const duration = video.duration;
      const interval = duration / (count + 1);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      for (let i = 1; i <= count; i++) {
        const time = i * interval;
        video.currentTime = time;

        // 每次 seek 最多等 5 秒
        await waitWithTimeout(
          new Promise((resolve) => {
            // 使用 onseeked 确保画面已经准备好
            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              resolve(true);
            };
            video.addEventListener("seeked", onSeeked);
          }),
          5000,
          `提取第 ${i} 帧超时`
        );

        canvas.width = video.videoWidth / 4;
        canvas.height = video.videoHeight / 4;

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          frames.value.push(dataUrl);
        }
      }
    } catch (e: any) {
      console.error("提取帧失败:", e);
      // 触发 UI 提示，避免干转圈
      window.$message?.error(t("hook.videoFrame.extractFailed"));
    } finally {
      // 无论成功失败，必须把 video 从 DOM 里清理掉
      isGenerating.value = false;
      if (document.body.contains(video)) {
        document.body.removeChild(video);
      }
      video.src = "";
    }
  };

  const clearFrames = () => {
    frames.value = [];
    videoDuration.value = 0;
    if (videoUrl.value) {
      URL.revokeObjectURL(videoUrl.value);
      videoUrl.value = "";
    }
  };

  return { videoUrl, frames, isGenerating, videoDuration, generateFrames, clearFrames };
}
