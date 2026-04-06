import { useI18n } from "vue-i18n";

import { PluginEnum, StoresEnum } from "@/enums";

export type Plugin = {
  state: PluginEnum;
  url: string;
  icon: string;
  iconAction?: string;
  title?: string;
  shortTitle?: string;
  version?: string;
  isAdd: boolean;
  dot?: boolean;
  progress: number;
  miniShow: boolean;
  size?: {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
  };
  window?: {
    resizable: boolean;
  };
};

export const usePluginsStore = defineStore(
  StoresEnum.PLUGINS,
  () => {
    const { t } = useI18n();

    const pluginsList = computed<Plugin[]>(() => [
      {
        icon: "bookmark",
        url: "library",
        state: PluginEnum.BUILTIN,
        isAdd: true,
        dot: false,
        progress: 0,
        size: {
          width: 1000,
          height: 600,
          minWidth: 800,
          minHeight: 520
        },
        window: {
          resizable: true
        },
        miniShow: false,
        title: t("home.plugins.comic"),
        shortTitle: t("home.plugins.comicShortTitle")
      },
      {
        icon: "layers",
        url: "drawio",
        state: PluginEnum.BUILTIN,
        isAdd: true,
        dot: false,
        progress: 0,
        size: {
          width: 1240,
          height: 800,
          minWidth: 880,
          minHeight: 600
        },
        window: {
          resizable: true
        },
        miniShow: false,
        title: t("home.plugins.drawio"),
        shortTitle: t("home.plugins.drawioShortTitle")
      }
    ]);
    /** 插件内容 */
    const plugins = ref<Plugin[]>([]);
    /** 插件查看模式 */
    const viewMode = ref<string>("card");

    /** 初始化插件数据 */
    const initStore = () => {
      const localData = localStorage.getItem(StoresEnum.PLUGINS);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.plugins) {
            plugins.value = parsed.plugins;
          }
        } catch (error) {
          console.error("Failed to parse plugins from localStorage", error);
        }
        syncPluginsWithLocale(pluginsList.value);
      } else {
        // 本地无数据时的默认逻辑
        plugins.value = pluginsList.value.filter((p) => p.state === PluginEnum.BUILTIN);
      }
    };

    /**
     * 设置插件
     * @param newPlugin 插件数据
     */
    const addPlugin = (newPlugin: Plugin) => {
      const index = plugins.value.findIndex((i) => i.url === newPlugin.url);
      index === -1 && plugins.value.push(newPlugin);
    };

    /**
     * 删除插件
     * @param p 插件数据
     */
    const removePlugin = (p: Plugin) => {
      const index = plugins.value.findIndex((i) => i.url === p.url);
      plugins.value.splice(index, 1);
    };

    /**
     * 更新插件状态
     * @param p 插件
     */
    const updatePlugin = (p: Plugin) => {
      const index = plugins.value.findIndex((i) => i.url === p.url);
      index !== -1 && (plugins.value[index] = p);
    };

    /**
     * 同步插件数据
     * @param latest 最新的插件配置全量表
     */
    const syncPluginsWithLocale = (latest: Plugin[]) => {
      const mergedPlugins = plugins.value.map((plugin) => {
        const updated = latest.find((p) => p.url === plugin.url);
        return updated
          ? {
              ...plugin,
              size: updated.size ? { ...plugin.size, ...updated.size } : plugin.size,
              window: updated.window ? { ...plugin.window, ...updated.window } : plugin.window,
              title: updated.title,
              shortTitle: updated.shortTitle
            }
          : plugin;
      });
      const builtinPlugins = latest.filter((p) => p.state === PluginEnum.BUILTIN);
      builtinPlugins.forEach((bp) => {
        const isExist = mergedPlugins.some((p) => p.url === bp.url);
        if (!isExist) {
          mergedPlugins.push({ ...bp }); // 强制装载新增的内置插件
        }
      });

      plugins.value = mergedPlugins;
    };

    watch(
      plugins,
      (currentPlugins) => {
        const builtIns = pluginsList.value.filter((p) => p.state === PluginEnum.BUILTIN);

        // 检查当前状态里是不是丢失了必须存在的 BUILTIN 插件
        const hasMissing = builtIns.some((bp) => !currentPlugins.some((p) => p.url === bp.url));

        if (hasMissing) {
          // 如果丢了，重新执行同步函数，强行装载回来
          syncPluginsWithLocale(pluginsList.value);
        }
      },
      { deep: true, immediate: true }
    );

    watch(
      pluginsList,
      (latest) => {
        syncPluginsWithLocale(latest);
      },
      { deep: true }
    );
    initStore();

    return {
      plugins,
      viewMode,
      pluginsList,
      addPlugin,
      removePlugin,
      updatePlugin
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
