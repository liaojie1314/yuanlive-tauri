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
        name: "friends",
        path: "/friends",
        component: () => import("@/views/homeWindow/Friends.vue")
      },
      {
        name: "user",
        path: "/user",
        component: () => import("@/views/homeWindow/User.vue")
      }
    ]
  },
  {
    name: "tray",
    path: "/tray",
    component: () => import("@/views/Tray.vue")
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
