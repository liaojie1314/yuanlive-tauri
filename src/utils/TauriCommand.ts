import { invoke } from "@tauri-apps/api/core";

export type UpdateSettingsPeq = {
  baseUrl: string;
  wsUrl: string;
};

export const updateSettings = async (settings: UpdateSettingsPeq) => {
  return await invoke("update_settings", { settings });
};
