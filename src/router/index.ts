import { type } from "@tauri-apps/plugin-os";
import { invoke } from "@tauri-apps/api/core";
import {
  createRouter,
  createWebHistory,
  type Router,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteRecordRaw
} from "vue-router";

import { TauriCommandEnum } from "@/enums";
import Splashscreen from "#/views/Splashscreen.vue";
import MobileLogin from "#/views/MobileLogin.vue";

/**! 创建窗口后再跳转页面就会导致样式没有生效所以不能使用懒加载路由的方式，有些页面需要快速响应的就不需要懒加载 */
const { BASE_URL } = import.meta.env;

const isMobile = type() === "ios" || type() === "android";

// 移动端路由配置 - 使用直接导入避免懒加载问题
const getMobileRoutes = (): Array<RouteRecordRaw> => [
  {
    path: "/",
    name: "mobileRoot",
    redirect: "/mobile/login"
  },
  {
    path: "/mobile/login",
    name: "mobileLogin",
    component: MobileLogin
  },
  {
    path: "/mobile/splashscreen",
    name: "splashscreen",
    component: Splashscreen
  }
];

// 桌面端路由配置
const getDesktopRoutes = (): Array<RouteRecordRaw> => [
  {
    name: "login",
    path: "/login",
    component: () => import("@/views/loginWindow/Login.vue")
  },
  {
    name: "register",
    path: "/register",
    component: () => import("@/views/registerWindow/index.vue")
  },
  {
    name: "forgetPassword",
    path: "/forgetPassword",
    component: () => import("@/views/forgetPasswordWindow/index.vue")
  },
  {
    name: "qrCode",
    path: "/qrCode",
    component: () => import("@/views/loginWindow/QRCode.vue")
  },
  {
    name: "network",
    path: "/network",
    component: () => import("@/views/loginWindow/Network.vue")
  },
  // 直播播放页面，不使用layout布局
  {
    name: "livePlay",
    path: "/live/:id",
    component: () => import("@/views/homeWindow/LivePlay.vue")
  },
  {
    name: "video",
    path: "/video",
    component: () => import("@/views/homeWindow/VideoDetail.vue")
  },
  {
    name: "home",
    path: "/home",
    component: () => import("@/layout/index.vue"),
    children: [
      {
        name: "index",
        path: "/index",
        component: () => import("@/views/homeWindow/index.vue")
      },
      {
        name: "aiChat",
        path: "/aiChat",
        component: () => import("@/views/homeWindow/AiChat.vue")
      },
      {
        name: "follow",
        path: "/follow",
        component: () => import("@/views/homeWindow/Follow.vue")
      },
      {
        name: "user",
        path: "/user",
        component: () => import("@/views/homeWindow/User.vue")
      }
    ]
  },
  {
    name: "record",
    path: "/record",
    component: () => import("@/views/recordWindow/index.vue")
  },
  {
    name: "danmaku",
    path: "/danmaku",
    component: () => import("@/views/recordWindow/Danmaku.vue")
  },
  {
    name: "setting",
    path: "/setting",
    component: () => import("@/views/settingWindow/index.vue"),
    children: [
      {
        path: "/general",
        name: "general",
        component: () => import("@/views/settingWindow/General.vue")
      },
      {
        path: "/loginSetting",
        name: "loginSetting",
        component: () => import("@/views/settingWindow/LoginSetting.vue")
      },
      {
        path: "/manageStore",
        name: "manageStore",
        component: () => import("@/views/settingWindow/ManageStore.vue")
      },
      {
        path: "/shortcut",
        name: "shortcut",
        component: () => import("@/views/settingWindow/Shortcut.vue")
      },
      {
        path: "/aiSetting",
        name: "aiSetting",
        component: () => import("@/views/settingWindow/AiSetting.vue")
      }
    ]
  },
  {
    name: "manageVideo",
    path: "/manageVideo",
    component: () => import("@/views/manageWindow/Video.vue")
  },
  {
    name: "manageLive",
    path: "/manageLive",
    component: () => import("@/views/manageWindow/Live.vue")
  },
  {
    name: "about",
    path: "/about",
    component: () => import("@/views/aboutWindow/index.vue")
  },
  {
    name: "feedback",
    path: "/feedback",
    component: () => import("@/views/feedbackWindow/index.vue")
  },
  {
    name: "live2d",
    path: "/live2d",
    component: () => import("@/views/live2dWindow/index.vue")
  },
  {
    name: "previewCode",
    path: "/previewCode",
    component: () => import("@/views/previewCodeWindow/index.vue")
  },
  {
    name: "previewImage",
    path: "/previewImage",
    component: () => import("@/views/previewImageWindow/index.vue")
  },
  {
    name: "previewVideo",
    path: "/previewVideo",
    component: () => import("@/views/previewVideoWindow/index.vue")
  },
  {
    name: "previewFile",
    path: "/previewFile",
    component: () => import("@/views/previewFileWindow/index.vue")
  },
  {
    name: "tray",
    path: "/tray",
    component: () => import("@/views/Tray.vue")
  },
  {
    path: "/capture",
    name: "capture",
    component: () => import("@/views/Capture.vue")
  },
  {
    path: "/checkUpdate",
    name: "checkUpdate",
    component: () => import("@/views/CheckUpdate.vue")
  },
  {
    path: "/update",
    name: "update",
    component: () => import("@/views/Update.vue")
  },
  {
    path: "/modal-remoteLogin",
    name: "modal-remoteLogin",
    component: () => import("@/views/loginWindow/RemoteLoginModal.vue")
  }
];

// 创建路由
const router: Router = createRouter({
  history: createWebHistory(BASE_URL),
  routes: isMobile ? getMobileRoutes() : getDesktopRoutes()
});

// 在创建路由后，添加全局前置守卫
// 为解决 “已声明‘to’，但从未读取其值” 的问题，将 to 参数改为下划线开头表示该参数不会被使用
router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // 桌面端直接放行
  if (!isMobile) {
    console.log("[守卫] 非移动端，直接放行");
    return next();
  }

  try {
    const isLoginPage = to.path === "/mobile/login";
    const isSplashPage = to.path === "/mobile/splashscreen";

    // 闪屏页白名单：不论登录状态都允许进入
    if (isSplashPage) {
      return next();
    }

    const tokens = await invoke<{ token: string | null; refreshToken: string | null }>(TauriCommandEnum.GET_TOKEN);
    const isLoggedIn = !!(tokens.token && tokens.refreshToken);

    // 未登录且不是登录页 → 跳转登录
    if (!isLoggedIn && !isLoginPage) {
      console.warn("[守卫] 未登录，强制跳转到 /mobile/login");
      return next("/mobile/login");
    }

    return next();
  } catch (error) {
    console.error("[守卫] 获取token错误:", error);
    // 出错时也跳转登录页（避免死循环）
    if (to.path !== "/mobile/login") {
      console.warn("[守卫] 出错，强制跳转到 /mobile/login");
      return next("/mobile/login");
    }
    return next();
  }
});

export default router;
