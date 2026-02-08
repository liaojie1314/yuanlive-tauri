import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join, resourceDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, readFile } from "@tauri-apps/plugin-fs";

import { TauriCommandEnum } from "@/enums";
import { isMobile } from "./PlatformUtils";

// Tauri 资源目录下存放用户数据的根目录名
const USER_DATA = "userData";

/**
 * 确保资源目录下存在 userData 根目录。
 * Tauri 在构建后默认不会创建该目录，需要在第一次使用前主动创建。
 */
const ensureUserDataRoot = async (): Promise<void> => {
  const baseDir = isMobile() ? BaseDirectory.AppData : BaseDirectory.Resource;
  const dirExists = await exists(USER_DATA, { baseDir });
  if (!dirExists) {
    await mkdir(USER_DATA, {
      baseDir,
      recursive: true
    });
  }
};

/**
 * 获取 userData 根目录
 * @returns userData 根目录的绝对路径
 */
export const getUserDataRootAbsoluteDir = async (): Promise<string> => {
  await ensureUserDataRoot();
  const baseDirPath = isMobile() ? await appDataDir() : await resourceDir();
  return await join(baseDirPath, USER_DATA);
};

/**
 * 获取用户资源文件夹（userData/uid），并确保整个路径存在。
 * @param uid 用户ID
 */
export const getUserResourceDir = async (uid: string): Promise<string> => {
  await ensureUserDataRoot();
  // 确保用户ID的子目录也存在
  const userDir = await join(USER_DATA, uid);
  const baseDir = isMobile() ? BaseDirectory.AppData : BaseDirectory.Resource;
  const userDirExists = await exists(userDir, { baseDir });
  if (!userDirExists) {
    await mkdir(userDir, {
      baseDir,
      recursive: true
    });
  }
  return userDir;
};

/**
 * 获取用户视频缓存目录的绝对路径。
 * @param uid 用户ID
 * @returns 用户视频缓存目录的绝对路径
 */
export const getUserAbsoluteResourceDir = async (uid: string) => {
  const filePath = await getUserResourceDir(uid);
  const baseDirPath = isMobile() ? await appDataDir() : await resourceDir();
  return await join(baseDirPath, filePath);
};

/**
 * 从指定的绝对路径读取文件内容，并返回一个包含文件元数据和文件对象的对象。
 * @param absolutePath 文件的绝对路径
 * @returns 包含文件元数据和文件对象的对象，文件对象为 Blob 类型
 */
export async function getFile(absolutePath: string) {
  const [fileMeta] = await getFilesMeta<FilesMeta>([absolutePath]);
  const fileData = await readFile(absolutePath);
  const fileName = fileMeta.name;
  const blob = new Blob([new Uint8Array(fileData)]);
  const fileType = fileMeta?.mime_type || fileMeta?.file_type;
  return {
    file: new File([blob], fileName, { type: fileType }),
    meta: fileMeta
  };
}

/**
 * 获取用户图片缓存目录路径。
 * @param subFolder 子目录名，用于分类存储不同类型的图片。
 * @param userUid 用户唯一标识，用于区分不同用户的缓存。
 * @returns 图片缓存目录的绝对路径，格式为 cache/userUid/subFolder/
 */
export const getImageCache = (subFolder: string, userUid: string): string => {
  return "cache/" + String(userUid) + "/" + subFolder + "/";
};

/**
 * 调用后端命令获取指定路径或远程 URL 文件的元数据信息。
 *
 * @template T - 返回的元数据类型，一般为 FilesMeta 类型或其扩展。
 * @param filesPath - 文件路径数组，支持传入本地绝对路径或远程文件 URL，批量查询。
 * @returns 返回一个 Promise，解析后为指定泛型 T 类型的数据。
 *
 * @example
 * interface FilesMeta {
 *   exists: boolean
 *   file_type: string // ext格式的文件类型
 *   mime_type: string // mime格式的文件类型
 * }
 *
 * // 查询本地绝对路径文件元信息
 * const meta = await getFilesMeta<FilesMeta>(['C:\\Users\\User\\Documents\\file.docx'])
 * if (meta[0].exists) {
 *   console.log('文件存在，类型为', meta[0].file_type)
 * }
 *
 * // 查询远程 URL 文件元信息
 * const metas = await getFilesMeta<FilesMeta>(['https://example.com/file.pdf'])
 * metas.forEach(m => console.log(m.file_type))
 */
export async function getFilesMeta<T>(filesPath: string[]) {
  return invoke<T>(TauriCommandEnum.GET_FILES_META, {
    filesPath
  });
}
