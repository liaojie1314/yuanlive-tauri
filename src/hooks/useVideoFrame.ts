export function useVideoFrame() {
  const videoUrl = ref<string>("");
  const frames = ref<string[]>([]);
  const isGenerating = ref(false);
  const videoDuration = ref<number>(0);

  const generateFrames = async (file: File, count: number = 8) => {
    isGenerating.value = true;
    frames.value = [];

    if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
    videoUrl.value = URL.createObjectURL(file);

    const video = document.createElement("video");
    video.src = videoUrl.value;
    video.muted = true;
    video.preload = "auto";

    // 等待 loadeddata 确保有画面数据，而不仅仅是元数据
    await new Promise((resolve, reject) => {
      video.onloadeddata = () => resolve(true);
      video.onerror = (e) => reject(e);
    });

    videoDuration.value = video.duration; // 保存总时长
    const duration = video.duration;
    const interval = duration / (count + 1);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    for (let i = 1; i <= count; i++) {
      const time = i * interval;
      video.currentTime = time;

      await new Promise((resolve) => {
        video.onseeked = () => resolve(true);
      });

      canvas.width = video.videoWidth / 4;
      canvas.height = video.videoHeight / 4;

      try {
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        frames.value.push(dataUrl);
      } catch (e) {
        console.error("提取帧失败:", e);
      }
    }

    isGenerating.value = false;
    video.remove();
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
