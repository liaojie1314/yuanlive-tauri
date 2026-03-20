<template>
  <div data-tauri-drag-region class="mt-10px flex w-full flex-1 flex-col justify-between">
    <!-- 上部分操作栏 -->
    <header class="gap-10px color-[--left-text-color] flex w-full flex-col">
      <div
        v-for="item in menu"
        class="py-10px px-25px gap-10px hover:color-[--left-active-text-color] flex-start-center rounded-[8px] hover:bg-[--left-item-bg-color]"
        :key="item.url"
        :class="{ 'color-[--left-active-text-color] bg-[--left-item-bg-color]': item.url === activeUrl }"
        @click="handleClick(item.url)">
        <svg class="size-20px">
          <use :href="`#${item.icon}`"></use>
        </svg>
        <p class="text-[16px] select-none">{{ item.title }}</p>
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
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import router from "@/router";
import { useLogin } from "@/hooks/useLogin";
import { useWindow } from "@/hooks/useWindow";
import { useCheckUpdate } from "@/hooks/useCheckUpdate";

const { t } = useI18n();
const { logout } = useLogin();
const { createWebviewWindow } = useWindow();
const { checkUpdate } = useCheckUpdate();

type BaseMenuItem = {
  label: string;
  icon: string;
  click: () => void;
};

type MenuAction = {
  url: string;
  icon: string;
  title: string;
};

const activeUrl = ref<string>("index");

const baseMenu: Array<Omit<MenuAction, "title">> = [
  {
    url: "index",
    icon: "home"
  },
  {
    url: "aiChat",
    icon: "robot"
  },
  {
    url: "follow",
    icon: "peoples"
  },
  {
    url: "user",
    icon: "user"
  }
];

const menu = computed<MenuAction[]>(() => [
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

/** 点击侧边栏 */
const handleClick = (url: string) => {
  activeUrl.value = url;
  router.push({ name: url });
};

onMounted(() => {
  router.push({ name: activeUrl.value });
});
</script>

<style scoped lang="scss">
@use "../style";

.bottom-item-left {
  left: 30%;
  bottom: 0px;
  transform: translateX(-30%);
}

.bottom-item-right {
  left: 50%;
  bottom: 0px;
  transform: translateX(-50%);
}
</style>
