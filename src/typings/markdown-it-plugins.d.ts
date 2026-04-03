declare module "markdown-it-abbr" {
  import { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-deflist" {
  import { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-emoji" {
  import { PluginSimple } from "markdown-it";
  export const full: PluginSimple;
  export const bare: PluginSimple;
}

declare module "markdown-it-footnote" {
  import { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-ins" {
  import { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-mark" {
  import { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-sub" {
  import { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-sup" {
  import { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-task-lists" {
  import { PluginWithOptions } from "markdown-it";
  const plugin: PluginWithOptions<any>;
  export default plugin;
}

declare module "markdown-it-toc-done-right" {
  import { PluginWithOptions } from "markdown-it";
  const plugin: PluginWithOptions<any>;
  export default plugin;
}
