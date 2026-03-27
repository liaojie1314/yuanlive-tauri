import os from "os";
import * as tar from "tar";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import extractZip from "extract-zip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------- 配置区域 ----------------
const FFMPEG_VERSION = "b5.0.1";
const FFMPEG_MIRRORS = ["https://github.com/eugeneware/ffmpeg-static/releases/download"];
const PIPER_VERSION = "2023.11.14-2";
const PIPER_BASE_URL = `https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}`;

// ---------------- 映射表 ----------------
const PLATFORM_MAP = { win32: "win32", darwin: "darwin", linux: "linux" };
const ARCH_MAP = { x64: "x64", arm64: "arm64", ia32: "ia32" };
const RUST_TARGET_MAP = { win32: "pc-windows-msvc", darwin: "apple-darwin", linux: "unknown-linux-gnu" };
const RUST_ARCH_MAP = { x64: "x86_64", arm64: "aarch64", ia32: "i686" };

function getPiperAssetInfo(platform, arch) {
  if (platform === "win32" && arch === "x64") return "piper_windows_amd64.zip";
  if (platform === "darwin" && arch === "x64") return "piper_macos_x64.tar.gz";
  if (platform === "darwin" && arch === "arm64") return "piper_macos_aarch64.tar.gz";
  if (platform === "linux" && arch === "x64") return "piper_linux_x86_64.tar.gz";
  if (platform === "linux" && arch === "arm64") return "piper_linux_aarch64.tar.gz";
  return null;
}

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
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "node-fetch" } });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const totalBytes = parseInt(res.headers.get("content-length") || "0", 10);
    let downloadedBytes = 0;
    const fileStream = fs.createWriteStream(tempPath);
    const stream = res.body;
    if (!stream) throw new Error("Response body is empty");
    const reader = stream.getReader();

    let lastLogTime = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      downloadedBytes += value.length;
      const canWrite = fileStream.write(value);
      if (!canWrite) await new Promise((resolve) => fileStream.once("drain", resolve));

      const now = Date.now();
      if (now - lastLogTime > 200 || downloadedBytes === totalBytes) {
        lastLogTime = now;
        if (totalBytes > 0) {
          process.stdout.write(
            `\r⬇️  下载中: ${((downloadedBytes / totalBytes) * 100).toFixed(1)}% (${formatSize(downloadedBytes)} / ${formatSize(totalBytes)})`
          );
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

// ---------------- 任务模块 (全自动无交互) ----------------

async function downloadFFmpeg(platform, arch, binariesDir) {
  if (platform !== "win32") return;
  const tauriFilename = `ffmpeg-${RUST_ARCH_MAP[arch]}-${RUST_TARGET_MAP[platform]}.exe`;
  const targetFile = path.join(binariesDir, tauriFilename);

  if ((await fs.pathExists(targetFile)) && (await fs.stat(targetFile)).size > 0) {
    console.log(`✅ [FFmpeg] 已存在，跳过下载。`);
    return;
  }

  const downloadFilename = `${PLATFORM_MAP[platform]}-${ARCH_MAP[arch]}`;
  console.log(`📦 [FFmpeg] 自动下载: ${downloadFilename}`);
  for (const mirror of FFMPEG_MIRRORS) {
    try {
      await downloadWithProgress(`${mirror}/${FFMPEG_VERSION}/${downloadFilename}`, targetFile);
      console.log(`✨ [FFmpeg] 下载成功!`);
      return;
    } catch (err) {
      console.error(`⚠️ 源失败: ${err.message}`);
    }
  }
}

async function downloadPiper(platform, arch, binariesDir) {
  const assetName = getPiperAssetInfo(platform, arch);
  if (!assetName) return;
  const targetFile = path.join(binariesDir, assetName);
  // 因为压缩包解压自带一个 'piper' 文件夹，所以解压到 bin 目录下，刚好生成 src-tauri/bin/piper
  const binDir = path.resolve(__dirname, "../src-tauri/bin");
  const piperExePath = path.join(binDir, "piper", platform === "win32" ? "piper.exe" : "piper");
  // 如果最终的引擎文件已经存在，就彻底跳过
  if (await fs.pathExists(piperExePath)) {
    console.log(`✅ [Piper] 引擎核心已部署在 bin/piper，跳过下载。`);
    return;
  }
  console.log(`📦 [Piper] 自动下载: ${assetName}`);
  try {
    // 1. 下载压缩包
    await downloadWithProgress(`${PIPER_BASE_URL}/${assetName}`, targetFile);
    console.log(`✨ [Piper] 下载成功，准备解压...`);
    // 2. 执行自动解压
    await extractArchive(targetFile, binDir);
    console.log(`✅ [Piper] 引擎已成功部署到: src-tauri/bin/piper`);
    // 3. 解压完把厚重的压缩包删掉，释放空间
    await fs.remove(targetFile);
    console.log(`♻️  [Piper] 清理临时压缩包完成。`);
  } catch (err) {
    console.error(`❌ [Piper] 部署失败: ${err.message}`);
  }
}

async function extractArchive(archivePath, destDir) {
  console.log(`📦 开始解压: ${path.basename(archivePath)} ...`);
  await fs.ensureDir(destDir);

  if (archivePath.endsWith(".zip")) {
    await extractZip(archivePath, { dir: destDir });
  } else if (archivePath.endsWith(".tar.gz")) {
    await tar.x({
      file: archivePath,
      cwd: destDir
    });
  } else {
    throw new Error(`不支持的压缩包格式: ${archivePath}`);
  }
}

// ---------------- 主入口 ----------------
async function main() {
  const platform = os.platform();
  const arch = os.arch();
  const binariesDir = path.resolve(__dirname, "../src-tauri/binaries");

  console.log(`🚀 [Postinstall] 检测系统: ${platform} ${arch}`);
  await fs.ensureDir(binariesDir);

  // 移除了所有的 promptUser，直接依次执行自动下载
  await downloadFFmpeg(platform, arch, binariesDir);
  await downloadPiper(platform, arch, binariesDir);

  console.log(`🎉 环境配置检测执行完毕！\n`);
}

main();
