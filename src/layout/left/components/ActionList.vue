<template>
  <div data-tauri-drag-region class="mt-10px flex w-full flex-1 flex-col justify-between">
    <!-- 上部分操作栏 -->
    <header class="gap-10px color-[--left-text-color] flex w-full flex-col">
      <div
        v-for="item in menu"
        class="py-10px px-25px gap-10px hover:color-[--left-active-text-color] flex-start-center rounded-[8px] hover:bg-[--left-item-bg-color]"
        :key="item.url"
        :class="[{ active: item.url === activeUrl }]"
        @click="pageJumps(item.url, item.title, item.size, item.window)">
        <svg class="size-20px">
          <use :href="`#${item.icon}`"></use>
        </svg>
        <p class="text-[16px] select-none">{{ item.title }}</p>
      </div>
      <div
        v-for="item in noMiniShowPlugins"
        class="py-10px px-25px gap-10px hover:color-[--left-active-text-color] flex-start-center rounded-[8px] hover:bg-[--left-item-bg-color]"
        :key="item.url"
        :class="[{ active: activeUrl === item.url }]"
        :title="item.title"
        @click="pageJumps(item.url, item.title, item.size, item.window)">
        <svg class="size-20px">
          <use :href="`#${item.icon}`"></use>
        </svg>
        <p class="text-[16px] select-none">{{ item.title }}</p>
      </div>
      <div class="top-action w-full">
        <n-popover
          style="padding: 8px; margin-left: 4px; background: var(--bg-setting-item)"
          trigger="hover"
          placement="right"
          :show-arrow="false">
          <template #trigger>
            <div
              class="py-10px px-25px gap-10px hover:color-[--left-active-text-color] flex-start-center rounded-[8px] hover:bg-[--left-item-bg-color] cursor-pointer w-full box-border">
              <svg class="size-20px">
                <use href="#menu"></use>
              </svg>
              <p class="text-[16px] select-none">{{ t("home.action.plugin") }}</p>
            </div>
          </template>

          <div v-if="miniShowPlugins.length">
            <n-flex
              v-for="(item, index) in miniShowPlugins"
              class="p-[6px_5px] rounded-4px cursor-pointer hover:bg-[--setting-item-line]"
              :key="'excess-' + index"
              :size="5"
              @click="pageJumps(item.url, item.title, item.size, item.window)">
              {{ item.title }}
            </n-flex>
          </div>
          <n-flex
            class="p-[6px_5px] rounded-4px cursor-pointer hover:bg-[--setting-item-line]"
            :size="8"
            @click="menuShow = true">
            <svg class="size-16px">
              <use href="#settings"></use>
            </svg>
            {{ t("home.action.pluginManage") }}
          </n-flex>
        </n-popover>
      </div>
    </header>
    <!-- 下部分操作栏 -->
    <footer class="flex-col-x-center mt-10px color-[--left-text-color] w-full select-none">
      <div class="gap-12px flex">
        <n-popover trigger="hover" class="bg-transparent p-0 select-none" :show-arrow="false">
          <template #trigger>
            <svg
              class="size-22px p-6px hover:color-[--left-active-text-color] relative rounded-[12px] hover:bg-[--left-item-bg-color]">
              <use href="#settings"></use>
            </svg>
          </template>
          <div class="bottom-item-left">
            <div class="menu-list">
              <div v-for="(item, index) in settingMenu" :key="index">
                <div class="menu-item" @click="() => item.click()">
                  <svg class="size-14px">
                    <use :href="`#${item.icon}`"></use>
                  </svg>
                  {{ item.label }}
                </div>
              </div>
            </div>
          </div>
        </n-popover>
        <n-popover trigger="hover" class="bg-transparent p-0 select-none" :show-arrow="false">
          <template #trigger>
            <svg
              class="size-22px p-6px hover:color-[--left-active-text-color] relative rounded-[12px] hover:bg-[--left-item-bg-color]">
              <use href="#help"></use>
            </svg>
          </template>
          <div class="bottom-item-right">
            <div class="menu-list">
              <div v-for="(item, index) in helpMenu" :key="index">
                <div class="menu-item" @click="() => item.click()">
                  <svg class="size-14px">
                    <use :href="`#${item.icon}`"></use>
                  </svg>
                  {{ item.label }}
                </div>
              </div>
            </div>
          </div>
        </n-popover>
      </div>
    </footer>
  </div>
  <define-plugins v-model="menuShow" />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { leftHook } from "../hook.ts";
import { useLogin } from "@/hooks/useLogin";
import { useWindow } from "@/hooks/useWindow";
import { useCheckUpdate } from "@/hooks/useCheckUpdate";
import { useTauriListener } from "@/hooks/useTauriListener";
import { usePluginsStore, type Plugin } from "@/stores/plugins.ts";
import { PluginEnum, TauriCommandEnum } from "@/enums/index.ts";
import DefinePlugins from "./definePlugins/index.vue";

const { t } = useI18n();
const { logout } = useLogin();
const { createWebviewWindow } = useWindow();
const { checkUpdate } = useCheckUpdate();
const pluginsStore = usePluginsStore();
const { plugins } = storeToRefs(pluginsStore);
const appWindow = WebviewWindow.getCurrent();
const { addListener } = useTauriListener();
const { activeUrl, pageJumps } = leftHook();

type BaseMenuItem = {
  label: string;
  icon: string;
  click: () => void;
};

const baseMenu: Array<Omit<Plugin, "title" | "shortTitle">> = [
  {
    url: "index",
    icon: "home",
    state: PluginEnum.BUILTIN,
    isAdd: true,
    dot: false,
    progress: 0,
    miniShow: false
  },
  {
    url: "aiChat",
    icon: "robot",
    state: PluginEnum.BUILTIN,
    isAdd: true,
    dot: false,
    progress: 0,
    miniShow: false
  },
  {
    url: "follow",
    icon: "peoples",
    state: PluginEnum.BUILTIN,
    isAdd: true,
    dot: false,
    progress: 0,
    miniShow: false
  },
  {
    url: "user",
    icon: "user",
    state: PluginEnum.BUILTIN,
    isAdd: true,
    dot: false,
    progress: 0,
    miniShow: false
  }
];
const menuShow = ref(false);

// 显示在菜单的插件
const activePlugins = computed(() => {
  return plugins.value.filter((i) => i.isAdd);
});
// 显示在菜单外的插件
const noMiniShowPlugins = computed(() => {
  return activePlugins.value.filter((i) => !i.miniShow);
});
// 显示在菜单内的插件
const miniShowPlugins = computed(() => {
  return activePlugins.value.filter((i) => i.miniShow);
});
const menu = computed<Plugin[]>(() => [
  {
    ...baseMenu[0],
    title: t("home.action.home")
  },
  {
    ...baseMenu[1],
    title: t("home.action.aiChat")
  },
  {
    ...baseMenu[2],
    title: t("home.action.follow")
  },
  {
    ...baseMenu[3],
    title: t("home.action.user")
  }
]);

const settingMenu = computed<BaseMenuItem[]>(() => [
  {
    label: t("home.menu.setting.general"),
    icon: "settings",
    click: async () => {
      await createWebviewWindow("设置", "setting", 840, 840, "", true, 840, 600);
    }
  },
  {
    label: t("home.menu.setting.update"),
    icon: "arrow-circle-up",
    click: async () => {
      await checkUpdate("home");
    }
  },
  {
    label: t("home.menu.setting.signOut"),
    icon: "power",
    click: async () => {
      try {
        await logout();
      } catch (err) {
        console.error("退出登录失败: ", err);
        window.$message.error(t("components.window.logoutFail"));
      }
    }
  }
]);

const helpMenu = computed<BaseMenuItem[]>(() => [
  {
    label: t("home.menu.help.about"),
    icon: "info",
    click: async () => {
      await createWebviewWindow("关于", "about", 360, 480);
    }
  },
  {
    label: t("home.menu.help.feedback"),
    icon: "help",
    click: async () => {
      await createWebviewWindow("反馈", "feedback", 360, 480);
    }
  }
]);

/** 开始调整窗口大小 */
const startResize = () => {
  window.dispatchEvent(new Event("resize"));
};

/**
 * 处理窗口大小变化事件，调整插件菜单显示
 * @param e 事件对象
 */
const handleResize = async (e: Event) => {
  const windowHeight = (e.target as Window).innerHeight;
  const menuDivHeight = 46;
  const spaceHeight = 10;
  const newMenuHeight = menuDivHeight + spaceHeight;
  const headerTopHeight = 120;
  const bottomPadding = 15;
  const randomHeight = 3;
  const menuNum = Math.floor(
    (windowHeight -
      (baseMenu.length + noMiniShowPlugins.value.length + 1) * menuDivHeight -
      (baseMenu.length + noMiniShowPlugins.value.length) * spaceHeight -
      headerTopHeight -
      bottomPadding -
      randomHeight) /
      newMenuHeight
  );
  if (menuNum < 0) {
    noMiniShowPlugins.value.map((i, index) => {
      if (index >= noMiniShowPlugins.value.length + menuNum) {
        pluginsStore.updatePlugin({ ...i, miniShow: true });
      }
    });
  } else if (menuNum >= 0 && miniShowPlugins.value.length > 0) {
    miniShowPlugins.value.map((i, index) => {
      if (index < menuNum) {
        pluginsStore.updatePlugin({ ...i, miniShow: false });
      }
    });
  }
};

/** 调整主界面高度 */
const setHomeHeight = () => {
  // TODO: 动态计算高度
  invoke(TauriCommandEnum.SET_HEIGHT, { height: 504 });
};

onMounted(async () => {
  // 初始化窗口高度
  setHomeHeight();
  // 监听窗口大小变化事件，处理菜单收起
  window.addEventListener("resize", handleResize);
  // 触发一次resize事件，调整插件菜单的显示
  startResize();
  // 监听自定义事件，处理设置中菜单显示模式切换和添加插件后，导致高度变化，需重新调整插件菜单显示
  await addListener(
    appWindow.listen("startResize", () => {
      startResize();
    }),
    "startResize"
  );
});
</script>

<style scoped lang="scss">
@use "../style";

.bottom-item-left {
  left: 30%;
  bottom: 0;
  transform: translateX(-30%);
}

.bottom-item-right {
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
}
</style>
