<template>
  <div class="flex flex-col h-screen w-full overflow-hidden bg-[var(--tray-bg-color)]">
    <action-bar :interceptClose="true" @close-intercepted="requestSafeClose" />

    <div class="flex-1 relative size-full bg-[var(--tray-bg-color)]">
      <iframe
        ref="drawioIframeRef"
        class="size-full border-none outline-none"
        :src="iframeSrc"
        @load="handleIframeLoad"></iframe>

      <div
        v-if="!isDrawioReady"
        style="background: var(--bg-menu)"
        class="absolute inset-0 flex-center backdrop-blur-sm z-10">
        <n-spin size="large" :description="t('plugins.drawio.loading')" />
      </div>
    </div>

    <div
      style="border-color: var(--line-color)"
      class="h-auto min-h-60px p-12px border-t bg-[var(--input-area-bg)] flex items-end gap-12px">
      <n-input
        type="textarea"
        class="flex-1"
        v-model:value="promptText"
        :placeholder="t('plugins.drawio.placeholder')"
        :autosize="{ minRows: 1, maxRows: 4 }"
        @keydown.enter.prevent="handleSendPrompt" />

      <n-button
        secondary
        :style="{
          '--n-border-hover': '1px solid var(--message-render-color)',
          '--n-text-color-hover': 'var(--message-render-color)'
        }"
        @click="triggerExport('png')">
        {{ t("plugins.drawio.exportPNG") }}
      </n-button>

      <n-button
        type="primary"
        :style="{
          '--n-color': 'var(--message-render-color)',
          '--n-color-hover': 'var(--message-render-color)',
          '--n-color-pressed': 'var(--message-render-color)'
        }"
        :loading="isGenerating"
        @click="handleSendPrompt">
        {{ t("plugins.drawio.generate") }}
      </n-button>
    </div>
    <n-modal preset="dialog" type="warning" v-model:show="showExitModal" :title="t('plugins.drawio.msg.warningTitle')">
      <p>{{ t("plugins.drawio.unsavedWarning") }}</p>
      <template #action>
        <n-space>
          <n-button @click="showExitModal = false">
            {{ t("components.common.cancel") }}
          </n-button>
          <n-button type="error" secondary @click="handleDiscardAndClose">
            {{ t("plugins.drawio.discardAndExit") }}
          </n-button>
          <n-button type="primary" @click="handleSaveDraftAndClose">
            {{ t("plugins.drawio.saveDraftAndExit") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile, writeFile } from "@tauri-apps/plugin-fs";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const { t, locale } = useI18n();

const DRAFT_KEY = "drawio_draft_xml";
let unlistenClose: (() => void) | null = null; // 用于存储取消监听的函数
const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";

const showExitModal = ref(false);
const isModified = ref(false);
const promptText = ref("");
const isGenerating = ref(false);
const isDrawioReady = ref(false);
const drawioIframeRef = ref<HTMLIFrameElement | null>(null);
// 通过追加 &theme=dark 让 draw.io 内部也能适配暗黑主题 并根据语言切换语言
const iframeSrc = computed(() => {
  const themeParam = isDarkMode ? "&theme=dark" : "";
  const langParam = `&lang=${getDrawioLang(locale.value)}`;
  return `https://embed.diagrams.net/?embed=1&ui=min&spin=1&proto=json${themeParam}${langParam}`;
});

/**
 * 调用系统原生弹窗，保存 XML 内容到本地为 .drawio 文件
 * @param xmlContent 要保存的 XML 内容
 * @returns {Promise<boolean>} 返回是否成功保存
 */
const handleSaveToFile = async (xmlContent: string): Promise<boolean> => {
  try {
    const filePath = await save({
      title: t("plugins.drawio.save"),
      defaultPath: "未命名图表.drawio",
      filters: [{ name: "Draw.io Diagram", extensions: ["drawio", "xml"] }]
    });

    if (filePath) {
      await writeTextFile(filePath, xmlContent);
      window.$message.success(t("plugins.drawio.msg.saveSuccess"));
      return true;
    }
    return false;
  } catch (error) {
    console.error("保存文件失败:", error);
    window.$message.error(t("plugins.drawio.msg.saveError"));
    return false;
  }
};

/**
 * 获取 draw.io 接受的语言代码
 * @param currentLocale 当前语言代码
 */
const getDrawioLang = (appLocale: string) => {
  const code = appLocale.toLowerCase();
  if (code.includes("zh-tw") || code.includes("zh-hk") || code.includes("zh")) return "zh"; // 简体中文
  return "en"; // 默认回退到英文
};

/**
 * 监听来自 draw.io iframe 的消息
 * @param event 消息事件
 */
const handleDrawioMessage = async (event: MessageEvent) => {
  if (!event.data || typeof event.data !== "string") return;

  try {
    const msg = JSON.parse(event.data);

    // 初始化时：检查是否有草稿
    if (msg.event === "init") {
      isDrawioReady.value = true;

      // 1. 完整的、合法的空白 draw.io XML 数据
      const emptyXml = `<mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>`;

      // 2. 发送配置项，尝试注入 CSS 隐藏原生的导出菜单
      sendToDrawio({
        action: "configure",
        config: {
          css: ".geMenuItem[title^='Export'], .geMenuItem:contains('Export') { display: none !important; }"
        }
      });

      // 3. 安全读取草稿
      const draftXml = localStorage.getItem(DRAFT_KEY);
      let xmlToLoad = emptyXml;

      // 校验草稿是否是合法的 XML (必须以 <mxGraphModel 开头)
      if (draftXml && draftXml.includes("<mxGraphModel")) {
        xmlToLoad = draftXml;
      }

      // 4. 加载画布
      sendToDrawio({
        action: "load",
        xml: xmlToLoad,
        autosave: 1
      });
    }
    // 触发自动保存时：静默写入 localStorage
    if (msg.event === "autosave") {
      if (msg.xml) {
        localStorage.setItem(DRAFT_KEY, msg.xml);
        isModified.value = true;
        console.log("[Draw.io] 草稿已静默保存");
      }
    }
    if (msg.event === "save") {
      // 接收保存结果
      const isSaved = await handleSaveToFile(msg.xml);

      // 只有当用户真的把文件存进了电脑，才清空状态
      if (isSaved) {
        sendToDrawio({ action: "status", modified: false });
        localStorage.removeItem(DRAFT_KEY);
        isModified.value = false;

        if (msg.exit) {
          await getCurrentWebviewWindow().destroy();
        }
      } else {
        console.log("[Draw.io] 用户取消了保存，保持修改状态");
      }
    }
    if (msg.event === "exit") {
      console.log("[Draw.io] 用户点击退出");
      // 关闭当前独立窗口
      await requestSafeClose();
    }
    // 拦截 draw.io 发回的图片导出数据
    if (msg.event === "export") {
      await handleExportToFile(msg.data, msg.format);
    }
  } catch (_) {}
};

/**
 * 统一的安全关闭逻辑
 * 无论是点 ActionBar 的 X，还是原生系统的关闭，都调这个函数
 */
const requestSafeClose = async () => {
  if (isModified.value) {
    showExitModal.value = true;
  } else {
    await getCurrentWebviewWindow().close();
  }
};

/**
 * 选择 [放弃更改并退出]
 */
const handleDiscardAndClose = async () => {
  localStorage.removeItem(DRAFT_KEY); // 清空草稿箱
  isModified.value = false; // 放行标志
  showExitModal.value = false;
  await getCurrentWebviewWindow().close();
};

/**
 * 选择 [暂存草稿并退出]
 */
const handleSaveDraftAndClose = async () => {
  // 不删除 localStorage，直接放行关闭
  isModified.value = false;
  showExitModal.value = false;
  await getCurrentWebviewWindow().close();
};

/**
 * 将 draw.io 返回的 Base64 图片数据通过 Tauri 写入本地电脑
 * @param base64Data draw.io 返回的 Base64 图片数据
 * @param format 导出格式， PNG 或 SVG
 */
const handleExportToFile = async (base64Data: string, format: string) => {
  try {
    const filePath = await save({
      title: t("plugins.drawio.export"),
      defaultPath: `未命名图表.${format}`,
      filters: [{ name: "Images", extensions: [format] }]
    });

    if (!filePath) return;

    // 剥离 data URI 的头部，比如 "data:image/png;base64,"
    const base64Content = base64Data.split(",")[1];

    if (format === "svg") {
      // SVG 通常可以直接解 Base64 存为文本
      const svgString = decodeURIComponent(escape(atob(base64Content)));
      await writeTextFile(filePath, svgString);
    } else {
      // PNG 等图片需要转为 Uint8Array 二进制写入
      const binaryStr = atob(base64Content);
      const buffer = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        buffer[i] = binaryStr.charCodeAt(i);
      }
      await writeFile(filePath, buffer);
    }

    window.$message.success(t("plugins.drawio.msg.exportSuccess", { name: format.toUpperCase() }));
  } catch (error) {
    console.error("导出失败:", error);
    window.$message.error(t("plugins.drawio.msg.exportError"));
  }
};

/**
 * 主动命令 draw.io 将当前画布渲染为图片并回传给我们
 * @param format 导出格式，默认 PNG
 */
const triggerExport = (format: "png" | "svg" = "png") => {
  sendToDrawio({
    action: "export",
    format: format,
    // 参数根据需要调整，scale 控制清晰度
    xml: undefined, // undefined 会默认导出当前画布
    spinKey: "export" // 导出时给画布加个 loading
  });
};

/**
 * 向 draw.io 发送指令的通用封装
 * @param payload 指令 payload
 */
const sendToDrawio = (payload: any) => {
  if (drawioIframeRef.value && drawioIframeRef.value.contentWindow) {
    drawioIframeRef.value.contentWindow.postMessage(JSON.stringify(payload), "*");
  }
};

/** 监听 draw.io iframe 加载完成 事件 */
const handleIframeLoad = () => {
  console.log("Iframe DOM 加载完毕，等待 draw.io init 事件...");
};

/** 处理用户输入的指令，生成 draw.io 图表 */
const handleSendPrompt = async () => {
  if (!promptText.value.trim() || !isDrawioReady.value || isGenerating.value) return;

  isGenerating.value = true;
  promptText.value = ""; // 清空输入框

  try {
    window.$message.loading(t("plugins.drawio.msg.loading"));
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const mockGeneratedXml = `
      <mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
        <root>
          <mxCell id="0"/>
          <mxCell id="1" parent="0"/>
          <mxCell id="2" value="开始" style="ellipse;whiteSpace=wrap;html=1;" vertex="1" parent="1">
            <mxGeometry x="360" y="80" width="120" height="80" as="geometry"/>
          </mxCell>
          <mxCell id="3" value="验证" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
            <mxGeometry x="360" y="240" width="120" height="60" as="geometry"/>
          </mxCell>
          <mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="2" target="3">
            <mxGeometry relative="1" as="geometry"/>
          </mxCell>
        </root>
      </mxGraphModel>
    `;

    sendToDrawio({
      action: "load",
      xml: mockGeneratedXml,
      autosave: 1
    });
    localStorage.setItem(DRAFT_KEY, mockGeneratedXml);
    isModified.value = true;
    window.$message.success(t("plugins.drawio.msg.success"));
  } catch (error) {
    window.$message.error(t("plugins.drawio.msg.error"));
    console.error(error);
  } finally {
    isGenerating.value = false;
  }
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  window.addEventListener("message", handleDrawioMessage);

  unlistenClose = await getCurrentWebviewWindow().onCloseRequested((event) => {
    if (isModified.value) {
      event.preventDefault();
      setTimeout(() => requestSafeClose(), 50);
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("message", handleDrawioMessage);
  if (unlistenClose) unlistenClose();
});
</script>

<style scoped></style>
