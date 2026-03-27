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

export const useTtsStore = defineStore(
  StoresEnum.TTS,
  () => {
    // 当前正在使用的模型字典，按语言存储
    // 例如：{ "zh": Piper模型对象, "en": Kokoro模型对象 }
    const activeModels = ref<Record<string, VoiceModel>>({});
    // 本地已下载的模型文件名列表
    const downloadedModels = ref<Record<string, boolean>>({});

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

    return {
      activeModels,
      downloadedModels,
      checkModelDownloaded,
      checkAllLocalModels,
      toggleModel
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
