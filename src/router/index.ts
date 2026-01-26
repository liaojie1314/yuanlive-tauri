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
    name: "setting",
    path: "/setting",
    component: () => import("@/views/settingWindow/index.vue")
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
