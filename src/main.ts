import "uno.css";
import "@unocss/reset/eric-meyer.css"; // unocss提供的浏览器默认样式重置
import { pinia } from "@/stores";
import router from "@/router";
import { createApp } from "vue";
import App from "@/App.vue";

const app = createApp(App);
app.use(router).use(pinia).mount("#app");
