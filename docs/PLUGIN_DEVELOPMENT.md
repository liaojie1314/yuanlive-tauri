# 🧩 平台插件开发规范 (Plugin Development Guide)

欢迎为本平台开发插件！本平台的插件本质上是一个**独立的 Web 应用程序（HTML/JS/CSS）**。为了确保插件能够被主应用正确下载、解析并流畅运行在独立的桌面窗口中，请严格遵守以下开发与打包规范。

## 📁 一、 插件包结构要求

最终提交给平台的必须是一个 `.zip` 压缩包。解压后的**根目录**下必须包含以下核心文件：

```text
my-plugin/                 # (解压后的根目录环境)
 ├── manifest.json         # 🌟 必填：插件配置清单（身份证）
 ├── index.html            # 🌟 必填：插件入口文件
 ├── icon.png              # 选填：插件图标（推荐 1:1 比例）
 └── assets/               # 选填：你的静态资源文件夹 (js, css, 图片等)
```

> **⚠️ 致命错误警告：**
> 打包 ZIP 时，**请务必进入你构建好的产物目录（如 `dist`）内部**，全选所有文件进行压缩。绝不能连着 `dist` 文件夹外壳一起压缩，否则主应用将无法读取 `manifest.json`！

---

## 📄 二、 manifest.json 配置详解

`manifest.json` 是插件的“身份证”，主应用通过它来渲染插件列表和初始化窗口。请在打包根目录下提供该文件：

```json
{
  "url": "my-awesome-plugin",
  "title": "我的超级插件",
  "shortTitle": "超级插件",
  "version": "1.0.0",
  "icon": "icon.png",
  "entry": "index.html",
  "size": {
    "width": 800,
    "height": 600,
    "minWidth": 400,
    "minHeight": 300
  },
  "window": {
    "resizable": true
  }
}
```

### 字段说明

- **`url`** _(String, 必填)_: 插件的唯一全局标识符（ID）。必须是英文、数字或中划线。**该字段必须与你的 `.zip` 文件名完全一致**（例：`url` 为 `abc`，则包名必须为 `abc.zip`）。
- **`title`** _(String, 必填)_: 插件在列表中显示的完整名称及窗口标题。
- **`shortTitle`** _(String, 选填)_: 插件短名称（用于侧边栏等狭窄空间展示）。
- **`version`** _(String, 必填)_: 版本号，建议遵循语义化版本控制（如 `1.0.0`）。
- **`icon`** _(String, 选填)_: 插件图标。支持网络图片（`http://...`）或相对于根目录的本地图片（如 `icon.png`）。如果不填，系统将使用默认图标。
- **`entry`** _(String, 选填)_: 插件的入口文件名称。默认值为 `index.html`。
- **`size`** _(Object, 选填)_: 定义插件窗口的尺寸。
  - `width` / `height`: 窗口的默认宽高。
  - `minWidth` / `minHeight`: 窗口允许缩放的最小宽高。
- **`window`** _(Object, 选填)_: 窗口行为控制。
  - `resizable`: 是否允许用户拖拽边缘调整窗口大小（`true` / `false`）。

---

## 🔗 三、 静态资源路径规范（极其重要）

由于主应用使用自定义的本地协议（`plugin://localhost/`）来加载插件文件，**插件内部的所有资源引用必须使用相对路径（Relative Paths）**。

### 1. 框架配置（如 Vue / React / Vite）

如果你使用 Vite 或 Webpack 等打包工具构建插件，请务必将基础路径（Base URL）配置为相对路径 `./`。

- **Vite (`vite.config.ts`)**:

  ```typescript
  export default defineConfig({
    base: "./" // 强制使用相对路径打包
  });
  ```

### 2. 代码中的资源引用

在 HTML、CSS 或 JS 代码中引入图片、音频等资源时，**严禁使用以 `/` 开头的绝对路径**。

- ❌ **错误示范 (会导致 404)**:
  `<img src="/assets/logo.png" />`
  `const bg = new Image(); bg.src = "/bg.jpg";`
- ✅ **正确示范**:
  `<img src="./assets/logo.png" />`
  `const bg = new Image(); bg.src = "./bg.jpg";`

---

## 🎨 四、 UI 与交互建议

1. **消除默认滚动条**：
   桌面端应用中出现网页默认滚动条会极大降低体验。建议在你的全局 CSS 中添加以下样式：

   ```css
   html,
   body {
     margin: 0;
     padding: 0;
     overflow: hidden; /* 如果你需要内部滚动，请在特定容器上开启 overflow-y: auto */
   }
   ```

2. **响应式设计**：
   如果你的 `manifest.json` 中配置了 `"resizable": true`，请确保你的网页布局（如 Flexbox / Grid）能够良好地适应窗口大小的拖拽变化。
3. **系统主题**：
   插件暂不支持直接读取主应用的暗黑/明亮主题状态，建议在插件内部提供自己的主题切换或采用中性色调设计。

---

## 🚀 五、 开发与测试流程总结

1. 正常使用你熟悉的前端技术栈（Vue, React, 原生 HTML/JS 等）开发 Web 应用。
2. 配置打包工具的 Base URL 为 `./`。
3. 执行构建命令（如 `npm run build`）。
4. 在构建产物根目录下，手动新建并配置 `manifest.json`。
5. **进入产物目录内部**，全选所有文件，压缩为 `<插件url>.zip`。
6. 将 zip 包部署至服务器或发送给主应用开发者进行测试。
