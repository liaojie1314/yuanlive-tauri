import { mount } from "@vue/test-utils";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

import { useCamera } from "./useCamera";

// 拦截 Tauri 插件
vi.mock("@tauri-apps/plugin-dialog", () => ({ save: vi.fn() }));
vi.mock("@tauri-apps/plugin-fs", () => ({ writeFile: vi.fn() }));

// 🧪 测试辅助类：哑组件包裹器
// 为了让 onUnmounted 能够正常触发，我们必须把 Hook 放在组件的 setup 里执行
function mountComposable() {
  let hookResult: ReturnType<typeof useCamera>;
  const TestComponent = defineComponent({
    setup() {
      hookResult = useCamera();
      return () => null; // 连 HTML 都不需要渲染，纯空壳
    }
  });
  const wrapper = mount(TestComponent);
  return { wrapper, hook: hookResult! };
}

describe("useCamera Hook 测试", () => {
  // 伪造浏览器的 MediaStream 和 Track
  const mockTrack = { stop: vi.fn() };
  const mockStream = { getTracks: () => [mockTrack] };

  // 伪造浏览器的 navigator.mediaDevices
  const mockGetUserMedia = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // 强制把假的 getUserMedia 塞给全局 navigator
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
      writable: true
    });
  });

  it("初始状态应为关闭，照片为空", () => {
    const { hook } = mountComposable();
    expect(hook.isCameraOpen.value).toBe(false);
    expect(hook.photoUrl.value).toBe("");
  });

  it("startCamera 成功时，应挂载媒体流并播放，状态变为开启", async () => {
    const { hook } = mountComposable();
    mockGetUserMedia.mockResolvedValueOnce(mockStream);
    // 伪造一个 video 元素
    const mockVideo = {
      srcObject: null,
      play: vi.fn().mockResolvedValue(undefined)
    } as unknown as HTMLVideoElement;
    await hook.startCamera(mockVideo);
    expect(mockGetUserMedia).toHaveBeenCalled();
    // 验证流是否成功绑给了 video 元素
    expect(mockVideo.srcObject).toBe(mockStream);
    // 验证是否调用了 play 自动播放
    expect(mockVideo.play).toHaveBeenCalled();
    expect(hook.isCameraOpen.value).toBe(true);
  });

  it("startCamera 失败时，应向外抛出异常并保持关闭状态", async () => {
    const { hook } = mountComposable();
    mockGetUserMedia.mockRejectedValueOnce(new Error("无权限"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockVideo = { play: vi.fn() } as unknown as HTMLVideoElement;
    // 断言是否正确向外抛出了特定文案的异常
    await expect(hook.startCamera(mockVideo)).rejects.toThrow("无法访问摄像头，请检查权限或设备连接");
    expect(hook.isCameraOpen.value).toBe(false);
    consoleSpy.mockRestore();
  });

  it("stopCamera 应停止所有媒体轨，并关闭状态", async () => {
    const { hook } = mountComposable();
    mockGetUserMedia.mockResolvedValueOnce(mockStream);
    const mockVideo = { play: vi.fn() } as unknown as HTMLVideoElement;
    await hook.startCamera(mockVideo); // 先打开
    hook.stopCamera(); // 再关闭
    // 验证底层的 track.stop() 是否被调用，红灯是否熄灭
    expect(mockTrack.stop).toHaveBeenCalled();
    expect(hook.isCameraOpen.value).toBe(false);
  });

  it("takePhoto 应正确调用 canvas API 绘制图像并生成 Base64", () => {
    const { hook } = mountComposable();
    // 伪造 Video 源
    const mockVideo = { videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement;
    // 伪造 Canvas API 绘图上下文
    const mockContext = {
      save: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn()
    };
    const mockDataUrl = "data:image/png;base64,ZmFrZURhdGE="; // fakeData 的 base64
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockContext),
      toDataURL: vi.fn().mockReturnValue(mockDataUrl)
    } as unknown as HTMLCanvasElement;
    hook.takePhoto(mockVideo, mockCanvas);
    // 验证 Canvas 尺寸是否和 Video 同步
    expect(mockCanvas.width).toBe(1920);
    expect(mockCanvas.height).toBe(1080);
    // 验证镜像翻转逻辑被正确执行
    expect(mockContext.scale).toHaveBeenCalledWith(-1, 1);
    expect(mockContext.drawImage).toHaveBeenCalled();
    // 验证照片 URL 是否被更新
    expect(hook.photoUrl.value).toBe(mockDataUrl);
  });

  it("savePhotoToDisk - 用户取消保存时，返回 null", async () => {
    const { hook } = mountComposable();
    hook.photoUrl.value = "data:image/png;base64,abc";
    // Tauri save 返回 null 代表用户关掉了保存窗口
    vi.mocked(save).mockResolvedValueOnce(null);
    const result = await hook.savePhotoToDisk();
    expect(result).toBeNull();
    expect(writeFile).not.toHaveBeenCalled(); // 没拿到路径，绝对不能去写文件
  });

  it("savePhotoToDisk - 保存成功时，应将 Base64 转为 Uint8Array 并写入 Tauri fs", async () => {
    const { hook } = mountComposable();
    // 提供一个真实的 Base64 数据以便 atob 能够成功解码 (比如 'YmI=' 解码后是 'bb')
    hook.photoUrl.value = "data:image/png;base64,YmI=";
    // 用户选择的保存路径
    const mockPath = "C:\\Users\\Photo\\selfie.png";
    vi.mocked(save).mockResolvedValueOnce(mockPath);
    vi.mocked(writeFile).mockResolvedValueOnce();
    const result = await hook.savePhotoToDisk();
    // 验证调用了 Tauri 弹窗
    expect(save).toHaveBeenCalled();
    // 验证调用了写入文件 API
    expect(writeFile).toHaveBeenCalled();
    // 截获传递给 writeFile 的参数，验证我们解析的二进制数组是不是正确的 Uint8Array
    const writeArgs = vi.mocked(writeFile).mock.calls[0];
    expect(writeArgs[0]).toBe(mockPath);
    expect(writeArgs[1]).toBeInstanceOf(Uint8Array);
    // 验证返回值是最终的文件路径
    expect(result).toBe(mockPath);
  });

  it("组件卸载 (onUnmounted) 时，必须自动触发 stopCamera 清理摄像头资源", async () => {
    const { wrapper, hook } = mountComposable();
    mockGetUserMedia.mockResolvedValueOnce(mockStream);
    const mockVideo = { play: vi.fn() } as unknown as HTMLVideoElement;
    await hook.startCamera(mockVideo);
    expect(hook.isCameraOpen.value).toBe(true);
    // 🚨 销毁包裹它的哑组件，这会触发 useCamera 内部的 onUnmounted
    wrapper.unmount();
    // 验证组件销毁是否连带把摄像头也关了
    expect(mockTrack.stop).toHaveBeenCalled();
    expect(hook.isCameraOpen.value).toBe(false);
  });
});
