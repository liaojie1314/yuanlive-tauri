import { pipeline, env } from "@huggingface/transformers";

// 禁用本地模型检查，强制使用 HuggingFace CDN（避免一些奇怪的本地路径报错）
env.allowLocalModels = false;

// 缓存转录器实例，避免每次调用重复加载模型
let transcriber: any = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, audioData, language } = e.data;

  if (type === "transcribe") {
    try {
      // 初始化模型 (仅首次执行耗时，后续会直接使用缓存实例)
      if (!transcriber) {
        self.postMessage({ status: "loading" }); // 告诉主线程正在加载模型
        transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny");
      }

      // 开始推理
      self.postMessage({ status: "processing" }); // 告诉主线程正在转写

      const output = await transcriber(audioData, {
        task: "transcribe",
        language: language || "chinese",
        chunk_length_s: 30,
        stride_length_s: 5
      });

      const text = (Array.isArray(output) ? output[0].text : output.text).trim();

      // 将结果发送回主线程
      self.postMessage({ status: "success", text });
    } catch (error: any) {
      console.error("[Whisper Worker Error]", error);
      self.postMessage({ status: "error", error: error.message });
    }
  }
};
