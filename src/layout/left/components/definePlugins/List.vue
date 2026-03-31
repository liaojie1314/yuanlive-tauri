<template>
  <div>
    <float-block-list
      item-key="title"
      max-height="280px"
      style-id="plugins-hover-classes"
      :data-source="allPlugins"
      :item-height="70">
      <template #item="{ item: plugin, index }">
        <n-flex align="center" justify="space-between" class="p-[10px_20px]">
          <n-flex align="center" :size="14">
            <n-flex align="center" justify="center" class="size-48px rounded-50% bg-#7676760f">
              <Transition mode="out-in">
                <svg
                  v-if="plugin.state === PluginEnum.NOT_INSTALLED || plugin.state === PluginEnum.DOWNLOADING"
                  class="size-34px color-#999">
                  <use :href="`#${plugin.icon}`"></use>
                </svg>
                <template v-else>
                  <svg class="size-34px color-#555">
                    <use :href="`#${plugin.iconAction || plugin.icon}`"></use>
                  </svg>
                </template>
              </Transition>
            </n-flex>

            <n-flex vertical :size="10">
              <n-flex align="center" :size="6">
                <p class="text-(14px #666) pl-4px">{{ plugin.title }}</p>

                <Transition>
                  <svg v-if="plugin.isAdd && plugin.state !== PluginEnum.BUILTIN" class="color-#666 size-14px">
                    <use href="#notOnTop"></use>
                  </svg>
                </Transition>
              </n-flex>

              <Transition mode="out-in">
                <n-flex
                  v-if="plugin.state === PluginEnum.UNINSTALLING"
                  class="relative rounded-22px bg-#f6dfe3 size-fit p-[4px_8px]">
                  <p class="text-(12px #c14053 center)">{{ t("home.plugins.status.uninstalling") }}</p>
                </n-flex>

                <n-flex
                  v-else-if="plugin.state === PluginEnum.BUILTIN"
                  class="relative rounded-22px bg-#e3e3e3 size-fit p-[4px_8px]">
                  <p class="text-(12px #777 center)">{{ t("home.plugins.status.builtin") }}</p>
                </n-flex>

                <n-flex v-else class="relative rounded-22px bg-#e0e9fc size-fit p-[4px_8px]">
                  <p class="text-(12px #4C77BD center)">{{ plugin.version }}</p>
                </n-flex>
              </Transition>
            </n-flex>
          </n-flex>

          <!-- 未安装和下载中状态 -->
          <n-flex
            v-if="plugin.state === PluginEnum.NOT_INSTALLED || plugin.state === PluginEnum.DOWNLOADING"
            vertical
            justify="center"
            align="center"
            class="box bg-[--button-bg-color]"
            :size="8">
            <!-- 在下载中进度条 -->
            <n-flex
              align="center"
              class="relative"
              :class="[plugin.state === PluginEnum.DOWNLOADING ? 'downloading' : 'size-full']"
              @click="handleState(plugin)">
              <div
                v-if="plugin.state === PluginEnum.DOWNLOADING"
                class="bg-#8CA9F4"
                :style="{
                  width: plugin.state === PluginEnum.DOWNLOADING ? `${plugin.progress * 0.6}px` : 'auto'
                }"
                :class="[
                  plugin.progress < 100 ? 'rounded-l-0 rounded-r-0' : 'rounded-2px',
                  plugin.progress > 0 ? 'h-40px border-(1px solid transparent)' : 'h-40px'
                ]">
                <p class="absolute-center text-(12px #4C77BD)">{{ plugin.progress }}%</p>
              </div>

              <p v-else class="text-(12px [--user-text-color] center) w-full">
                {{ t("home.plugins.actions.install") }}
              </p>
            </n-flex>
          </n-flex>

          <!-- 卸载中 -->
          <n-spin v-if="plugin.state === PluginEnum.UNINSTALLING" :stroke="'#c14053'" :size="22" />

          <!-- 插件操作 -->
          <n-popover
            v-if="plugin.state === PluginEnum.INSTALLED || index === isCurrently"
            style="padding: 0"
            trigger="click"
            placement="bottom"
            :show="isCurrently === index"
            :show-arrow="false">
            <template #trigger>
              <svg class="size-22px rotate-90" @click.stop="isCurrently = index">
                <use href="#more"></use>
              </svg>
            </template>

            <div class="action-item">
              <div class="menu-list">
                <div v-if="!plugin.isAdd" class="menu-item" @click="handleAdd(plugin)">
                  <svg class="color-#4C77BD"><use href="#add"></use></svg>
                  <p class="text-#4C77BD">{{ t("home.plugins.actions.pin") }}</p>
                </div>
                <div v-else class="menu-item" @click="handleDelete(plugin)">
                  <svg class="color-#c14053"><use href="#reduce"></use></svg>
                  <p class="text-#c14053">{{ t("home.plugins.actions.unpin") }}</p>
                </div>
                <div class="menu-item" @click="handleUnload(plugin)">
                  <svg><use href="#delete"></use></svg>
                  <p>{{ t("home.plugins.actions.uninstall") }}</p>
                </div>
              </div>
            </div>
          </n-popover>
        </n-flex>
      </template>
    </float-block-list>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { emitTo } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { PluginEnum } from "@/enums";
import { usePluginsStore, type Plugin } from "@/stores/plugins.ts";

const { t } = useI18n();
const appWindow = WebviewWindow.getCurrent();
const pluginsStore = usePluginsStore();
const { plugins, pluginsList } = storeToRefs(pluginsStore);

const isCurrently = ref(-1);

const allPlugins = computed(() => {
  return pluginsList.value.map((item: Plugin) => {
    const matched = plugins.value.find((z: Plugin) => z.url === item.url);
    return matched ? { ...item, state: matched.state, isAdd: matched.isAdd, progress: matched.progress } : item;
  });
});

/**
 * 处理插件状态
 * @param plugin 插件
 */
const handleState = (plugin: Plugin) => {
  if (plugin.state === PluginEnum.INSTALLED) return;
  const updatedPlugin = { ...plugin, state: PluginEnum.DOWNLOADING };
  pluginsStore.updatePlugin(updatedPlugin);
  const interval = setInterval(() => {
    // 获取最新状态
    const currentPlugin = allPlugins.value.find((p) => p.url === plugin.url);
    if (!currentPlugin) {
      clearInterval(interval);
      return;
    }
    if (currentPlugin.progress < 100) {
      pluginsStore.updatePlugin({ ...currentPlugin, progress: currentPlugin.progress + 50 });
    } else {
      clearInterval(interval);
      pluginsStore.addPlugin({ ...currentPlugin, state: PluginEnum.INSTALLED, progress: 0 });
    }
  }, 500);
};

/**
 * 处理插件卸载
 * @param plugin 插件
 */
const handleUnload = (plugin: Plugin) => {
  const updatedPlugin = { ...plugin, state: PluginEnum.UNINSTALLING };
  pluginsStore.updatePlugin(updatedPlugin);
  setTimeout(() => {
    handleDelete(updatedPlugin);
    pluginsStore.removePlugin(updatedPlugin);
  }, 2000);
};

/**
 * 处理插件删除
 * @param p 插件
 */
const handleDelete = (p: Plugin) => {
  const plugin = plugins.value.find((i) => i.url === p.url);
  if (plugin) {
    setTimeout(() => {
      pluginsStore.updatePlugin({ ...plugin, isAdd: false });
      emitTo(appWindow.label, "startResize");
    }, 300);
  }
};

/**
 * 处理插件添加
 * @param p 插件
 */
const handleAdd = (p: Plugin) => {
  const plugin = plugins.value.find((i) => i.url === p.url);
  if (plugin) {
    setTimeout(() => {
      pluginsStore.updatePlugin({ ...plugin, isAdd: true });
      emitTo(appWindow.label, "startResize");
    }, 300);
  }
};

/**
 * 关闭菜单
 * @param event 点击事件
 */
const closeMenu = (event: Event) => {
  const e = event.target as HTMLInputElement;
  if (!e.matches(".action-item")) {
    isCurrently.value = -1;
  }
};

onMounted(() => {
  window.addEventListener("click", closeMenu, true);
});

onUnmounted(() => {
  window.removeEventListener("click", closeMenu, true);
});
</script>

<style scoped lang="scss">
@use "@/styles/global/variable.scss" as *;

.box {
  @apply w-60px h-40px rounded-8px relative size-fit cursor-pointer overflow-hidden select-none;
  transition: all 0.2s;
}

.downloading {
  width: 60px;
  background: var(--progress-bg);
}

.action-item {
  @include menu-item-style();
  left: -80px;
  @include menu-list();
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
