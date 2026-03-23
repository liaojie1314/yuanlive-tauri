import { invoke } from "@tauri-apps/api/core";

import { TauriCommandEnum } from "@/enums";

export type UpdateSettingsPeq = {
  baseUrl: string;
  wsUrl: string;
};

export const updateSettings = async (settings: UpdateSettingsPeq) => {
  return await invoke(TauriCommandEnum.UPDATE_SETTINGS, { settings });
};
