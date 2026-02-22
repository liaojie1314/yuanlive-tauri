// 扩展 Performance 接口，添加 Chrome 特有的 memory 属性
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export interface MemoryData {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface MemoryMonitorOptions {
  interval?: number; // 监控间隔（毫秒），默认 5000
  maxHistory?: number; // 最大历史记录数，默认 100
  warningThreshold?: number; // 内存增长警告阈值（百分比），默认 20
  onWarning?: (current: MemoryData, previous: MemoryData, growth: number) => void;
}

export class MemoryMonitor {
  private readonly interval: number;
  private readonly maxHistory: number;
  private readonly warningThreshold: number;
  private readonly onWarning?: (current: MemoryData, previous: MemoryData, growth: number) => void;

  private timer: number | null = null; // 浏览器环境使用 number 即可
  private history: MemoryData[] = [];
  private isRunning = false;

  constructor(options: MemoryMonitorOptions = {}) {
    this.interval = options.interval || 5000;
    this.maxHistory = options.maxHistory || 100;
    this.warningThreshold = options.warningThreshold || 20;
    this.onWarning = options.onWarning;
  }

  // 检查当前环境是否支持内存监控
  public static isSupported(): boolean {
    return typeof performance !== "undefined" && !!performance.memory;
  }

  // 获取当前内存使用情况
  public getCurrentMemory(): MemoryData | null {
    if (!MemoryMonitor.isSupported()) return null;

    const memory = performance.memory!;
    return {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }

  // 格式化内存大小（字节转MB）
  public static formatToMB(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  // 开始监控
  public start(): void {
    if (this.isRunning || !MemoryMonitor.isSupported()) return;

    this.isRunning = true;
    this.timer = window.setInterval(() => this.checkMemory(), this.interval);
    console.log("Memory monitor started");
  }

  // 停止监控
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    console.log("Memory monitor stopped");
  }

  // 核心：检查内存并记录
  private checkMemory(): void {
    const current = this.getCurrentMemory();
    if (!current) return;

    this.history.push(current);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // 检查是否有异常飙升
    if (this.history.length > 1) {
      const previous = this.history[this.history.length - 2];
      const growth = ((current.usedJSHeapSize - previous.usedJSHeapSize) / previous.usedJSHeapSize) * 100;

      if (growth > this.warningThreshold) {
        console.warn(
          `[Memory Warning] 内存暴增 ${growth.toFixed(2)}%! \n` +
            `Previous: ${MemoryMonitor.formatToMB(previous.usedJSHeapSize)} -> Current: ${MemoryMonitor.formatToMB(current.usedJSHeapSize)}`
        );
        this.onWarning?.(current, previous, growth);
      }
    }
  }

  // 手动触发一次检查
  public manualCheck(): void {
    this.checkMemory();
  }
}

// 导出单例
let monitorInstance: MemoryMonitor | null = null;
export function getMemoryMonitor(options?: MemoryMonitorOptions): MemoryMonitor {
  if (!monitorInstance) {
    monitorInstance = new MemoryMonitor(options);
  }
  return monitorInstance;
}
