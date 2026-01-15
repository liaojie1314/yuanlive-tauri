import { compact } from "es-toolkit";

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
