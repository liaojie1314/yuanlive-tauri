import type { ComputedRef, Ref } from "vue";
import { open } from "@tauri-apps/plugin-shell";

export type LinkSegment = {
  text: string;
  isLink: boolean;
};

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>;

const LINK_URL_PATTERN = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/gi;

/**
 * 从文本中提取链接片段
 * @param text 包含链接的文本
 * @returns 包含链接片段的数组
 */
export const extractLinkSegments = (text: string): LinkSegment[] => {
  const content = (text || "").replace(/&nbsp;/g, "\u00a0");
  if (!content) return [];

  const segments: LinkSegment[] = [];
  const regex = new RegExp(LINK_URL_PATTERN.source, "gi");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const matchText = match[0];
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      segments.push({
        text: content.slice(lastIndex, startIndex),
        isLink: false
      });
    }

    segments.push({
      text: matchText,
      isLink: true
    });

    lastIndex = startIndex + matchText.length;
  }

  if (lastIndex < content.length) {
    segments.push({
      text: content.slice(lastIndex),
      isLink: false
    });
  }

  return segments;
};

/**
 * 标准化外部 URL，确保它包含协议部分
 * @param url 原始 URL 字符串
 * @returns 标准化后的 URL 字符串
 */
export const normalizeExternalUrl = (url: string) => {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/**
 * 打开外部 URL
 * @param url 要打开的外部 URL 字符串
 */
export const openExternalUrl = async (url: string) => {
  const normalizedUrl = normalizeExternalUrl(url);
  if (!normalizedUrl) return;

  try {
    await open(normalizedUrl);
  } catch (error) {
    console.error("打开链接失败:", error);
    if (typeof window !== "undefined") {
      window.open(normalizedUrl, "_blank", "noreferrer");
    }
  }
};

/**
 * 从文本中提取链接片段
 * @param source 可能是字符串、Ref 或 ComputedRef 的文本源
 * @returns 包含链接片段的数组和打开链接的函数
 */
export const useLinkSegments = (source: MaybeRef<string | null | undefined>) => {
  const segments = computed(() => extractLinkSegments(unref(source) ?? ""));
  return {
    segments,
    openLink: openExternalUrl
  };
};
