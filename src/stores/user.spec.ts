import { useUserStore } from "./user";
import { getUserInfoApi } from "@/api/user";
import { getUserResourceDir, getUserAbsoluteResourceDir } from "@/utils/PathUtils";

// 🎭 魔法拦截器 (Mock)：切断所有对外部网络和底层系统的真实调用
vi.mock("@/api/user", () => ({
  // 把真正的 API 替换成一个受我们控制的“假函数” (Spy)
  getUserInfoApi: vi.fn()
}));

vi.mock("@/utils/PathUtils", () => ({
  getUserResourceDir: vi.fn(),
  getUserAbsoluteResourceDir: vi.fn()
}));

describe("User Store 状态管理测试", () => {
  beforeEach(() => {
    // 每次运行测试前，必须挂载一个全新的 Pinia 实例
    // 这样能保证每个 it() 都是干净的环境，互相不污染数据
    setActivePinia(createPinia());
    // 清空前面测试留下的所有 Mock 调用记录
    vi.clearAllMocks();
  });

  it("初始状态下，userInfo 应该为空 (undefined)", () => {
    const store = useUserStore();
    expect(store.userInfo).toBeUndefined();
  });

  it("getUserDetail 成功时，应更新 userInfo，并返回获取到的数据", async () => {
    const store = useUserStore();
    const mockResData = { uid: "10086", username: "测试玩家", avatar: "xxx" };
    // 让假 API 返回成功的数据
    vi.mocked(getUserInfoApi).mockResolvedValueOnce(mockResData);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await store.getUserDetail();
    expect(getUserInfoApi).toHaveBeenCalledTimes(1);
    expect(store.userInfo).toEqual(mockResData);
    expect(result).toEqual(mockResData);
    consoleSpy.mockRestore();
  });

  it("getUserDetail 失败时，不应修改 userInfo，打印 error 并向外抛出异常", async () => {
    const store = useUserStore();
    const mockError = new Error("网络连接超时");
    // 让假 API 模拟网络崩溃
    vi.mocked(getUserInfoApi).mockRejectedValueOnce(mockError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // 我们期望 store.getUserDetail() 这个动作会被 reject，并且抛出的错误包含 '网络连接超时'
    await expect(store.getUserDetail()).rejects.toThrow("网络连接超时");
    expect(getUserInfoApi).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("获取用户详情失败:", mockError);
    expect(store.userInfo).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it("getUserDir 应调用 PathUtils 并且传入当前 store 里的 uid", async () => {
    const store = useUserStore();
    // 先“伪造”一个已登录的状态
    store.userInfo = { uid: "Tauri123" } as any;
    // 告诉假工具函数：返回一个伪造的路径
    vi.mocked(getUserResourceDir).mockResolvedValueOnce("/fake/local/dir");
    const result = await store.getUserDir();
    // 验证它有没有拿正确的 uid 去调用底层工具
    expect(getUserResourceDir).toHaveBeenCalledWith("Tauri123");
    // 验证它的返回值透传是否正确
    expect(result).toBe("/fake/local/dir");
  });

  it("getUserAbsoluteDir 应调用 PathUtils 并且传入正确的 uid", async () => {
    const store = useUserStore();
    store.userInfo = { uid: "Tauri999" } as any;
    vi.mocked(getUserAbsoluteResourceDir).mockResolvedValueOnce("C:\\Fake\\Absolute\\Dir");
    const result = await store.getUserAbsoluteDir();
    expect(getUserAbsoluteResourceDir).toHaveBeenCalledWith("Tauri999");
    expect(result).toBe("C:\\Fake\\Absolute\\Dir");
  });
});
