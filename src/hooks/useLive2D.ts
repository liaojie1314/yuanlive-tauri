import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";

(window as any).PIXI = PIXI;

export const useLive2D = () => {
  const pixiApp = shallowRef<PIXI.Application | null>(null);
  const live2dModel = shallowRef<any>(null);

  let currentFaceTarget: any = null;

  /**
   * 初始化 Live2D 引擎
   * @param canvas 用于渲染的 canvas 元素
   */
  const initEngine = (canvas: HTMLCanvasElement) => {
    pixiApp.value = new PIXI.Application({
      view: canvas,
      autoStart: true,
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
  };

  /**
   * 加载 Live2D 模型
   * @param url 模型文件 URL
   * @param onHit 点击事件回调函数
   */
  const loadModel = async (url: string, onHit?: (hitAreas: string[]) => void) => {
    if (!pixiApp.value) return;

    if (live2dModel.value) {
      pixiApp.value.stage.removeChild(live2dModel.value);
      live2dModel.value.destroy();
    }

    const model = await Live2DModel.from(url);
    live2dModel.value = model;
    pixiApp.value.stage.addChild(model);

    // 自适应布局
    const updateLayout = () => {
      const { width, height } = pixiApp.value!.renderer.screen;
      model.anchor.set(0, 0);
      const rawWidth = model.internalModel.originalWidth || model.width;
      const rawHeight = model.internalModel.originalHeight || model.height;
      const scale = Math.min(width / rawWidth, (height * 0.9) / rawHeight);
      model.scale.set(scale);
      model.x = (width - model.width) / 2;
      model.y = height - model.height;
    };
    updateLayout();
    pixiApp.value.renderer.on("resize", updateLayout);
    if (onHit) model.on("hit", onHit);
    const coreModel = model.internalModel.coreModel as any;
    const originalUpdate = coreModel.update.bind(coreModel);
    // 初始化平滑缓存
    coreModel.__smoothed = { x: 0, y: 0, z: 0, eyeL: 1, eyeR: 1, mouth: 0 };
    coreModel.update = (...args: any[]) => {
      if (currentFaceTarget) {
        const s = coreModel.__smoothed;
        const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

        s.x = lerp(s.x, currentFaceTarget.x, 0.08);
        s.y = lerp(s.y, currentFaceTarget.y, 0.08);
        s.z = lerp(s.z, currentFaceTarget.z, 0.08);
        s.eyeL = lerp(s.eyeL, currentFaceTarget.eyeL, 0.3);
        s.eyeR = lerp(s.eyeR, currentFaceTarget.eyeR, 0.3);
        s.mouth = lerp(s.mouth, currentFaceTarget.mouth, 0.3);

        coreModel.setParameterValueById("ParamAngleX", s.x);
        coreModel.setParameterValueById("ParamAngleY", s.y);
        coreModel.setParameterValueById("ParamAngleZ", s.z);
        coreModel.setParameterValueById("ParamBodyAngleX", s.x * 0.5);
        coreModel.setParameterValueById("ParamEyeLOpen", s.eyeL);
        coreModel.setParameterValueById("ParamEyeROpen", s.eyeR);
        coreModel.setParameterValueById("ParamMouthOpenY", s.mouth);
      }
      originalUpdate(...args);
    };

    return model;
  };

  /**
   * 设置面部追踪目标
   * @param faceTarget 面部追踪目标
   */
  const setFaceTracking = (faceTarget: any | null) => {
    currentFaceTarget = faceTarget;
  };

  /**
   * 触发 Live2D 模型的运动组
   * @param group 动作组名称
   */
  const triggerMotion = (group: string) => live2dModel.value?.motion(group);

  /**
   * 设置 Live2D 模型的焦点位置
   * @param x 焦点位置的 X 坐标
   * @param y 焦点位置的 Y 坐标
   */
  const setFocus = (x: number, y: number) => live2dModel.value?.focus(x, y);

  onBeforeUnmount(() => {
    if (pixiApp.value) pixiApp.value.destroy(true, true);
  });

  return { initEngine, loadModel, setFaceTracking, triggerMotion, setFocus, live2dModel };
};
