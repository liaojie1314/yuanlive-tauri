import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

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
    name: "home",
    path: "/home",
    component: () => import("@/layout/index.vue")
  }
];

// 创建路由
const router: any = createRouter({
  history: createWebHistory(),
  routes: getCommonRoutes()
});

export default router;
