import type { Metric } from "web-vitals";
import { invoke } from "@tauri-apps/api/core";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

import { StorageKeyEnum, TauriCommandEnum } from "@/enums";

type WebVitalMetric =
  | (Metric & { type: "web-vital" })
  | {
      type: "longtask";
      name: string;
      startTime: number;
      duration: number;
      attribution?: Record<string, unknown>;
    };

type Reporter = (metric: WebVitalMetric) => void;

const defaultReporter: Reporter = async (metric) => {
  // 规范化事件名称
  const eventName = metric.type === "web-vital" ? `WebVital_${metric.name}` : "LongTask";
  const deviceID = localStorage.getItem(StorageKeyEnum.DEVICE_ID) || "anonymous_fallback_id";
  const propertiesWithId = {
    ...metric,
    distinct_id: deviceID
  };
  const isDev = import.meta.env.DEV;
  // 仅在开发环境打印，避免污染生产环境控制台
  if (isDev) {
    console.info("[performance]", eventName, metric);
    return;
  }
  // 生产环境进行上报
  invoke(TauriCommandEnum.TRACK_EVENT, {
    event: eventName,
    properties: propertiesWithId
  }).catch((err) => {
    console.error(`[Telemetry] Failed to send ${eventName} to Rust:`, err);
  });
};

let hasStarted = false;

/**
 * 启动Web Vitals和Long Task观察者
 * @param reporter 可选的指标报告函数，默认使用console.info输出
 */
export const startWebVitalObserver = (reporter: Reporter = defaultReporter) => {
  if (hasStarted || typeof window === "undefined") return;
  hasStarted = true;

  const report = (metric: Metric) => {
    reporter({
      ...metric,
      type: "web-vital"
    });
  };

  onCLS(report, { reportAllChanges: true });
  onFCP(report);
  onINP(report, { reportAllChanges: true });
  onLCP(report, { reportAllChanges: true });
  onTTFB(report);

  if (
    "PerformanceObserver" in window &&
    Array.isArray((PerformanceObserver as any).supportedEntryTypes) &&
    (PerformanceObserver as any).supportedEntryTypes.includes("longtask")
  ) {
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        reporter({
          type: "longtask",
          name: entry.name || "longtask",
          startTime: entry.startTime,
          duration: entry.duration,
          attribution: (entry as any).attribution
        });
      }
    });

    try {
      observer.observe({ type: "longtask", buffered: true });
    } catch (error) {
      console.warn("[performance] longtask observer failed:", error);
    }
  }
};
