/** 文件图标映射关系表 */
const fileSuffixMap: Record<string, string> = {
  cad: "cad",
  psd: "psd",
  doc: "doc",
  docx: "docx",
  csv: "csv",
  xls: "xls",
  xlsx: "xls",
  pdf: "pdf",
  ppt: "ppt",
  pptx: "ppt",
  zip: "zip",
  css: "css",
  gitignore: "gitignore",
  html: "html",
  java: "java",
  js: "js",
  json: "json",
  jsx: "jsx",
  less: "less",
  py: "py",
  scss: "scss",
  sql: "sql",
  stylus: "stylus",
  ts: "ts",
  vue: "vue",
  txt: "txt",
  md: "md",
  mov: "mov",
  mp4: "mp4",
  avi: "mp4",
  rmvb: "mp4",
  mkv: "mp4",
  wmv: "mp4",
  flv: "mp4",
  webm: "mp4",
  m4v: "mp4",
  mp3: "mp3"
};

/**
 * 获取文件对应的Icon
 * @param fileName 文件名
 * @returns Icon
 */
export const getFileSuffix = (fileName: string): string => {
  if (!fileName) return "other";

  const suffix = fileName.toLowerCase().split(".").pop();
  if (!suffix) return "other";

  return fileSuffixMap[suffix] || "other";
};

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
 * @param text 要格式化的文本
 * @param maxLength 最大非空格字符数
 * @param omission 截断后追加的省略号
 * @returns 格式化后的文本
 */
export const formatBottomText = (text: string, maxLength = 6, omission = "...") => {
  const pureText = text.replace(/\s/g, "");
  const hasChinese = /[\u4e00-\u9fa5]/.test(pureText);
  if (hasChinese || pureText.length <= maxLength) {
    return text;
  }

  const nonSpaceIndexes = Array.from(text)
    .map((char, idx) => (char.trim().length > 0 ? idx : undefined))
    .filter((idx) => idx !== undefined) as number[];

  const cutIndex = nonSpaceIndexes[maxLength - 1] ?? text.length - 1;
  return `${text.slice(0, cutIndex + 1).trimEnd()}${omission}`;
};

/**
 * 格式化时间 (秒 -> mm:ss)
 * @param time 时间（秒）
 * @returns 格式化后的时间字符串
 */
export const formatSecondsToTimeStr = (time: number) => {
  if (Number.isNaN(time) || !Number.isFinite(time)) return "00:00";
  const m = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

/**
 * 格式化时间 (mm:ss -> 秒)
 * @param timeStr 时间字符串（mm:ss）
 * @returns 格式化后的时间（秒）
 */
export const formatTimeStrToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return -1; // 格式错误
};

/**
 * 格式化数字 (支持 i18n 自动单位转换)
 * @param num 需要格式化的数字
 * @param locale 当前的语言环境，默认为 'zh-CN'
 */
export const formatNumber = (num: number, locale: string = "zh-CN"): string => {
  return new Intl.NumberFormat(locale, {
    notation: "compact", // 开启紧凑模式 (自动使用 万、亿、K、M 等单位)
    maximumFractionDigits: 1 // 最多保留1位小数，且会自动去除末尾的 .0
  }).format(num);
};

/**
 * 格式化时间戳显示 (yyyy-MM-dd HH:mm)
 * @param timestamp 时间戳
 * @returns 格式化后的时间字符串
 */
export const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${m}-${d} ${hh}:${mm}`;
};
