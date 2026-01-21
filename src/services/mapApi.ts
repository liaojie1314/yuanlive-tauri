import { UrlEnum } from "@/enums";
import { request } from "@/utils/RequestUtils";
import { wgs84ToGcj02 } from "@/utils/CoordinateTransform";

type TransformedCoordinate = {
  lat: number;
  lng: number;
};

type AddressComponent = {
  province: string;
  city: string;
  district: string;
  street: string;
  street_number: string;
};

type ReverseGeocodeResult = {
  address: string;
  formatted_addresses: {
    recommend: string;
    rough: string;
  };
  address_component: AddressComponent;
  ad_info: {
    nation_code: string;
    adcode: string;
    city_code: string;
  };
};

/**
 * 地图坐标转换（WGS84 -> GCJ-02）
 * @param lat 纬度
 * @param lng 经度
 * @returns 转换后的坐标
 */
export const transformCoordinates = async (lat: number, lng: number): Promise<TransformedCoordinate> => {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error("坐标范围无效");
  try {
    const data = await request<{ lat: number; lng: number }>({
      url: UrlEnum.MAP_COORD_TRANSLATE,
      params: { lat, lng }
    });
    return { lat: data.lat, lng: data.lng };
  } catch (_error) {
    return wgs84ToGcj02(lat, lng);
  }
};

/**
 * 地图逆地理编码（获取地址信息）
 * @param lat 纬度
 * @param lng 经度
 * @returns 地址信息
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error("坐标范围无效");
  try {
    const data = await request<ReverseGeocodeResult>({
      url: UrlEnum.MAP_REVERSE_GEOCODE,
      params: { lat, lng }
    });
    return data;
  } catch (_error) {
    return null;
  }
};

/**
 * 地图静态图（获取静态地图图片）
 * @param lat 纬度
 * @param lng 经度
 * @param width 宽度
 * @param height 高度
 * @param zoom 缩放级别
 * @returns 静态地图图片URL
 */
export const getStaticMap = async (lat: number, lng: number, width = 600, height = 400, zoom = 18): Promise<string> => {
  const data = await request<{ dataUrl: string }>({
    url: UrlEnum.MAP_STATIC,
    params: { lat, lng, width, height, zoom }
  });
  return data.dataUrl || "";
};
