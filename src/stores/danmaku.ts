import { defineStore } from "pinia";
import { StoresEnum } from "../enums";

/**
 * 弹幕设置Store
 * 统一管理所有弹幕的设置
 */
export const useDanmakuStore = defineStore(
  StoresEnum.DANMAKU,
  () => {
    // 弹幕位置，目前只有scroll类型
    const position = ref<"scroll">("scroll");

    // 弹幕字体大小，默认16px
    const fontSize = ref<number>(16);

    // 弹幕透明度，默认100%
    const opacity = ref<number>(100);

    // 弹幕速度，默认2
    const speed = ref<number>(2);

    // 弹幕显示区域，默认3/5
    const displayArea = ref<number>(3);

    // 弹幕开关状态，默认开启
    const enabled = ref<boolean>(true);

    /**
     * 设置弹幕字体大小
     * @param size 字体大小
     */
    const setFontSize = (size: number) => {
      fontSize.value = size;
    };

    /**
     * 设置弹幕透明度
     * @param value 透明度值（0-100）
     */
    const setOpacity = (value: number) => {
      opacity.value = value;
    };

    /**
     * 设置弹幕速度
     * @param value 速度值（1-5）
     */
    const setSpeed = (value: number) => {
      speed.value = value;
    };

    /**
     * 设置弹幕显示区域
     * @param value 显示区域值（1-5）
     */
    const setDisplayArea = (value: number) => {
      displayArea.value = value;
    };

    /**
     * 设置弹幕开关状态
     * @param value 开关状态
     */
    const setEnabled = (value: boolean) => {
      enabled.value = value;
    };

    /**
     * 重置弹幕设置到默认值
     */
    const resetSettings = () => {
      fontSize.value = 16;
      opacity.value = 100;
      speed.value = 2;
      displayArea.value = 3;
      enabled.value = true;
    };

    return {
      // 状态
      position,
      fontSize,
      opacity,
      speed,
      displayArea,
      enabled,

      // 方法
      setFontSize,
      setOpacity,
      setSpeed,
      setDisplayArea,
      setEnabled,
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
