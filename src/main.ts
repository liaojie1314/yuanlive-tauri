import "uno.css";
import "@unocss/reset/eric-meyer.css"; // unocss提供的浏览器默认样式重置
import "@/styles/global/global.scss";
import { pinia } from "@/stores";
import router from "@/router";
import { createApp } from "vue";
import { initializePlatform } from "@/utils/PlatformUtils.ts";
import { startWebVitalObserver } from "@/utils/WebVitalsObserver.ts";
import { setupI18n } from "@/services/i18n.ts";
import App from "@/App.vue";
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
}

const app = createApp(App);
app.use(router).use(pinia).use(setupI18n).mount("#app");
app.config.errorHandler = (err) => {
  if (err instanceof AppException) {
    window.$message.error(err.message);
    return;
  }
  throw err;
};
