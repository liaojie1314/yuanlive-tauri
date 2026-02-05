import { stat } from "@tauri-apps/plugin-fs";
import { extractFileName } from "@/utils/FormattingUtils";

/**
 * 上传文件类型（支持浏览器 File 与 Tauri 路径文件）
 */
export type PathUploadFile = {
  kind: "path";
  path: string;
  name: string;
  size: number;
  type: string;
};

export type UploadFile = File | PathUploadFile;

class FileUtil {
  /**
   * 将选中的文件路径列表和文件元数据列表转换为路径文件对象列表
   * @param files 选中的文件路径列表
   * @param filesMeta 选中的文件元数据列表
   * @returns 路径文件对象列表
   */
  static async map2PathUploadFile(files: string[], filesMeta: FilesMeta): Promise<PathUploadFile[]> {
    return await Promise.all(
      files.map(async (path) => {
        const fileMeta = filesMeta.find((f) => f.path === path);
        const fileName = fileMeta?.name || extractFileName(path);
        const fileType = fileMeta?.mime_type || "application/octet-stream";

        let size = 0;
        try {
          size = (await stat(path)).size;
        } catch (error) {
          console.error("[FileUtil] 获取文件大小失败:", error);
        }

        return {
          kind: "path",
          path,
          name: fileName,
          size,
          type: fileType
        };
      })
    );
  }
}

export default FileUtil;
