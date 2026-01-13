// 内存监控工具

// 扩展Performance接口，添加Chrome特有的memory属性
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

interface MemoryData {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryMonitorOptions {
  interval?: number; // 监控间隔（毫秒）
  maxHistory?: number; // 最大历史记录数
  warningThreshold?: number; // 内存增长警告阈值（百分比）
  onWarning?: (current: MemoryData, previous: MemoryData, growth: number) => void; // 警告回调
}

export class MemoryMonitor {
  private interval: number;
  private maxHistory: number;
  private warningThreshold: number;
  private onWarning?: (current: MemoryData, previous: MemoryData, growth: number) => void;
  private timer: NodeJS.Timeout | null = null;
  private history: MemoryData[] = [];
  private isRunning = false;

  constructor(options: MemoryMonitorOptions = {}) {
    this.interval = options.interval || 5000;
    this.maxHistory = options.maxHistory || 100;
    this.warningThreshold = options.warningThreshold || 20; // 默认20%增长警告
    this.onWarning = options.onWarning;
  }

  // 获取当前内存使用情况
  private getCurrentMemory(): MemoryData | null {
    if (typeof performance === "undefined" || !performance.memory) {
      console.warn("Memory monitoring is not supported in this environment");
      return null;
    }

    const memory = performance.memory;
    return {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }

  // 格式化内存大小（字节转MB）
  public formatMemorySize(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  // 计算内存使用率
  public calculateUsage(data: MemoryData): number {
    return (data.usedJSHeapSize / data.jsHeapSizeLimit) * 100;
  }

  // 开始监控
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.timer = setInterval(() => {
      this.checkMemory();
    }, this.interval);

    console.log("Memory monitor started");
  }

  // 停止监控
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    console.log("Memory monitor stopped");
  }

  // 检查内存使用情况
  private checkMemory(): void {
    const current = this.getCurrentMemory();
    if (!current) {
      return;
    }

    // 添加到历史记录
    this.history.push(current);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // 检查内存增长情况
    if (this.history.length > 1) {
      const previous = this.history[this.history.length - 2];
      const growth = ((current.usedJSHeapSize - previous.usedJSHeapSize) / previous.usedJSHeapSize) * 100;

      // 如果内存增长超过阈值，触发警告
      if (growth > this.warningThreshold) {
        console.warn(`Memory growth warning: ${growth.toFixed(2)}%`);
        console.warn(
          `Previous: ${this.formatMemorySize(previous.usedJSHeapSize)}, Current: ${this.formatMemorySize(current.usedJSHeapSize)}`
        );

        if (this.onWarning) {
          this.onWarning(current, previous, growth);
        }
      }
    }
  }

  // 获取内存历史记录
  public getHistory(): MemoryData[] {
    return [...this.history];
  }

  // 获取当前内存状态
  public getCurrentState(): {
    current: MemoryData | null;
    usage: number;
    history: MemoryData[];
  } {
    const current = this.getCurrentMemory();
    const usage = current ? this.calculateUsage(current) : 0;

    return {
      current,
      usage,
      history: this.getHistory()
    };
  }

  // 手动触发内存检查
  public manualCheck(): void {
    this.checkMemory();
  }
}

// 创建单例实例
let memoryMonitorInstance: MemoryMonitor | null = null;

export function getMemoryMonitor(options?: MemoryMonitorOptions): MemoryMonitor {
  if (!memoryMonitorInstance) {
    memoryMonitorInstance = new MemoryMonitor(options);
  }
  return memoryMonitorInstance;
}

// 资源清理类型定义
export interface CleanupResource {
  type: "timer" | "eventListener" | "abortController" | "custom";
  reference: any;
  cleanupFn?: () => void;
}

// 自动清理函数，用于组件卸载时清理内存
export function cleanupMemory(prefix: string = "", resources?: CleanupResource[]): void {
  console.log(`${prefix} Cleaning up memory...`);

  if (resources) {
    console.log(`${prefix} Cleaning ${resources.length} resources...`);

    let successCount = 0;
    let failedCount = 0;

    resources.forEach((resource, index) => {
      try {
        switch (resource.type) {
          case "timer":
            // 清理定时器
            if (typeof resource.reference === "number" || typeof resource.reference === "object") {
              clearTimeout(resource.reference);
              clearInterval(resource.reference);
            }
            successCount++;
            break;

          case "eventListener":
            // 清理事件监听器，支持多种事件系统
            if (resource.reference.target && resource.reference.eventName && resource.reference.handler) {
              const { target, eventName, handler } = resource.reference;
              try {
                // 优先尝试使用标准 DOM 事件监听器移除方法
                if (typeof target.removeEventListener === "function") {
                  target.removeEventListener(eventName, handler);
                  successCount++;
                }
                // 尝试使用 video.js 等库的事件移除方法
                else if (typeof target.off === "function") {
                  target.off(eventName, handler);
                  successCount++;
                }
                // 尝试使用其他常见的事件移除方法
                else if (typeof target.unbind === "function") {
                  target.unbind(eventName, handler);
                  successCount++;
                }
                // 如果都不支持，忽略清理
                else {
                  successCount++;
                }
              } catch (error) {
                console.error("Error removing event listener:", error);
                failedCount++;
              }
            } else {
              successCount++;
            }
            break;

          case "abortController":
            // 取消网络请求
            if (resource.reference.abort) {
              resource.reference.abort();
            }
            successCount++;
            break;

          case "custom":
            // 自定义清理逻辑
            if (resource.cleanupFn) {
              resource.cleanupFn();
            }
            successCount++;
            break;
        }
      } catch (error) {
        console.error(`${prefix} Error cleaning up resource ${index + 1}/${resources.length}:`, error);
        failedCount++;
      }
    });

    console.log(`${prefix} Memory cleanup completed: ${successCount} succeeded, ${failedCount} failed`);
  }

  // 手动触发垃圾回收（如果浏览器支持）
  if (typeof (window as any).gc === "function") {
    (window as any).gc();
    console.log(`${prefix} Garbage collection triggered`);
  }
}
