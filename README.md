# YuanLive

## 启动项目

[前置要求](https://tauri.app/start/prerequisites)

```shell
pnpm i
pnpm tauri:dev # 启动桌面端 更多命令查看package.json
```

## 代码提交

```shell
pnpm commit
```

## 组件

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

[ ] 网络设置页面
[ ] 注册页面窗口
[ ] 忘记密码窗口
[ ] 主界面布局
[ ] settingStore 主题，语言
[ ] 配置持久化 json sqlite
[ ] WebSocket
[ ] WebRTC
