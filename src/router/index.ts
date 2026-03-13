import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from "vue-router";

const getCommonRoutes = (): Array<RouteRecordRaw> => [
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
  history: createWebHistory(),
  routes: getCommonRoutes()
});

export default router;
