<template>
  <div class="flex-1 mt-10px flex flex-col justify-between w-full" data-tauri-drag-region>
    <!-- 上部分操作栏 -->
    <header class="flex flex-col gap-10px w-full color-[--left-text-color]">
      <div
        v-for="item in menu"
        :key="item.url"
        :class="{ 'bg-[--left-item-bg-color] color-[--left-active-text-color]': item.url === activeUrl }"
        class="flex py-10px px-25px gap-10px hover:bg-[--left-item-bg-color] hover:color-[--left-active-text-color] rounded-[8px] items-center justify-start"
        @click="handleClick(item.url)">
        <svg class="size-20px">
          <use :href="`#${item.icon}`"></use>
        </svg>
        <p class="text-[16px] select-none">{{ item.title }}</p>
      </div>
    </header>
    <!-- 下部分操作栏 -->
    <footer class="flex-col-x-center mt-10px w-full color-[--left-text-color] select-none">
      <div class="flex gap-12px">
        <n-popover class="p-0 bg-transparent select-none" :show-arrow="false" trigger="hover">
          <template #trigger>
            <svg
              class="size-22px relative p-6px rounded-[12px] hover:bg-[--left-item-bg-color] hover:color-[--left-active-text-color]">
              <use href="#settings"></use>
            </svg>
          </template>
          <div class="bottom-item-left">
            <div class="menu-list">
              <div v-for="(item, index) in settingMenu" :key="index">
                <div class="menu-item">
                  <svg class="size-14px">
                    <use :href="`#${item.icon}`"></use>
                  </svg>
                  {{ item.label }}
                </div>
              </div>
            </div>
          </div>
        </n-popover>
        <n-popover class="p-0 bg-transparent select-none" :show-arrow="false" trigger="hover">
          <template #trigger>
            <svg
              class="size-22px relative p-6px rounded-[12px] hover:bg-[--left-item-bg-color] hover:color-[--left-active-text-color]">
              <use href="#help"></use>
            </svg>
          </template>
          <div class="bottom-item-right">
            <div class="menu-list">
              <div v-for="(item, index) in helpMenu" :key="index">
                <div class="menu-item">
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

const { t } = useI18n();

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
    icon: "settings"
  },
  {
    label: t("home.menu.setting.privacy"),
    icon: "lock"
  },
  {
    label: t("home.menu.setting.update"),
    icon: "arrow-circle-up"
  },
  {
    label: t("home.menu.setting.signOut"),
    icon: "power"
  }
]);

const helpMenu = computed<BaseMenuItem[]>(() => [
  {
    label: t("home.menu.help.about"),
    icon: "info"
  },
  {
    label: t("home.menu.help.feedback"),
    icon: "help"
  }
]);

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
