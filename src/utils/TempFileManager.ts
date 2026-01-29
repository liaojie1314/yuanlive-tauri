import { BaseDirectory, remove } from "@tauri-apps/plugin-fs";
import { isMobile } from "@/utils/PlatformUtils";

export type RemoveTempFileOptions = {
  /**
   * 指定基础目录；不传则根据平台自动选择 AppData / AppCache。
   * 传入 null 则按绝对路径删除。
   */
  baseDir?: BaseDirectory | null;
  /**
   * 日志前缀，方便定位调用来源。
   */
  reason?: string;
  /**
   * 是否静默失败，默认 false（打印 warn）。
   */
  silent?: boolean;
};

/**
 * 获取默认的临时文件存储目录，根据平台自动选择 AppData / AppCache。
 */
const getDefaultBaseDir = () => (isMobile() ? BaseDirectory.AppData : BaseDirectory.AppCache);

/**
 * 标准化文件路径，将 Windows 风格的反斜杠替换为正斜杠。
 */
const normalizeFsPath = (path: string) => path.replace(/\\/g, "/");

/**
 * 判断是否需要跳过删除，例如远程资源或 blob URL。
 */
const shouldSkipRemoval = (path?: string | null) => {
  if (!path) return true;
  // 远程资源或 blob URL 无需删除
  return /^https?:\/\//i.test(path) || path.startsWith("blob:");
};

/**
 * 删除临时文件，支持根据平台自动选择 AppData / AppCache 目录。
 * @param path 临时文件路径，支持 file:// 协议。
 * @param options 配置项，包含基础目录、日志前缀和是否静默失败。
 * @returns Promise<void>
 */
export const removeTempFile = async (path?: string | null, options: RemoveTempFileOptions = {}) => {
  if (shouldSkipRemoval(path)) return;

  const normalizedPath = normalizeFsPath(path!);
  const baseDir = options.baseDir === undefined ? getDefaultBaseDir() : options.baseDir;
  const removeOptions = baseDir ? { baseDir } : undefined;

  try {
    await remove(normalizedPath, removeOptions);
  } catch (error) {
    if (!options.silent) {
      const prefix = options.reason ?? "删除临时文件失败";
      console.warn(`${prefix}:`, error);
    }
  }
};
