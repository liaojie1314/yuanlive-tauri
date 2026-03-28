<template>
  <n-flex vertical class="pb-6" :size="24">
    <div class="px-10px">
      <h2 class="text-18px font-bold m-0">{{ t("setting.live2d.voiceModels") }}</h2>
      <p class="text-(12px #909090) mt-1">{{ t("setting.live2d.voiceModelsDesc") }}</p>
    </div>

    <n-flex vertical v-if="isLoading" class="px-10px" :size="16">
      <n-skeleton height="40px" class="rounded-2" />
      <n-skeleton height="80px" class="rounded-2" />
      <n-skeleton height="80px" class="rounded-2" />
    </n-flex>

    <n-collapse v-else class="px-10px" :default-expanded-names="[]">
      <n-collapse-item
        v-for="(models, lang) in groupedModels"
        :key="lang"
        :title="`${getLangName(lang as string)} ${t('setting.live2d.voiceModelsCount', { count: models.length })}`"
        :name="lang">
        <n-flex vertical class="item mt-8px" :size="12">
          <div v-for="(model, index) in models" :key="model.id">
            <n-flex align="center" justify="space-between" class="py-4px">
              <div>
                <n-flex align="center" :size="8">
                  <span class="text-14px font-bold">{{ model.name }}</span>
                  <n-tag size="small" round :type="model.quality === 'high' ? 'success' : 'info'">
                    {{ t("setting.live2d.quality") }}: {{ model.quality }}
                  </n-tag>
                </n-flex>
                <div class="text-(12px #909090) mt-4px">
                  {{ t("setting.live2d.engine") }}: {{ model.engine }} | {{ t("setting.live2d.speakerName") }}:
                  {{ model.speakerName }} ({{ t("setting.live2d.size") }}: {{ model.size }})
                </div>
              </div>

              <n-flex align="center" :size="16">
                <template v-if="model.status === 'downloading'">
                  <n-flex align="center" :size="8">
                    <span class="text-12px text-[--user-text-color]">
                      {{ t("setting.live2d.downloading") }} {{ model.progress }}%
                    </span>
                    <n-progress
                      type="circle"
                      style="width: 20px"
                      color="#13987f"
                      :percentage="model.progress"
                      :stroke-width="12"
                      :show-indicator="false" />
                  </n-flex>
                </template>

                <template v-else>
                  <n-button
                    size="small"
                    :type="activeModels[model.language]?.id === model.id ? 'error' : 'primary'"
                    :secondary="activeModels[model.language]?.id !== model.id"
                    @click="handleModelAction(model)">
                    {{
                      downloadedModels[model.id]
                        ? activeModels[model.language]?.id === model.id
                          ? t("setting.live2d.close")
                          : t("setting.live2d.start")
                        : t("setting.live2d.download")
                    }}
                  </n-button>
                </template>
              </n-flex>
            </n-flex>

            <n-divider v-if="index !== models.length - 1" class="my-12px! bg-[--line-color]" />
          </div>
        </n-flex>
      </n-collapse-item>
    </n-collapse>
  </n-flex>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

import { TauriCommandEnum } from "@/enums";
import { useAgentStore } from "@/stores/agent";

const { t } = useI18n();
const agentStore = useAgentStore();
const { activeModels, downloadedModels } = storeToRefs(agentStore);

interface VoiceModel {
  id: string;
  name: string;
  speakerName: string;
  language: string;
  quality: string;
  size: string;
  url: string;
  fileName: string;
  engine: string;
  voiceId?: string;
  status: "none" | "downloading" | "done";
  progress: number;
}

const CACHE_KEY = "piper_voices_cache";
const CACHE_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000; // 缓存有效期设为 7 天
const unlistenFns: UnlistenFn[] = [];

const isLoading = ref(true);
// 存放所有解析后的模型
const allModels = ref<VoiceModel[]>([]);
// 自动按语言分类，便于 n-collapse 渲染
const groupedModels = computed(() => {
  const groups: Record<string, VoiceModel[]> = {};
  allModels.value.forEach((model) => {
    if (!groups[model.language]) groups[model.language] = [];
    groups[model.language].push(model);
  });
  return groups;
});

/**
 * 语言代码转中文显示
 * @param code 语言代码
 * @returns 中文显示名称
 */
const getLangName = (code: string) => {
  const map: Record<string, string> = { zh: "🇨🇳 中文", en: "🇺🇸 英文" };
  return map[code] || code;
};

/**
 * 获取并合并所有的语音模型 (带本地缓存与本地JSON读取)
 * @returns 包含所有模型的 Promise
 */
const fetchOfficialModels = async () => {
  try {
    isLoading.value = true;
    // 从 public 目录读取我们自己维护的 JSON
    const localRes = await fetch("/models.json");
    const customModels: VoiceModel[] = await localRes.json();
    // 获取云端 Piper 模型 (带缓存)
    let piperParsedList: VoiceModel[] = [];
    const cachedData = localStorage.getItem(CACHE_KEY);
    let shouldFetchCloud = true;

    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      // 检查缓存是否过期
      if (Date.now() - timestamp < CACHE_EXPIRE_MS) {
        piperParsedList = data;
        shouldFetchCloud = false;
        console.log("命中本地模型列表缓存，跳过云端请求");
      }
    }

    if (shouldFetchCloud) {
      console.log("无缓存或缓存已过期，正在从云端获取最新列表...");
      const res = await fetch("https://huggingface.co/rhasspy/piper-voices/raw/main/voices.json");
      const data = await res.json();

      for (const key in data) {
        const voice = data[key];
        if (voice.language.family !== "zh" && voice.language.family !== "en") continue;

        const blackList = ["chaowen", "xiao_ya"];
        if (blackList.includes(voice.name)) {
          console.log(`[模型过滤] 剔除不兼容 C++ 引擎的模型: ${voice.name}`);
          continue;
        }

        const onnxFilePath = Object.keys(voice.files).find((f) => f.endsWith(".onnx"));
        if (!onnxFilePath) continue;

        const sizeBytes = voice.files[onnxFilePath].size_bytes;
        const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1) + " MB";
        const fileName = onnxFilePath.split("/").pop() as string;

        piperParsedList.push({
          id: key,
          name: voice.name,
          speakerName: voice.name,
          language: voice.language.family,
          quality: voice.quality,
          size: sizeMB,
          url: `https://huggingface.co/rhasspy/piper-voices/resolve/main/${onnxFilePath}?download=true`,
          fileName: fileName,
          engine: "Piper",
          status: "none",
          progress: 0
        });
      }

      // 将清洗后的 Piper 列表存入缓存
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data: piperParsedList
        })
      );
    }
    // 把本地自定义的 Kokoro 放在最前面，后面跟着 Piper 官方库
    allModels.value = [...customModels, ...piperParsedList];
  } catch (error) {
    console.error("获取模型列表失败:", error);
    window.$message?.error(t("setting.live2d.msg.fetchModelListFailed"));

    // 如果断网报错了，兜底策略：看看缓存里有没有老的，有就凑合用
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      allModels.value = JSON.parse(cachedData).data;
    }
  } finally {
    isLoading.value = false;
  }
};

/**
 * 开始下载语音模型
 * @param model 要下载的模型
 * @returns 下载完成后的本地文件路径
 */
const startDownload = async (model: VoiceModel) => {
  model.status = "downloading";
  model.progress = 0;
  try {
    if (model.engine === "Kokoro") {
      const baseUrl = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main";
      // 这是 transformers.js 离线运行必备的 5 个文件
      const fileList = [
        { url: `${baseUrl}/config.json`, path: "kokoro/config.json" },
        { url: `${baseUrl}/tokenizer.json`, path: "kokoro/tokenizer.json" },
        { url: `${baseUrl}/tokenizer_config.json`, path: "kokoro/tokenizer_config.json" },
        {
          url: `${baseUrl}/voices/${model.voiceId}.bin`,
          path: `kokoro/voices/${model.voiceId}.bin`
        },
        // 大文件放在最后，用它来显示进度条
        { url: `${baseUrl}/onnx/model_quantized.onnx`, path: "kokoro/onnx/model_quantized.onnx" }
      ];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // 如果是最后一个大文件，我们才监听进度
        if (i === fileList.length - 1) {
          const safeName = file.path.replace(/\//g, "_").replace(/\./g, "_");
          const eventName = `download-progress-${safeName}`;
          const unlisten = await listen<number>(eventName, (event) => {
            model.progress = Math.floor(event.payload);
          });
          unlistenFns.push(unlisten);

          await invoke(TauriCommandEnum.DOWNLOAD_MODEL_FILE, { url: file.url, fileName: file.path });
          unlisten();
        } else {
          try {
            await invoke(TauriCommandEnum.DOWNLOAD_MODEL_FILE, { url: file.url, fileName: file.path });
          } catch (e) {
            console.warn(`下载配置文件 ${file.path} 失败，可能不影响运行，已跳过。报错:`, e);
          }
        }
      }
    } else {
      // Piper 引擎下载策略
      const safeName = model.fileName.replace(/\./g, "_");
      const eventName = `download-progress-${safeName}`;
      const unlisten = await listen<number>(eventName, (event) => {
        model.progress = Math.floor(event.payload);
      });
      unlistenFns.push(unlisten);

      // 下载主模型 (.onnx 大文件)，显示进度条
      await invoke(TauriCommandEnum.DOWNLOAD_MODEL_FILE, {
        url: model.url,
        fileName: model.fileName
      });
      unlisten();

      // 悄悄下载配置文件 (.onnx.json 小文件)，不干扰进度条
      try {
        // 将 url 中的 .onnx?download=true 替换为 .onnx.json?download=true
        const jsonUrl = model.url.replace(".onnx?download=true", ".onnx.json?download=true");
        const jsonFileName = `${model.fileName}.json`;
        await invoke(TauriCommandEnum.DOWNLOAD_MODEL_FILE, {
          url: jsonUrl,
          fileName: jsonFileName
        });
      } catch (e) {
        console.warn(`下载 Piper 配置文件失败，模型可能无法发声:`, e);
      }
    }
    model.status = "done";
    model.progress = 100;
    window.$message?.success(`${model.name} ${t("setting.live2d.msg.downloadSuccess")}`);
  } catch (error) {
    model.status = "none";
    model.progress = 0;
    console.error("下载失败:", error);
    window.$message?.error(`${t("setting.live2d.msg.downloadFailed")}: ${error}`);
  }
};

/**
 * 处理模型按钮点击事件
 * @param model 要操作的模型
 */
const handleModelAction = async (model: VoiceModel) => {
  const isDownloaded = downloadedModels.value[model.id];
  if (!isDownloaded) {
    // 1. 如果没下载，则走下载流程
    await startDownload(model);
    // 2. 下载完成后，单独检查这一个模型是否真的落地了
    await agentStore.checkModelDownloaded(model);
  } else {
    // 3. 如果已下载，直接交给 Store 切换状态（Store 内部会自动处理互斥和取消激活）
    agentStore.toggleModel(model);
  }
};

onMounted(async () => {
  await fetchOfficialModels();
  // 拿到 allModels 后，批量遍历并生成 downloadedModels 状态字典
  await agentStore.checkAllLocalModels(allModels.value);
});

onUnmounted(() => {
  unlistenFns.forEach((fn) => fn());
});
</script>

<style scoped lang="scss">
.item {
  @apply rounded-8px p-12px border-(solid 1px [--line-color]) box-border size-full bg-[--bg-setting-item];
}

:deep(.n-collapse-item__header) {
  font-size: 15px;
  font-weight: bold;
}
</style>
