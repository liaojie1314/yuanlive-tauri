import { readdir, stat } from "node:fs";

// 启动`node`进程时所在工作目录的绝对路径
const root: string = process.cwd();

/**
 * 获取项目主路径
 * @param mainName 目录名称，默认src
 * @returns 主目录路径,末尾不带斜杠
 */
const getSrcPath = (mainName = "src") => {
  return `${root}/${mainName}`;
};

/**
 * 需要强制分离到独立 chunk 的模块配置
 * 格式: { 模块路径片段: chunk 名称 }
 */
const manualChunkConfig: Record<string, string> = {
  "src/enums/index.ts": "enums",
  "src/router/index.ts": "router",
  "src/hooks/useLogin.ts": "login-hook",
  "src/utils/TauriInvokeHandler.ts": "tauri-invoke"
};

/**
 * 创建 manualChunks 函数
 * @param dependencies - 项目依赖列表，用于处理 node_modules 的分离
 * @returns manualChunks 函数
 */
const createManualChunks = (dependencies: string[]) => {
  return (id: string): string | undefined => {
    // 移除查询参数以进行精确匹配
    const cleanId = id.split("?")[0];

    // 检查是否需要强制分离到独立 chunk
    for (const [modulePath, chunkName] of Object.entries(manualChunkConfig)) {
      if (cleanId.includes(modulePath)) {
        return chunkName;
      }
    }

    // 处理 node_modules 的分离
    if (id.includes("node_modules")) {
      // 找到匹配的依赖包名
      const matchedDep = dependencies.find((dep) => id.includes(`node_modules/${dep}`));
      if (matchedDep) {
        // 清理包名，移除特殊字符
        return matchedDep.replace(/[@/]/g, "-");
      }
      return "vendor";
    }

    return undefined;
  };
};

/** 处理环境变量 */
const wrapperEnv = (envConf: Recordable): ViteEnv => {
  // 默认值
  const ret: ViteEnv = {
    VITE_CDN: false,
    VITE_COMPRESSION: "none"
  };

  for (const envName of Object.keys(envConf)) {
    let realName = envConf[envName].replace(/\\n/g, "\n");
    realName = realName === "true" ? true : realName === "false" ? false : realName;
    ret[envName] = realName;
    if (typeof realName === "string") {
      process.env[envName] = realName;
    } else if (typeof realName === "object") {
      process.env[envName] = JSON.stringify(realName);
    }
  }
  return ret;
};

const fileListTotal: number[] = [];

/**
 * @description 求数字类型组成数组中的和
 * @param list 数字类型组成数组
 * @returns 求和值
 */
const sum = (arr: number[]) => arr.reduce((acc, cur) => acc + cur, 0);

/**
 * @description 将字节单位智能转化成 `Bytes` 、 `KB` 、 `MB` 、 `GB` 、 `TB` 、 `PB` 、 `EB` 、 `ZB` 、 `YB` 其中的一种
 * @param byte 字节
 * @param digits 四舍五入保留几位小数（默认四舍五入保留两位小数）
 * @returns 智能转化字节单位后的值
 */
const formatBytes = (byte: number, digits = 2) => {
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let index = 0;
  while (byte >= 1024 && index < units.length - 1) {
    byte /= 1024;
    index++;
  }
  return `${byte.toFixed(digits)} ${units[index]}`;
};

/**
 * @description 获取指定文件夹中所有文件的总大小
 * @param options 选项
 * @param options.folder 文件夹路径（默认值：`dist`）
 * @param options.callback 回调函数，参数为文件夹中所有文件的总大小（默认单位：字节）
 * @param options.format 是否格式化字节单位（默认值：`true`）
 */
const getPackageSize = (options) => {
  const { folder = "dist", callback, format = true } = options;
  readdir(folder, (err, files: string[]) => {
    if (err) throw err;
    let count = 0;
    const checkEnd = () => {
      ++count === files.length && callback(format ? formatBytes(sum(fileListTotal)) : sum(fileListTotal));
    };
    files.forEach((item: string) => {
      stat(`${folder}/${item}`, async (err, stats) => {
        if (err) throw err;
        if (stats.isFile()) {
          fileListTotal.push(stats.size);
          checkEnd();
        } else if (stats.isDirectory()) {
          getPackageSize({
            folder: `${folder}/${item}/`,
            callback: checkEnd
          });
        }
      });
    });
    files.length === 0 && callback(0);
  });
};

export { root, getSrcPath, createManualChunks, wrapperEnv, getPackageSize };
