import type { MessageData, ContentBlock } from "@/types/chat";
import { invoke } from "@tauri-apps/api/core";

function getFileName(path: string) {
  return path.split(/[\\/]/).pop() || "unknown_file";
}

export const generateVideoCover = async (url: string, second: number = 1.0): Promise<string> => {
  if (url.includes("asset.localhost") || url.startsWith("asset://")) {
    try {
      let localPath = url;
      if (url.startsWith("http://asset.localhost/")) {
        localPath = decodeURIComponent(url.replace("http://asset.localhost/", ""));
      } else if (url.startsWith("asset://localhost/")) {
        localPath = decodeURIComponent(url.replace("asset://localhost/", ""));
      }
      return await invoke<string>("extract_video_cover", { videoPath: localPath, second });
    } catch (e) {
      console.error("FFmpeg 提取视频封面失败:", e);
      return "";
    }
  }

  // 远端视频兜底逻辑
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      video.currentTime = second;
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } catch (_) {
        resolve("");
      } finally {
        video.src = "";
        video.load();
      }
    };
    video.onerror = () => resolve("");
    setTimeout(() => resolve(""), 3000);
  });
};

export function normalizeMessage(msg: MessageData): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const baseId = `msg-${msg.id}`;

  const hasThinkingText = typeof msg.thinking === "string" && msg.thinking.trim() !== "";
  const hasToolCalls = Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0;

  // 只要有其一，就渲染思考积木块
  if (hasThinkingText || hasToolCalls) {
    blocks.push({
      type: "thinking",
      id: `${baseId}-think`,
      content: msg.thinking || "",
      duration: msg.thinkingTime || 0,
      toolCalls: msg.toolCalls || []
    });
  }

  const raw = msg.content;

  if (typeof raw === "string") {
    if (raw.trim()) blocks.push({ type: "text", id: `${baseId}-txt`, content: raw });
  } else if (Array.isArray(raw)) {
    raw.forEach((url: string, idx: number) => {
      blocks.push({ type: "image", id: `${baseId}-img-${idx}`, url });
    });
  } else if (typeof raw === "object" && raw !== null) {
    if (raw.text && raw.text.trim()) {
      blocks.push({ type: "text", id: `${baseId}-mix-txt`, content: raw.text });
    }

    if (Array.isArray(raw.images)) {
      raw.images.forEach((url: string, idx: number) =>
        blocks.push({ type: "image", id: `${baseId}-mix-img-${idx}`, url })
      );
    } else if (Array.isArray(raw.videos)) {
      raw.videos.forEach((fileItem: any, idx: number) => {
        const url = typeof fileItem === "string" ? fileItem : fileItem.url;
        const coverImg = typeof fileItem === "string" ? undefined : fileItem.coverImg;
        if (!url) return;
        blocks.push({
          type: "video",
          id: `${baseId}-vid-${idx}`,
          url: url,
          coverImg: coverImg
        });
      });
    } else if (Array.isArray(raw.audios)) {
      raw.audios.forEach((fileItem: any, idx: number) => {
        const url = typeof fileItem === "string" ? fileItem : fileItem.url;
        if (!url) return;
        blocks.push({ type: "audio", id: `${baseId}-aud-${idx}`, url });
      });
    } else if (Array.isArray(raw.files)) {
      raw.files.forEach((fileItem: any, idx: number) => {
        const url = typeof fileItem === "string" ? fileItem : fileItem.url;
        const name = typeof fileItem === "string" ? getFileName(url) : fileItem.name || getFileName(url);
        if (!url) return;
        blocks.push({ type: "file", id: `${baseId}-file-${idx}`, url, name });
      });
    }
  }
  return blocks;
}
