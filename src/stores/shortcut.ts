import { StoresEnum } from "@/enums";

// 暴露默认配置，方便组件中恢复默认时使用
export const DEFAULT_SHORTCUTS = {
  like: "Z",
  favorite: "C",
  follow: "G",
  profile: "F",
  comment: "X",
  copyLink: "V",
  recommend: "P",
  dislike: "R",
  toggleDanmaku: "B",
  clearScreen: "J",
  autoPlay: "K",
  fullscreen: "H",
  watchLater: "L",
  miniWindow: "U",
  volumeUp: "Shift+",
  volumeDown: "Shift-",
  pageUp: "ArrowUp",
  pageDown: "ArrowDown",
  forward: "ArrowRight",
  backward: "ArrowLeft",
  playPause: "Space"
};

export type ShortcutConfig = typeof DEFAULT_SHORTCUTS;

export const useShortcutStore = defineStore(StoresEnum.SHORTCUT, () => {
  const shortcuts = ref<ShortcutConfig>({ ...DEFAULT_SHORTCUTS });

  /** 恢复默认方法 */
  const restoreDefaults = () => {
    shortcuts.value = { ...DEFAULT_SHORTCUTS };
  };

  return {
    shortcuts,
    restoreDefaults
  };
});
