/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_CDN: boolean;
  readonly VITE_COMPRESSION: ViteCompression;
  readonly VITE_CRYPTO_SECRET_KEY: string;
  readonly VITE_CRYPTO_SECRET_IV: string;
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
  $loadingBar: ReturnType<typeof useLoadingBar>;
  $dialog: ReturnType<typeof useDialog>;
  $notification: ReturnType<typeof useNotification>;
  $modal: ReturnType<typeof useModal>;
}
