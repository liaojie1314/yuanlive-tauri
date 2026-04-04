import "uno.css";
import "@unocss/reset/eric-meyer.css"; // unocss提供的浏览器默认样式重置
import "@/styles/global/global.scss";
import App from "@/App.vue";
import router from "@/router";
import { createApp } from "vue";
import { pinia } from "@/stores";
import { vResize } from "@/directives/v-resize";
import { initializePlatform, isMobile } from "@/utils/PlatformUtils.ts";
import { startWebVitalObserver } from "@/utils/WebVitalsObserver.ts";
import { setupI18n } from "@/services/i18n.ts";
import { AppException } from "@/common/exception.ts";
import { getMemoryMonitor } from "@/utils/MemoryMonitor.ts";

initializePlatform();
startWebVitalObserver();
// Initialize memory monitor
const memoryMonitor = getMemoryMonitor();
memoryMonitor.start();

if (process.env.NODE_ENV === "development") {
  import("@/utils/Console.ts").then((module) => {
    /**! 控制台打印项目版本信息(不需要可手动关闭)*/
    module.consolePrint();
  });

  if (isMobile()) {
    import("eruda").then((module) => {
      const eruda = "default" in module ? module.default : module;
      eruda.init();
    });
  }
}

const app = createApp(App);

async function bootstrap() {
  app.use(pinia);
  app.directive("resize", vResize);
  await setupI18n(app);
  app.use(router);
  await router.isReady();
  app.config.errorHandler = (err) => {
    if (err instanceof AppException) {
      window.$message.error(err.message);
      return;
    }
    throw err;
  };
  app.mount("#app");
}

bootstrap();
