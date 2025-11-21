/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.vue" {
  import { defineComponent } from "vue";
  const component: ReturnType<typeof defineComponent>;
  export default component;
}

declare interface Window {
  $message: ReturnType<typeof useMessage>;
  $notification: ReturnType<typeof useNotification>;
  $loadingBar: ReturnType<typeof useLoadingBar>;
  $dialog: ReturnType<typeof useDialog>;
}
