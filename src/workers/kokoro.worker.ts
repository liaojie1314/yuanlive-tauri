/// <reference lib="webworker" />
import { KokoroTTS } from "kokoro-js";
import { env } from "@huggingface/transformers";

env.allowRemoteModels = true;
env.allowLocalModels = false;

let kokoroInstance: any = null;
let localAssetBaseUrl = "";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let urlString = input.toString();
  if (urlString.includes("huggingface.co")) {
    // 提取出真实的文件路径。
    // HF 的标准格式是: https://huggingface.co/{repo}/resolve/main/{filepath}
    const match = urlString.match(/resolve\/main\/(.+)$/);

    if (match && match[1]) {
      const filePath = match[1];
      // 强行掉包！拼接上我们从主线程传过来的 Tauri 资产路径
      // 例如：http://asset.localhost/C%3A%5C...%5Cmodels/kokoro/config.json
      urlString = `${localAssetBaseUrl}/kokoro/${filePath}`;
      console.log(`[Fetch 终极劫持] 拦截 ${filePath} -> 重定向至本地 Tauri 引擎`);
    }
  }
  return originalFetch(urlString, init);
};

self.addEventListener("message", async (e) => {
  const { action, text, voiceId, assetBaseUrl } = e.data;

  try {
    if (action === "init") {
      self.postMessage({ action: "init", status: "success" });
    } else if (action === "close") {
      kokoroInstance = null;
      self.postMessage({ action: "close", status: "success" });
    } else if (action === "generate") {
      // 保存主线程传来的基准路径，供上面的拦截器使用
      localAssetBaseUrl = assetBaseUrl;

      if (!kokoroInstance) {
        console.log(`Worker: 正在欺骗引擎加载本地底座...`);
        // 随便给个合法的名字，骗它发起 Fetch 请求，从而触发我们的拦截器
        kokoroInstance = await KokoroTTS.from_pretrained("kokoro", {
          dtype: "q8"
        });
      }

      console.log(`Worker: 使用声线 [${voiceId}] 生成...`);
      const out = await kokoroInstance.generate(text, { voice: voiceId || "af_bella" });

      self.postMessage({
        action: "generate",
        status: "success",
        audio: out.audio,
        sampling_rate: out.sampling_rate
      });
    }
  } catch (error: any) {
    console.error("Worker 致命错误:", error);
    self.postMessage({ action, status: "error", error: error.message });
  }
});
