import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export function useCamera() {
  // 状态管理
  const isCameraOpen = ref(false);
  const photoUrl = ref<string>(""); // Base64 格式，用于预览

  // 使用 shallowRef 存储 MediaStream，因为我们不需要 Vue 深度监听流对象内部的变化
  const stream = shallowRef<MediaStream | null>(null);

  /**
   * 开启摄像头
   * @param videoElement <video> 元素的引用
   */
  const startCamera = async (videoElement: HTMLVideoElement) => {
    try {
      if (stream.value) return; // 已经开启则跳过
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user" // "user" 前置, "environment" 后置
        },
        audio: false // 通常拍照不需要音频
      });
      stream.value = mediaStream;
      videoElement.srcObject = mediaStream;
      // 必须调用 play 否则有些浏览器/环境不会自动播放
      await videoElement.play();
      isCameraOpen.value = true;
      photoUrl.value = ""; // 重置照片
    } catch (err) {
      console.error("摄像头启动失败:", err);
      throw new Error("无法访问摄像头，请检查权限或设备连接");
    }
  };

  /**
   * 关闭摄像头
   */
  const stopCamera = () => {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop());
      stream.value = null;
    }
    isCameraOpen.value = false;
  };

  /**
   * 拍照
   * @param videoElement <video> 源
   * @param canvasElement <canvas> 用于绘图的隐藏画布
   */
  const takePhoto = (videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => {
    if (!videoElement || !canvasElement) return;
    const context = canvasElement.getContext("2d");
    if (!context) return;
    // 同步尺寸
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    // 绘制当前帧
    // scaleX(-1) 是为了解决自拍镜像问题，如果不需要可以去掉 context.save() ... context.restore()
    context.save();
    context.scale(-1, 1);
    context.drawImage(videoElement, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
    context.restore();
    // 生成 Base64
    photoUrl.value = canvasElement.toDataURL("image/png");
  };

  /**
   * (Tauri) 保存照片到本地
   * @returns 保存的绝对路径或 null
   */
  const savePhotoToDisk = async (defaultName = "photo.png") => {
    if (!photoUrl.value) return null;
    try {
      // 1. 弹出保存对话框
      const filePath = await save({
        filters: [{ name: "Image", extensions: ["png"] }],
        defaultPath: defaultName
      });
      if (!filePath) return null; // 用户取消
      // 2. Base64 转 Uint8Array
      // 去掉前缀 "data:image/png;base64,"
      const base64Data = photoUrl.value.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      // 3. 写入文件
      await writeFile(filePath, binaryData);
      return filePath;
    } catch (err) {
      console.error("保存文件失败:", err);
      throw err;
    }
  };

  // 组件销毁时必须关闭摄像头，防止红灯一直亮着
  onUnmounted(() => {
    stopCamera();
  });

  return {
    isCameraOpen,
    photoUrl,
    startCamera,
    stopCamera,
    takePhoto,
    savePhotoToDisk
  };
}
