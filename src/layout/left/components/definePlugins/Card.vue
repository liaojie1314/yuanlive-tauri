<template>
  <div>
    <n-scrollbar style="max-height: 280px">
      <n-flex class="z-10 p-[18px_18px_36px_18px] box-border w-full" :size="26">
        <template v-for="(plugin, index) in allPlugins" :key="index">
          <transition name="state-change" mode="out-in">
            <!-- 未安装和下载中状态 -->
            <n-flex
              v-if="plugin.state === PluginEnum.NOT_INSTALLED || plugin.state === PluginEnum.DOWNLOADING"
              vertical
              justify="center"
              align="center"
              class="box bg-[--plugin-bg-color]"
              :size="8"
              :class="{ 'filter-shadow': page.shadow }">
              <img
                v-if="isImageIcon(plugin.icon)"
                alt=""
                class="size-38px object-cover rounded-8px"
                :src="getIconUrl(plugin)" />
              <svg v-else class="size-38px color-#999">
                <use :href="`#${plugin.icon}`"></use>
              </svg>
              <p class="text-(12px #666)">{{ plugin.title }}</p>

              <!-- 在下载中进度条 -->
              <n-flex
                class="relative rounded-22px border-(1px solid #4C77BD)"
                :class="[
                  plugin.state === PluginEnum.DOWNLOADING ? 'downloading' : 'bg-[--progress-bg] size-fit p-[4px_8px]'
                ]"
                @click="handleState(plugin)">
                <div
                  v-if="plugin.state === PluginEnum.DOWNLOADING"
                  class="bg-#8CA9F4"
                  :style="{
                    width: plugin.state === PluginEnum.DOWNLOADING ? `${plugin?.progress * 0.8}px` : 'auto'
                  }"
                  :class="[
                    plugin?.progress < 100 ? 'rounded-l-24px rounded-r-0' : 'rounded-24px',
                    plugin?.progress > 0 ? 'h-18px border-(1px solid transparent)' : 'h-20px'
                  ]">
                  <p class="absolute-center text-(12px #4C77BD)">{{ plugin?.progress }}%</p>
                </div>

                <p v-else class="text-(12px #4C77BD center)">{{ t("home.plugins.actions.install") }}</p>
              </n-flex>

              <!-- 闪光效果 -->
              <div class="flash"></div>
            </n-flex>

            <!-- 可卸载状态或内置插件状态 -->
            <n-flex
              v-else
              vertical
              justify="center"
              align="center"
              class="box"
              :size="8"
              :class="[
                plugin.state === PluginEnum.BUILTIN
                  ? 'built'
                  : plugin.state === PluginEnum.UNINSTALLING
                    ? 'unload'
                    : 'colorful',
                {
                  'filter-shadow': page.shadow
                }
              ]"
              @click="openPluginHandler(plugin)">
              <img
                v-if="isImageIcon(plugin.iconAction || plugin.icon)"
                class="size-38px object-cover rounded-8px shadow-sm"
                :src="getIconUrl(plugin)" />
              <svg v-else class="size-38px color-#555">
                <use :href="`#${plugin.iconAction || plugin.icon}`"></use>
              </svg>
              <p class="text-(12px #666)">{{ plugin.title }}</p>

              <n-flex
                v-if="plugin.state === PluginEnum.UNINSTALLING"
                class="relative rounded-22px border-(1px solid #c14053) bg-#f6dfe3 p-[4px_8px]">
                <p class="text-(12px #c14053 center)">{{ t("home.plugins.status.uninstalling") }}</p>
              </n-flex>

              <n-flex
                v-if="plugin.state === PluginEnum.BUILTIN"
                class="relative rounded-22px border-(1px solid #777) bg-#e3e3e3 size-fit p-[4px_8px]">
                <p class="text-(12px #777 center)">{{ t("home.plugins.status.builtin") }}</p>
              </n-flex>

              <n-flex
                v-if="plugin.state === PluginEnum.INSTALLED"
                class="relative rounded-22px border-(1px solid #4C77BD) bg-#e0e9fc p-[4px_8px]">
                <p class="text-(12px #4C77BD center)">{{ plugin.version }}</p>
              </n-flex>

              <!-- 闪光效果 -->
              <div class="flash"></div>

              <transition>
                <svg
                  v-if="plugin.isAdd && plugin.state !== PluginEnum.BUILTIN"
                  class="absolute color-#666 left-2px top-2px size-14px">
                  <use href="#notOnTop"></use>
                </svg>
              </transition>

              <!-- 插件操作 -->
              <n-popover
                v-if="plugin.state === PluginEnum.INSTALLED || index === isCurrently"
                style="padding: 0"
                trigger="click"
                placement="bottom"
                :show="isCurrently === index"
                :show-arrow="false">
                <template #trigger>
                  <svg class="absolute color-#666 right-0 top-0 size-18px rotate-90" @click.stop="isCurrently = index">
                    <use href="#more"></use>
                  </svg>
                </template>

                <div class="action-item">
                  <div class="menu-list">
                    <div v-if="!plugin.isAdd" class="menu-item" @click="handleAdd(plugin)">
                      <svg class="color-#4C77BD">
                        <use href="#add"></use>
                      </svg>
                      <p class="text-#4C77BD">{{ t("home.plugins.actions.pin") }}</p>
                    </div>
                    <div v-else class="menu-item" @click="handleDelete(plugin)">
                      <svg class="color-#c14053">
                        <use href="#reduce"></use>
                      </svg>
                      <p class="text-#c14053">{{ t("home.plugins.actions.unpin") }}</p>
                    </div>
                    <div class="menu-item" @click="handleUnload(plugin)">
                      <svg>
                        <use href="#delete"></use>
                      </svg>
                      <p>{{ t("home.plugins.actions.uninstall") }}</p>
                    </div>
                  </div>
                </div>
              </n-popover>
            </n-flex>
          </transition>
        </template>
      </n-flex>
    </n-scrollbar>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { emitTo } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { PluginEnum, TauriCommandEnum } from "@/enums";
import { useWindow } from "@/hooks/useWindow";
import { isWindows } from "@/utils/PlatformUtils";
import { useSettingStore } from "@/stores/setting";
import { usePluginsStore, type Plugin } from "@/stores/plugins";

const { t } = useI18n();
const { createPluginWindow } = useWindow();
const appWindow = WebviewWindow.getCurrent();
const settingStore = useSettingStore();
const pluginsStore = usePluginsStore();
const { page } = storeToRefs(settingStore);
const { plugins, pluginsList } = storeToRefs(pluginsStore);

const isCurrently = ref(-1);

const allPlugins = computed(() => {
  return pluginsList.value.map((item: Plugin) => {
    const matched = plugins.value.find((z: Plugin) => z.url === item.url);
    return matched ? { ...item, state: matched.state, isAdd: matched.isAdd, progress: matched.progress } : item;
  });
});

/**
 * 打开插件窗口
 * @param plugin 插件对象
 */
const openPluginHandler = (plugin: Plugin) => {
  if (plugin.state === PluginEnum.INSTALLED) {
    createPluginWindow(plugin);
  }
};

/**
 * 判断图标是否为图片
 * @param icon 图标字符串
 * @returns 是否为图片
 */
const isImageIcon = (icon: string) => {
  if (!icon) return false;
  const str = icon.trim().toLowerCase();
  return str.endsWith(".png") || str.endsWith(".jpg") || str.endsWith(".jpeg") || str.startsWith("http");
};

/**
 * 获取插件图标的真实渲染路径
 * @param plugin 插件对象
 * @returns 图标真实渲染路径
 */
const getIconUrl = (plugin: Plugin) => {
  const icon = plugin.iconAction || plugin.icon;
  if (!icon) return "";
  if (icon.startsWith("http://") || icon.startsWith("https://")) {
    return icon;
  }
  if (isImageIcon(icon)) {
    const baseUrl = isWindows() ? `http://plugin.localhost/${plugin.url}` : `plugin://localhost/${plugin.url}`;
    return `${baseUrl}/${icon}`;
  }
  return "";
};

/**
 * 处理插件状态：执行真实下载安装
 * @param plugin 插件对象
 */
const handleState = async (plugin: Plugin) => {
  if (plugin.state === PluginEnum.INSTALLED) return;
  const updatedPlugin = { ...plugin, state: PluginEnum.DOWNLOADING, progress: 0 };
  pluginsStore.updatePlugin(updatedPlugin);
  const interval = setInterval(() => {
    const currentPlugin = allPlugins.value.find((p) => p.url === plugin.url);
    if (!currentPlugin) {
      clearInterval(interval);
      return;
    }
    if (currentPlugin.progress < 90) {
      pluginsStore.updatePlugin({ ...currentPlugin, progress: currentPlugin.progress + 10 });
    }
  }, 500);

  try {
    const manifestData: any = await invoke(TauriCommandEnum.DOWNLOAD_PLUGIN, {
      pluginUrl: plugin.url,
      downloadUrl: plugin.downloadUrl
    });
    clearInterval(interval);
    pluginsStore.updatePlugin({ ...updatedPlugin, progress: 100 });
    setTimeout(() => {
      pluginsStore.addPlugin({
        ...updatedPlugin,
        ...manifestData,
        state: PluginEnum.INSTALLED,
        progress: 0
      });
      window.$message?.success(t("home.plugins.msg.installSuccess", { name: manifestData.title || plugin.title }));
    }, 500);
  } catch (error) {
    clearInterval(interval);
    console.error("插件下载失败:", error);
    window.$message?.error(t("home.plugins.msg.downloadFailed", { name: plugin.title }));
    pluginsStore.updatePlugin({ ...updatedPlugin, state: PluginEnum.NOT_INSTALLED, progress: 0 });
  }
};

/**
 * 处理插件卸载
 * @param plugin 插件
 */
const handleUnload = async (plugin: Plugin) => {
  const updatedPlugin = { ...plugin, state: PluginEnum.UNINSTALLING };
  pluginsStore.updatePlugin(updatedPlugin);
  try {
    await invoke(TauriCommandEnum.UNINSTALL_PLUGIN, { pluginUrl: plugin.url });
    setTimeout(() => {
      handleDelete(updatedPlugin);
      pluginsStore.removePlugin(updatedPlugin);
      window.$message?.success(t("home.plugins.msg.uninstallSuccess", { name: plugin.title }));
    }, 500);
  } catch (error) {
    console.error("物理卸载失败:", error);
    window.$message?.error(t("home.plugins.msg.uninstallFailed", { name: plugin.title }));
    pluginsStore.updatePlugin({ ...plugin, state: PluginEnum.INSTALLED });
  }
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
 * 关闭插件操作菜单
 * @param event 事件
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
  @apply custom-shadow w-100px h-100px rounded-8px relative size-fit cursor-pointer overflow-hidden select-none;
  transition: all 0.3s ease-in-out;

  &.state-change-enter-active,
  &.state-change-leave-active {
    transition: all 0.3s ease-in-out;
  }

  &.state-change-enter-from,
  &.state-change-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }

  .flash {
    position: absolute;
    left: -130%;
    top: 0;
    width: 100px;
    height: 100px;
    background-image: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
    transform: skew(-30deg);
    pointer-events: none;
  }

  &:hover .flash {
    left: 130%;
    transition: all 0.8s ease-in-out;
  }
}

.downloading {
  width: 80px;
  background: var(--progress-bg);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.action-item {
  @include menu-item-style();
  left: -80px;
  @include menu-list();
}

.colorful {
  background-image: linear-gradient(45deg, #a8edea 0%, #fed6e3 100%);
}

.built {
  background-image: linear-gradient(-20deg, #e9defa 0%, #fbfcdb 100%);
}

.unload {
  background-image: linear-gradient(to top, #feada6 0%, #f5efef 100%);
}

.filter-shadow {
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.2));
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
