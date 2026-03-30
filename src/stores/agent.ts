import { invoke } from "@tauri-apps/api/core";
import { StoresEnum, TauriCommandEnum } from "@/enums";

export interface VoiceModel {
  id: string;
  name: string;
  language: string;
  fileName: string;
  engine: string;
  voiceId?: string;
  [key: string]: any;
}

interface Memo {
  id: string;
  content: string;
  timestamp: number;
}

export const useAgentStore = defineStore(
  StoresEnum.AGENT,
  () => {
    const CACHE_KEY = "agent_memos";
    // 模拟几个官方开源的 Live2D 静态模型链接
    const mockLive2dModels = [
      "https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples/Samples/Resources/Hiyori/Hiyori.model3.json", // 默认的华妍 (Hiyori)
      "https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples/Samples/Resources/Haru/Haru.model3.json", // 春 (Haru)
      "https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples/Samples/Resources/Mao/Mao.model3.json", // 猫 (Mao)
      "https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples/Samples/Resources/Natori/Natori.model3.json" // 名取 (Natori)
    ];

    const isOpenAgent = ref(false);
    const isUserLoggedIn = ref(false);
    // 当前使用的模型索引
    const currentLive2dIndex = ref(0);
    // 当前正在使用的模型字典，按语言存储
    // 例如：{ "zh": Piper模型对象, "en": Kokoro模型对象 }
    const activeModels = ref<Record<string, VoiceModel>>({});
    // 本地已下载的模型文件名列表
    const downloadedModels = ref<Record<string, boolean>>({});
    // 初始化时从本地缓存读取记录
    const memos = ref<Memo[]>(JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"));

    // 计算出当前应该加载的模型 URL
    const currentLive2dUrl = computed(() => mockLive2dModels[currentLive2dIndex.value]);

    /**
     * 检查单个模型是否已下载完毕
     * @param model 模型
     * @returns 是否已下载
     */
    const checkModelDownloaded = async (model: VoiceModel) => {
      try {
        let isDownloaded = false;

        if (model.engine === "Kokoro") {
          // Kokoro 必须同时满足底座和特征文件都存在
          const onnxExists = await invoke<boolean>(TauriCommandEnum.CHECK_FILE_EXISTS, {
            filePath: "kokoro/onnx/model_quantized.onnx"
          });
          const binExists = await invoke<boolean>(TauriCommandEnum.CHECK_FILE_EXISTS, {
            filePath: `kokoro/voices/${model.voiceId}.bin`
          });
          isDownloaded = onnxExists && binExists;
        } else {
          // Piper 必须同时满足 .onnx 和 .onnx.json 两个文件都存在
          const onnxExists = await invoke<boolean>(TauriCommandEnum.CHECK_FILE_EXISTS, {
            filePath: model.fileName
          });
          const jsonExists = await invoke<boolean>(TauriCommandEnum.CHECK_FILE_EXISTS, {
            filePath: `${model.fileName}.json`
          });
          isDownloaded = onnxExists && jsonExists;
        }

        // 更新状态地图
        downloadedModels.value[model.id] = isDownloaded;
        return isDownloaded;
      } catch (error) {
        console.error("检查文件存在性失败:", error);
        return false;
      }
    };

    /**
     * 批量检查所有模型的状态 (用于刚进页面时)
     * @param models 模型列表
     */
    const checkAllLocalModels = async (models: VoiceModel[]) => {
      for (const m of models) {
        await checkModelDownloaded(m);
      }

      // 如果发现当前启动的模型文件被物理删除了，立刻在 activeModels 中剔除它
      for (const lang in activeModels.value) {
        const currentModel = activeModels.value[lang];
        if (!downloadedModels.value[currentModel.id]) {
          delete activeModels.value[lang];
        }
      }
    };

    /**
     * 切换模型状态 (启动/关闭)
     * @param model 模型
     */
    const toggleModel = (model: VoiceModel) => {
      // 如果当前轨道的激活模型刚好是点击的这个，就关闭它
      if (activeModels.value[model.language]?.id === model.id) {
        delete activeModels.value[model.language];
      } else {
        // 否则，让这个模型顶替当前轨道（自动实现同语言互斥，不同语言共存）
        activeModels.value[model.language] = model;
      }
    };

    /** 随机或顺序切换到下一个 Live2D 模型 */
    const nextLive2dModel = () => {
      // 这里采用顺序循环切换，每次点击索引 +1，到底后回到 0
      currentLive2dIndex.value = (currentLive2dIndex.value + 1) % mockLive2dModels.length;
    };

    /**
     * 添加一条新备忘录
     * @param content 备忘录内容
     */
    const addMemo = (content: string) => {
      if (!content.trim()) return;

      memos.value.unshift({
        // 新灵感插在最前面
        id: crypto.randomUUID(),
        content,
        timestamp: Date.now()
      });

      // 持久化保存到本地
      localStorage.setItem(CACHE_KEY, JSON.stringify(memos.value));
    };

    /**
     * 删除一条备忘录
     * @param id 备忘录 ID
     */
    const deleteMemo = (id: string) => {
      memos.value = memos.value.filter((m) => m.id !== id);
      localStorage.setItem(CACHE_KEY, JSON.stringify(memos.value));
    };

    return {
      isOpenAgent,
      isUserLoggedIn,
      memos,
      activeModels,
      downloadedModels,
      currentLive2dUrl,
      addMemo,
      deleteMemo,
      toggleModel,
      checkModelDownloaded,
      checkAllLocalModels,
      nextLive2dModel
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
