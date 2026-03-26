import { spawn, ChildProcess, execSync } from "child_process";
import { test, expect, chromium, Browser, Page } from "@playwright/test";

let browser: Browser;
let tauriApp: ChildProcess;

test.beforeAll(async () => {
  // 给初始化钩子 60 秒的时间
  test.setTimeout(60000);

  try {
    execSync("taskkill /f /im yuanlive-tauri.exe >nul 2>&1");
    console.log("🧹 已清理后台残留的 Tauri 进程");
  } catch (_) {}

  console.log(`🚀 启动 Tauri 应用...`);
  tauriApp = spawn("target/debug/yuanlive-tauri.exe", [], {
    cwd: "src-tauri",
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9222"
    }
  });

  // 如果程序闪退或者报错，立刻就能在控制台看到！
  // tauriApp.stdout?.on("data", (d) => console.log(`[Tauri 输出] ${d}`));
  // tauriApp.stderr?.on("data", (d) => console.error(`[Tauri 错误] ${d}`));
  // tauriApp.on("exit", (code) => console.log(`💀 [警报] 程序已退出，状态码: ${code}`));

  // 2. 连接调试端口
  let connected = false;
  console.log(`⏳ 正在尝试连接 9222 端口... (最多等待 40 秒)`);

  // 等待时长 40 秒 (40次 * 1000毫秒)
  for (let i = 0; i < 40; i++) {
    try {
      browser = await chromium.connectOverCDP("http://localhost:9222");
      connected = true;
      console.log("✅ 成功接管 WebView2 底层协议!");
      break;
    } catch (_) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!connected) {
    throw new Error(
      "❌ 无法连接到 9222 调试端口！请看上方有没有打印 [警报] 或 [Tauri 错误]。如果程序没退出，说明 WebView2 端口被其他软件占用了。"
    );
  }
});

test.afterAll(async () => {
  if (browser) await browser.close();
  if (tauriApp) tauriApp.kill();
});

test("YuanLive 登录核心交互测试", async () => {
  test.setTimeout(60000);

  const context = browser.contexts()[0];
  let loginPage: Page | null = null;

  console.log("⏳ 正在寻找登录窗口...");

  for (let i = 0; i < 40; i++) {
    for (const p of context.pages()) {
      try {
        if (p.isClosed()) continue;

        const hasPassword = await p.locator('input[type="password"]').isVisible();
        const hasLogo = await p.locator('img[src="/logo.webp"]').isVisible();

        if (hasPassword || hasLogo) {
          loginPage = p;
          break;
        }
      } catch (_) {}
    }
    if (loginPage) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  expect(loginPage, "❌ 40秒了还没找到包含密码框或Logo的界面！").not.toBeNull();
  console.log(`🎯 成功锁定登录页面 URL: ${loginPage!.url()}`);

  // ========== 开始测试 ==========
  const isManualMode = await loginPage!.locator('input[type="password"]').isVisible();

  if (isManualMode) {
    console.log("✍️ 当前处于手动输入登录模式");

    // 定位文本框（过滤掉 checkbox）并填入账号
    const accountInput = loginPage!.locator('input:not([type="checkbox"])').first();
    await accountInput.fill("developer@yuanlive.com");
    await loginPage!.locator('input[type="password"]').fill("tauri123456");

    const checkboxContainer = loginPage!.locator(".n-checkbox").first();
    // 等待它在页面上确实可见
    await checkboxContainer.waitFor({ state: "visible" });

    const classStr = await checkboxContainer.getAttribute("class");
    // Naive UI 选中时会自动加上 n-checkbox--checked 类名
    if (classStr && !classStr.includes("n-checkbox--checked")) {
      console.log("✅ 自动勾选服务协议");
      await checkboxContainer.click({ force: true });
    } else {
      console.log("✅ 服务协议已默认勾选");
    }

    const loginBtn = loginPage!.locator(".gradient-button").first();
    console.log("👀 验证登录按钮已成功渲染并准备就绪");
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeEnabled(); // 账号密码填完、协议勾选后，按钮应该变为可用状态
  } else {
    console.log("👤 当前处于自动登录/快捷登录模式");
    const autoLoginBtn = loginPage!.locator(".gradient-button").first();
    console.log("👀 验证快捷登录按钮可见");
    await expect(autoLoginBtn).toBeVisible();
  }

  console.log("🔍 验证底部【更多】菜单展开...");

  await loginPage!.evaluate(() => {
    // 精准定位网格最后一列里，那个带有光标手势的真实触发器
    const trigger = document.querySelector(".grid > div:last-child .cursor-pointer") as HTMLElement;
    if (trigger) {
      trigger.click(); // 原生触发点击，绝对百发百中
    }
  });

  // 等待包含 register 类的元素在 body 中被 Naive UI 渲染并完成动画
  const registerOption = loginPage!.locator(".register").first();
  await expect(registerOption).toBeVisible({ timeout: 5000 });

  console.log("🎉 YuanLive 登录界面 E2E 测试全部完美通过！");
});
