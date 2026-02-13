export function useVideoFrame() {
  const videoUrl = ref<string>("");
  const frames = ref<string[]>([]);
  const isGenerating = ref(false);

  /**
   * 生成视频预览帧
   * @param file 视频文件对象
   * @param count 需要生成的帧数，默认为 8 张
   */
  const generateFrames = async (file: File, count: number = 8) => {
    isGenerating.value = true;
    frames.value = [];

    // 创建 URL
    if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
    videoUrl.value = URL.createObjectURL(file);

    const video = document.createElement("video");
    video.src = videoUrl.value;
    video.muted = true;
    video.crossOrigin = "anonymous"; // 处理跨域问题
    video.currentTime = 1; // 从第1秒开始，避开可能的黑屏开头

    // 等待元数据加载以获取时长
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(true);
    });

    const duration = video.duration;
    const interval = duration / (count + 1); // 分布间隔
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    for (let i = 1; i <= count; i++) {
      const time = i * interval;
      video.currentTime = time;

      // 等待seek完成
      await new Promise((resolve) => {
        video.onseeked = () => resolve(true);
      });

      // 设置画布尺寸
      canvas.width = video.videoWidth / 4; // 缩小尺寸优化性能
      canvas.height = video.videoHeight / 4;

      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      frames.value.push(dataUrl);
    }

    isGenerating.value = false;
    // 清理
    video.remove();
  };

  const clearFrames = () => {
    frames.value = [];
    if (videoUrl.value) {
      URL.revokeObjectURL(videoUrl.value);
      videoUrl.value = "";
    }
  };

  return {
    videoUrl,
    frames,
    isGenerating,
    generateFrames,
    clearFrames
  };
}
