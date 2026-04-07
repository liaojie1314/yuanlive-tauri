import { useI18n } from "vue-i18n";
import { transformCoordinates } from "@/services/mapApi";

type GeolocationState = {
  loading: boolean;
  error: string | null;
  position: GeolocationPosition | null;
  permission: PermissionState | null;
  precision: "high" | "low";
};

type GeolocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
};

/**
 * 地理位置钩子
 * 提供地理位置相关功能，包括权限检查、位置获取和坐标转换
 */
export const useGeolocation = () => {
  const { t } = useI18n();
  const state = ref<GeolocationState>({
    loading: false,
    error: null,
    position: null,
    permission: null,
    precision: "high"
  });

  const isSupported = computed(() => "geolocation" in navigator);
  const hasPermission = computed(() => state.value.permission === "granted");
  const isLoading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);
  const currentPosition = computed(() => state.value.position);

  /**
   * 检查地理位置权限状态
   * @returns 权限状态（granted、denied或prompt）
   */
  const checkPermission = async (): Promise<PermissionState> => {
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        state.value.permission = permission.state;
        return permission.state;
      } catch (error) {
        console.warn(t("hook.location.permissionCheckFailed"), error);
      }
    }
    return "prompt";
  };

  /**
   * 获取当前位置
   * @param options 位置获取选项
   * @returns 位置信息
   */
  const getCurrentPosition = async (options?: GeolocationOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const unsupportedError = t("hook.location.unsupported");
        reject(new Error(unsupportedError));
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: state.value.precision === "high",
        timeout: 10000,
        maximumAge: 300000, // 5分钟缓存
        ...options
      };

      state.value.loading = true;
      state.value.error = null;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.value.loading = false;
          state.value.position = position;
          resolve(position);
        },
        (error) => {
          state.value.loading = false;
          let errorMessage = t("hook.location.errorGeneric");
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t("hook.location.permissionDenied");
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t("hook.location.positionUnavailable");
              break;
            case error.TIMEOUT:
              errorMessage = t("hook.location.timeout");
              break;
          }
          state.value.error = errorMessage;
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  };

  /**
   * 获取位置并转换坐标
   * @param options 位置获取选项
   * @returns 包含原始坐标、转换后的坐标、位置信息和地址的对象
   */
  const getLocationWithTransform = async (options?: GeolocationOptions) => {
    try {
      // 1. 尝试使用高精度的 HTML5 浏览器定位
      const position = await getCurrentPosition(options);
      const { latitude, longitude } = position.coords;

      // 转换坐标 (如 GCJ02 等)
      const transformed = await transformCoordinates(latitude, longitude);
      return {
        original: { lat: latitude, lng: longitude },
        transformed,
        position,
        address: "", // 后续可以通过逆地理编码获取
        precision: state.value.precision,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn("HTML5 定位失败或被拒绝，正在降级为 IP 定位...", error);
      // 降级方案：使用免费的 IP 定位 API
      try {
        // 这里使用 ipapi.co，也可以换成其他免费的如 ip-api.com
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        if (data && data.latitude && data.longitude) {
          // IP 定位直接返回目标位置的粗略坐标，通常不需要额外加密偏移转换
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);

          return {
            original: { lat, lng },
            transformed: { lat, lng }, // IP 坐标一般是标准 WGS84，可视情况决定是否调 transformCoordinates
            position: null,
            address: `${data.country_name} ${data.region} ${data.city}`, // 顺便连地址都拿到了
            precision: "low", // 标记为低精度
            timestamp: Date.now()
          };
        }
        throw new Error("IP 定位返回数据格式异常");
      } catch (ipError) {
        console.error("IP 定位降级也失败了:", ipError);
        throw error;
      }
    }
  };

  /**
   * 清除错误状态
   */
  const clearError = () => {
    state.value.error = null;
  };

  return {
    // 状态
    state: state.value,
    isSupported,
    hasPermission,
    isLoading,
    error,
    currentPosition,
    // 方法
    checkPermission,
    getCurrentPosition,
    getLocationWithTransform,
    clearError
  };
};
