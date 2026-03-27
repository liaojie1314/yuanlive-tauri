<p align="center">
  <img width="350px" height="150px" src="public/yuanlive.png"/>
</p>

<p align="center">一款基于tauri2、Vite7、Vue3 和 TypeScript 构建的直播软件</p>

## 🌐 支持平台

| 平台    | 支持版本                             |
| ------- | ------------------------------------ |
| Windows | Windows 11                           |
| Linux   | Ubuntu 22.0+                         |
| macOS   | ⚠️未测试                             |
| Android | Android 12+ (SDK30+)                 |
| iOS     | ⚠️未测试                             |
| Web     | ⚠️暂不支持(需要自定义移除对桌面功能) |

## 📝 项目介绍

YuanLive 是一款基于tauri2、Vite7、Vue3 和 TypeScript 构建的直播软件。它利用了 Tauri 的跨平台能力和 Vue 3 的响应式设计，结合了 TypeScript 的类型安全特性和 Vite 7 的快速构建，为用户提供了一个高效、安全和易用的直播解决方案。

## 🛠️ 技术栈

- **Tauri**: Tauri 是一个基于 Rust 的跨平台桌面应用容器，它允许开发者使用前端技术栈来构建跨平台的桌面应用。Tauri 的设计哲学是在保证安全性的前提下，尽可能减少资源占用。
- **Vite 7**: Vite 是一个现代化的前端构建工具，它利用原生 ES 模块导入的能力来提供一个快速的开发服务器，与此同时，它也为生产环境打包提供了强大的支持。Vite 7 是其最新的版本，带来了更多的优化和特性。
- **Vue 3**: Vue 3 是一个渐进式JavaScript框架，用于构建用户界面。它的组合式API、更好的TypeScript集成和对移动端的优化使得开发复杂的单页应用变得更加简单和高效。
- **TypeScript**: TypeScript 是 JavaScript 的一个超集，它在 JavaScript 的基础上增加了类型系统。这让我们能够在开发过程中捕获更多的错误，并且提供更好的编辑器支持。

## 🎯 开发进度

### 🔐 用户认证系统

| 功能 | 描述           | 状态                                                                                                  |
| ---- | -------------- | ----------------------------------------------------------------------------------------------------- |
| 🔑   | 账号密码登录   | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 📱   | 二维码扫码登录 | ![进行中](https://img.shields.io/badge/90%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 💻   | 多设备登录管理 | ![进行中](https://img.shields.io/badge/10%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |

### 🤍 核心功能

| 功能 | 描述     | 状态                                                                                                  |
| ---- | -------- | ----------------------------------------------------------------------------------------------------- |
| 📹   | 开播     | ![进行中](https://img.shields.io/badge/50%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 🎬   | 直播互动 | ![进行中](https://img.shields.io/badge/20%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 📺   | 刷视频   | ![进行中](https://img.shields.io/badge/80%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 💣   | 弹幕系统 | ![进行中](https://img.shields.io/badge/60%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 🎁   | 礼物系统 | ![进行中](https://img.shields.io/badge/10%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 💬   | 评论系统 | ![进行中](https://img.shields.io/badge/40%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 👛   | 支付功能 | ![进行中](https://img.shields.io/badge/10%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 👀   | 关注     | ![进行中](https://img.shields.io/badge/95%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 🔖   | 收藏     | ![进行中](https://img.shields.io/badge/70%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 👨   | 个人中心 | ![进行中](https://img.shields.io/badge/55%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |

### 🎨 界面体验

| 功能 | 描述           | 状态                                                                                                 |
| ---- | -------------- | ---------------------------------------------------------------------------------------------------- |
| 🖼️   | 现代化界面设计 | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)       |
| 🌙   | 深色浅色主题   | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)       |
| 🎭   | 皮肤主题切换   | ![进行中](https://img.shields.io/badge/0%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |

### 🛠️ 系统功能

| 功能 | 描述                | 状态                                                                                                  |
| ---- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| 🔔   | 系统托盘            | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| ✂️   | 截图功能            | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 🎨   | 取色器功能          | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 📷   | 图片预览            | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 📺   | 独立媒体预览        | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 📄   | 文档预览            | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 🎙️   | 语音输入            | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| ⌨️   | 全局快捷键管理      | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| ⌨️   | 局部视频快捷键管理  | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 📁   | 文件分片上传(minio) | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 🔄   | 自动更新系统        | ![进行中](https://img.shields.io/badge/80%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 🌍   | i18n 支持           | ![进行中](https://img.shields.io/badge/90%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |

### 🌐 跨平台支持

| 功能 | 描述                | 状态                                                                                                  |
| ---- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| 💻   | Windows/macOS/Linux | ![进行中](https://img.shields.io/badge/66%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 📱   | iOS/Android 适配    | ![进行中](https://img.shields.io/badge/5%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e)  |

### 🤖 AI 集成

| 功能 | 描述     | 状态                                                                                                  |
| ---- | -------- | ----------------------------------------------------------------------------------------------------- |
| 🧠   | AI 聊天  | ![进行中](https://img.shields.io/badge/50%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |
| 💻   | 代码预览 | ![完成](https://img.shields.io/badge/✅-完成-008080?style=flat&labelColor=e6f7f7&color=008080)        |
| 🤖   | AI 助手  | ![进行中](https://img.shields.io/badge/20%25-进行中-f0ad4e?style=flat&labelColor=faf3e6&color=f0ad4e) |

## 🚀 启动项目

[前置要求](https://tauri.app/start/prerequisites)

### Linux(ubuntu为例)安装语音分发器和espeak引擎(可选)

```shell
sudo apt-get update
sudo apt install libspeechd-dev speech-dispatcher espeak-ng

# 可能需要安装
sudo apt install libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer-plugins-bad1.0-dev \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-tools \
    gstreamer1.0-x \
    gstreamer1.0-alsa \
    gstreamer1.0-gl \
    gstreamer1.0-gtk3 \
    gstreamer1.0-qt5 \
    gstreamer1.0-pulseaudio
```

### 配置环境变量

```shell
mv src-tauri/.env.example src-tauri/.env
mv .env.example .env
```

### 安装依赖并启动项目

```shell
npm i -g pnpm # 安装pnpm
pnpm i # 安装依赖
pnpm tauri:dev # 启动桌面端
pnpm tauri:android:dev # 启动android端 更多命令查看package.json
```

## 🧪 测试

```sh
# e2e测试
# 1. 打包项目(windows -> 全部格式 -> 调试版本)
pnpm tauri:build
# 2. 运行测试
pnpm test:e2e # E2E 测试 (Playwright) 基于CDP (Chrome DevTools Protocol)
pnpm test:e2e:headed # E2E 测试 (可视化模式)
pnpm test:e2e:ui # E2E 测试 (UI模式)
pnpm test:e2e:report # E2E 测试报告

# 单元测试
pnpm test:unit
# 使用 vitest UI
pnpm test:ui
# 测试覆盖率
pnpm test:coverage
```

## 🔄️ 代码提交

```shell
pnpm commit # 暂存代码并commit
pnpm gitcz # 给当前暂存的代码commit
pnpm addition-commit # commit后再次添加修改到上一次的commit
```

## 🔄️ 发布更新

```shell
# 设置tauri签名密钥(桌面端)
# linux或macos
export TAURI_SIGNING_PRIVATE_KEY="./yuanlive.key" # 复制yuanlive.key文件的内容替换`./yuanlive.key`
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
# windows
$env:TAURI_SIGNING_PRIVATE_KEY="./yuanlive.key" # 复制yuanlive.key文件的内容替换`./yuanlive.key`
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""

pnpm tauri:build

# 设置android签名密钥(android端)
mv src-tauri/gen/android/keystore.properties.example src-tauri/gen/android/keystore.properties
## 生成keystore文件
keytool -genkey -v -keystore yuanlive.jks -keyalg RSA -keysize 2048 -validity 10000 -alias yuanlive
## 完善keystore.properties文件

pnpm tauri:build
```

## 📄 组件

### 基础组件

| 组件                                      | 描述                       |
| ----------------------------------------- | -------------------------- |
| [vue3](https://cn.vuejs.org)              | 前端页面框架，快速构建界面 |
| [vue-router](https://router.vuejs.org)    | 页面跳转和多页面导航       |
| [pinia](https://pinia.vuejs.org)          | 全局状态管理               |
| [mitt](https://github.com/developit/mitt) | 轻量事件总线               |

### UI组件

| 组件                                | 描述        |
| ----------------------------------- | ----------- |
| [naive-ui](https://www.naiveui.com) | Vue3组件库  |
| [iconify](https://iconify.design)   | 图标框架    |
| [unocss](https://unocss.dev)        | 即时原子CSS |
| [sass](https://sass-lang.com)       | 增强版 CSS  |

### 其他工具

| 工具                                                   | 描述                        |
| ------------------------------------------------------ | --------------------------- |
| [Prettier](https://prettier.io)                        | 代码自动格式化              |
| [Biome](https://biomejs.dev)                           | 更快的代码检查、格式化      |
| [CommitLint](https://commitlint.js.org)                | Git提交信息规范检查         |
| [lint-staged](https://github.com/okonet/lint-staged)   | 对暂存的Git文件检查         |
| [vueuse](https://vueuse.org)                           | 实用的Vue工具函数           |
| [release-it](https://github.com/release-it/release-it) | 自动发布版本                |
| [cz-git](https://cz-git.qbb.sh)                        | 交互式方式写规范化的Git提交 |
| [husky](https://typicode.github.io/husky)              | 管理Git钩子                 |
| [commitizen](https://github.com/commitizen/cz-cli)     | 交互式提交工具              |
