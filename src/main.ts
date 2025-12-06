import "uno.css";
import "@unocss/reset/eric-meyer.css"; // unocss提供的浏览器默认样式重置
import { pinia } from "@/stores";
import router from "@/router";
import { createApp } from "vue";
import { initializePlatform } from "@/utils/PlatformUtils.ts";
import { setupI18n } from "@/services/i18n.ts";
import App from "@/App.vue";

initializePlatform();
const app = createApp(App);
app.use(router).use(pinia).use(setupI18n).mount("#app");
