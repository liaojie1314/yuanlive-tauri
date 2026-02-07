import fs from "fs-extra";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------- 配置区域 ----------------
const FFMPEG_VERSION = "b5.0.1";

// 镜像源列表
const MIRROR_URLS = ["https://github.com/eugeneware/ffmpeg-static/releases/download"];

// ---------------- 映射表 ----------------
const PLATFORM_MAP = { win32: "win32", darwin: "darwin", linux: "linux" };
const ARCH_MAP = { x64: "x64", arm64: "arm64", ia32: "ia32" };
const RUST_TARGET_MAP = { win32: "pc-windows-msvc", darwin: "apple-darwin", linux: "unknown-linux-gnu" };
const RUST_ARCH_MAP = { x64: "x86_64", arm64: "aarch64", ia32: "i686" };

// ---------------- 辅助函数 ----------------

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / k ** i).toFixed(2) + " " + sizes[i];
}

async function downloadWithProgress(url, destPath) {
  const tempPath = destPath + ".download";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒连接超时

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "node-fetch" }
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const totalBytes = parseInt(res.headers.get("content-length") || "0", 10);
    let downloadedBytes = 0;

    const fileStream = fs.createWriteStream(tempPath);
    // @ts-expect-error
    const stream = res.body;
    if (!stream) throw new Error("Response body is empty");
    const reader = stream.getReader();

    let lastLogTime = 0;
    const logThrottle = 200;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      downloadedBytes += value.length;
      const canWrite = fileStream.write(value);
      if (!canWrite) await new Promise((resolve) => fileStream.once("drain", resolve));

      const now = Date.now();
      if (now - lastLogTime > logThrottle || downloadedBytes === totalBytes) {
        lastLogTime = now;
        if (totalBytes > 0) {
          const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\r⬇️  下载中: ${percent}% (${formatSize(downloadedBytes)} / ${formatSize(totalBytes)})`);
        } else {
          process.stdout.write(`\r⬇️  下载中: ${formatSize(downloadedBytes)}`);
        }
      }
    }

    process.stdout.write("\n");
    fileStream.end();

    await new Promise((resolve, reject) => {
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });

    await fs.move(tempPath, destPath, { overwrite: true });
  } catch (error) {
    clearTimeout(timeoutId);
    if (await fs.pathExists(tempPath)) await fs.remove(tempPath);
    throw error;
  }
}

// ---------------- 主逻辑 ----------------

async function main() {
  const platform = os.platform();
  if (platform !== "win32") {
    console.log(`ℹ️  [FFmpeg] 当前平台是 ${platform}，跳过下载 (仅 Windows 需要)。`);
    return;
  }

  const arch = os.arch();

  if (!PLATFORM_MAP[platform] || !ARCH_MAP[arch]) {
    console.error(`❌ 不支持的系统: ${platform} ${arch}`);
    process.exit(1);
  }

  const ext = platform === "win32" ? ".exe" : "";
  // Tauri 需要的文件名
  const tauriFilename = `ffmpeg-${RUST_ARCH_MAP[arch]}-${RUST_TARGET_MAP[platform]}${ext}`;
  // GitHub 上的原始文件名
  const downloadFilename = `${PLATFORM_MAP[platform]}-${ARCH_MAP[arch]}`;

  const binariesDir = path.resolve(__dirname, "../src-tauri/binaries");
  const targetFile = path.join(binariesDir, tauriFilename);

  // 清理残留临时文件
  const tempFile = targetFile + ".download";
  if (await fs.pathExists(tempFile)) await fs.remove(tempFile);

  try {
    await fs.ensureDir(binariesDir);

    // 1. 检查文件是否存在且不为空
    if (await fs.pathExists(targetFile)) {
      const stat = await fs.stat(targetFile);
      if (stat.size > 0) {
        console.log(`✅ [FFmpeg] 文件已就绪: ${tauriFilename}`);
        return;
      }
      await fs.remove(targetFile); // 文件为空，删除重下
    }

    console.log(`🚀 [FFmpeg] 检测系统: ${platform} ${arch}`);
    console.log(`📦 [FFmpeg] 准备下载: ${downloadFilename}`);

    let success = false;
    let lastError = null;

    // 2. 尝试自动下载
    for (const mirror of MIRROR_URLS) {
      const url = `${mirror}/${FFMPEG_VERSION}/${downloadFilename}`;
      console.log(`🔗 尝试源: ${url}`);
      try {
        await downloadWithProgress(url, targetFile);
        success = true;
        console.log(`✨ 下载成功!`);
        break;
      } catch (err) {
        process.stdout.write("\n");
        console.error(`⚠️  源失败: ${err.message}`);
        lastError = err;
        console.log(`🔄 尝试下一个...`);
      }
    }

    if (!success) {
      throw new Error(`自动下载彻底失败: ${lastError?.message}`);
    }
    console.log(`✅ [FFmpeg] 配置完成!`);
  } catch (_err) {
    // ============================================================
    // 💡 最终兜底：生成手动安装指南
    // ============================================================
    const manualUrl = `https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_VERSION}/${downloadFilename}`;

    console.error(`\n❌ [FFmpeg] 自动配置失败 (网络原因)`);
    console.error(`================================================================`);
    console.error(`   请按照以下步骤手动安装，只需操作一次即可：`);
    console.error(`================================================================`);
    console.error(`1️⃣  下载文件：`);
    console.error(`   ${manualUrl}`);
    console.error(`   (复制链接到浏览器或使用代理下载)`);
    console.error(``);
    console.error(`2️⃣  重命名文件为：`);
    console.error(`   ${tauriFilename}`);
    console.error(``);
    console.error(`3️⃣  将文件移动到此目录：`);
    console.error(`   ${binariesDir}`);
    console.error(`================================================================\n`);
    process.exit(1);
  }
}

main();
