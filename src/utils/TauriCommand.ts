import { invoke } from "@tauri-apps/api/core";

import { TauriCommandEnum } from "@/enums";

type Settings = {
  baseUrl: string;
  wsUrl: string;
};

/**
 * 更新网络配置
 * @param settings 网络配置
 * @returns 更新结果
 */
export const updateSettings = async (settings: Settings) => {
  return await invoke(TauriCommandEnum.UPDATE_SETTINGS, { settings });
};

/**
 * 获取网络配置
 * @returns 网络配置
 */
export const getSettings = async () => {
  return await invoke<Settings>(TauriCommandEnum.GET_SETTINGS);
};
