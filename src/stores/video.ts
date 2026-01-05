import { defineStore } from "pinia";
import { StoresEnum } from "../enums";

/**
 * 视频设置Store
 * 统一管理所有视频的设置
 */
export const useVideoStore = defineStore(
  StoresEnum.VIDEO,
  () => {
    // 连播状态
    const autoplay = ref<boolean>(false);

    // 清屏状态
    const clearScreen = ref<boolean>(false);

    // 清晰度，默认智能
    const resolution = ref<string>("auto");

    // 倍速，默认1.0
    const playbackRate = ref<number>(1.0);

    // 当前音量，范围0-100，默认60
    const volume = ref<number>(60);

    // 上一次非静音时的音量，范围0-100，默认60
    const lastVolume = ref<number>(60);

    // 静音状态
    const muted = computed(() => volume.value === 0);

    // 监听volume变化，当音量被设置为非0时，保存到lastVolume
    watch(volume, (newValue) => {
      if (newValue !== 0) {
        lastVolume.value = newValue;
      }
    });

    /**
     * 设置连播状态
     * @param value 连播状态
     */
    const setAutoplay = (value: boolean) => {
      autoplay.value = value;
    };

    /**
     * 设置清屏状态
     * @param value 清屏状态
     */
    const setClearScreen = (value: boolean) => {
      clearScreen.value = value;
    };

    /**
     * 设置清晰度
     * @param value 清晰度值
     */
    const setResolution = (value: string) => {
      resolution.value = value;
    };

    /**
     * 设置倍速
     * @param value 倍速值
     */
    const setPlaybackRate = (value: number) => {
      playbackRate.value = value;
    };

    /**
     * 设置音量
     * @param value 音量值（0-100）
     */
    const setVolume = (value: number) => {
      volume.value = Math.max(0, Math.min(100, value));
    };

    /**
     * 切换静音状态
     * 静音时保存当前音量，恢复时使用上次保存的音量
     */
    const toggleMute = () => {
      if (muted.value) {
        // 恢复音量
        volume.value = lastVolume.value;
      } else {
        // 保存当前音量
        lastVolume.value = volume.value;
        volume.value = 0;
      }
    };

    /**
     * 重置视频设置到默认值
     */
    const resetSettings = () => {
      autoplay.value = false;
      clearScreen.value = false;
      resolution.value = "auto";
      playbackRate.value = 1.0;
      volume.value = 60;
      lastVolume.value = 60;
    };

    return {
      // 状态
      autoplay,
      clearScreen,
      resolution,
      playbackRate,
      volume,
      lastVolume,
      muted,

      // 方法
      setAutoplay,
      setClearScreen,
      setResolution,
      setPlaybackRate,
      setVolume,
      toggleMute,
      resetSettings
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
