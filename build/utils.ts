import path from "node:path";

// 启动`node`进程时所在工作目录的绝对路径
const root: string = process.cwd();

/**
 * 获取项目根路径
 * @returns 项目根目录,末尾不带斜杠
 */
const getRootPath = () => {
  return path.resolve(__dirname, process.cwd());
};

/**
 * 获取项目主路径
 * @param mainName 目录名称，默认src
 * @returns 主目录路径,末尾不带斜杠
 */
const getSrcPath = (mainName = "src") => {
  const rootPath = getRootPath();
  return `${rootPath}/${mainName}`;
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

export { root, getRootPath, getSrcPath, createManualChunks, wrapperEnv };
