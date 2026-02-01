import { compact } from "es-toolkit";

/**
 * 从文件路径中提取文件名
 * @param path 文件路径
 * @returns 文件名
 */
export const extractFileName = (path: string): string => {
  // 同时处理 Unix 和 Windows 路径分隔符
  const fileName = path.split(/[/\\]/).pop();
  return fileName || "file";
};

/**
 * 文件大小格式化
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export const formatBytes = (bytes: number): string => {
  if (bytes <= 0 || isNaN(bytes)) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const base = 1024;
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
  const size = parseFloat((bytes / base ** unitIndex).toFixed(2));
  return size + " " + units[unitIndex];
};

/**
 * 非中文文本超过指定非空格字符数时截断并追加省略号
 */
export const formatBottomText = (text: string, maxLength = 6, omission = "...") => {
  const pureText = text.replace(/\s/g, "");
  const hasChinese = /[\u4e00-\u9fa5]/.test(pureText);
  if (hasChinese || pureText.length <= maxLength) {
    return text;
  }
  const nonSpaceIndexes = compact(Array.from(text).map((char, idx) => (char.trim().length > 0 ? idx : undefined)));
  const cutIndex = nonSpaceIndexes[maxLength - 1] ?? text.length - 1;
  return `${text.slice(0, cutIndex + 1).trimEnd()}${omission}`;
};
