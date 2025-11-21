import path from "node:path";

/**
 * 获取项目根路径
 * @returns 项目根目录,末尾不带斜杠
 */
export const getRootPath = () => {
  return path.resolve(__dirname, process.cwd());
};

/**
 * 获取项目主路径
 * @param mainName 目录名称，默认src
 * @returns 主目录路径,末尾不带斜杠
 */
export const getSrcPath = (mainName = "src") => {
  const rootPath = getRootPath();
  return `${rootPath}/${mainName}`;
};
