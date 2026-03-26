import { mount } from "@vue/test-utils";

import AvatarCropper from "./AvatarCropper.vue";
import * as PlatformUtils from "@/utils/PlatformUtils";

// 拦截 vue-i18n
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

// 拦截平台判断工具
vi.mock("@/utils/PlatformUtils", () => ({
  isMac: vi.fn(),
  isWindows: vi.fn()
}));

// 直接劫持整个 naive-ui 库
// 不管 unplugin-vue-components 怎么自动导入，拿到的都是我们给的假组件
vi.mock("naive-ui", () => ({
  NModal: {
    name: "NModal",
    template: '<div class="mock-modal" v-if="show"><slot /></div>',
    props: ["show"]
  },
  NButton: {
    name: "NButton",
    template: '<button class="mock-btn" @click="$emit(\'click\')"><slot /></button>'
  },
  NFlex: {
    name: "NFlex",
    template: '<div class="mock-flex"><slot /></div>'
  }
}));

// 直接劫持 vue-cropper 库
vi.mock("vue-cropper", () => ({
  VueCropper: {
    name: "VueCropper",
    template: '<div class="vue-cropper-stub"></div>',
    methods: {
      getCropBlob(cb: (blob: Blob) => void) {
        cb(new Blob(["fake-image-data"], { type: "image/png" }));
      }
    }
  }
}));

// 🧪 测试用例
describe("AvatarCropper 组件测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认平台返回值
    vi.mocked(PlatformUtils.isMac).mockReturnValue(false);
    vi.mocked(PlatformUtils.isWindows).mockReturnValue(false);
  });

  // 挂载函数现在变得极简，因为不需要配置 stubs 了！
  const createWrapper = (props = {}) => {
    return mount(AvatarCropper, {
      props: {
        show: true,
        imageUrl: "test-image.jpg",
        ...props
      }
    });
  };

  it("传入 imageUrl 时，应正确初始化组件", () => {
    const wrapper = createWrapper({ imageUrl: "https://yuanlive.com/avatar.png" });

    expect(wrapper.exists()).toBe(true);
    // 因为真实的 NModal 被劫持了，内容不会再飞到 body 里！
    expect(wrapper.text()).toContain("components.avatarCropper.title");
  });

  it("点击取消按钮时，应触发 update:show 事件关闭弹窗", async () => {
    const wrapper = createWrapper();

    // 寻找被我们劫持的假按钮
    const buttons = wrapper.findAll(".mock-btn");
    const cancelBtn = buttons[0];

    await cancelBtn.trigger("click");

    expect(wrapper.emitted("update:show")).toBeTruthy();
    expect(wrapper.emitted("update:show")![0]).toEqual([false]);
  });

  it("点击确认裁剪时，应进入 loading 状态，并抛出 crop 事件与 Blob 数据", async () => {
    const wrapper = createWrapper();

    const confirmBtn = wrapper.findAll(".mock-btn")[1];
    await confirmBtn.trigger("click");

    expect(wrapper.text()).toContain("components.avatarCropper.uploading");

    const cropEvents = wrapper.emitted("crop");
    expect(cropEvents).toBeTruthy();

    const emittedBlob = cropEvents![0][0] as Blob;
    expect(emittedBlob).toBeInstanceOf(Blob);
    expect(emittedBlob.type).toBe("image/png");
  });

  it("组件对外暴露的 finishLoading 方法可以正确关闭 loading 状态", async () => {
    const wrapper = createWrapper();

    await wrapper.findAll(".mock-btn")[1].trigger("click");
    expect(wrapper.text()).toContain("components.avatarCropper.uploading");

    wrapper.vm.finishLoading();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("components.common.confirm");
  });

  it("在 Windows 平台下，应渲染专属的关闭图标", () => {
    vi.mocked(PlatformUtils.isWindows).mockReturnValue(true);

    const wrapper = createWrapper();
    expect(wrapper.find("svg.cursor-pointer").exists()).toBe(true);
  });

  it("在 Mac 平台下，应渲染专属的红绿灯关闭图标", () => {
    vi.mocked(PlatformUtils.isMac).mockReturnValue(true);

    const wrapper = createWrapper();
    expect(wrapper.find(".mac-close").exists()).toBe(true);
  });
});
