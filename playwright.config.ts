import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", // 测试文件存放的目录
  timeout: 30000, // 每个测试用例的最大超时时间（30秒）
  reporter: "html", // 生成漂亮的 HTML 测试报告
  use: {
    trace: "on-first-retry" // 失败重试时记录调用追踪
  }
});
