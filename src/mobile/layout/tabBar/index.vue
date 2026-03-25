<template>
  <n-divider class="p-0! m-0!" />
  <div class="tab-bar flex justify-around items-end pt-3">
    <router-link
      v-for="item in navItems"
      class="tab-item flex-col-x-center flex-1 no-underline relative"
      :key="item.path"
      :to="item.path"
      :class="route.path === item.path ? 'color-[--tab-bar-icon-color]' : 'text-#000 dark:text-white/80'">
      <n-badge color="#c14053" class="flex-col-x-center w-55% flex-1 relative" :offset="[-6, 6]" :value="0" :max="99">
        <svg class="w-22px h-22px">
          <use :href="`#${route.path === item.path ? item.actionIcon : item.icon}`"></use>
        </svg>
        <span class="text-xs mt-1">{{ item.label }}</span>
      </n-badge>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

type NavItem = {
  label: string;
  path: string;
  icon: string;
  actionIcon: string;
};

const { t } = useI18n();
const route = useRoute();

const navItems: NavItem[] = [
  {
    label: t("mobileTabbar.items.index"),
    path: "/mobile/index",
    icon: "index",
    actionIcon: "index-action"
  },
  {
    label: t("mobileTabbar.items.chat"),
    path: "/mobile/chat",
    icon: "chat",
    actionIcon: "chat-action"
  },
  {
    label: t("mobileTabbar.items.follow"),
    path: "/mobile/follow",
    icon: "follow",
    actionIcon: "follow-action"
  },
  {
    label: t("mobileTabbar.items.me"),
    path: "/mobile/my",
    icon: "wode",
    actionIcon: "wode-action"
  }
];
</script>

<style scoped lang="scss">
.tab-bar {
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}
</style>
