/**
 * Module tiện ích địa lý & tính khoảng cách GPS
 * Tách riêng hàm tính khoảng cách để dễ dàng tích hợp Google Maps Distance Matrix hoặc OSRM sau này.
 */

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Bán kính Trái Đất tính theo km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Làm tròn đến 1 chữ số thập phân (vd: 3.2 km)
}

export interface StoreGeoItem {
  code: string;
  name?: string;
  address?: string;
  phone?: string;
  latitude: number | null;
  longitude: number | null;
  [key: string]: any;
}

export interface StoreDistanceResult<T extends StoreGeoItem = StoreGeoItem> {
  store: T;
  distanceKm: number;
  isWithinRadius: boolean;
}

// Bảng tọa độ trung tâm các quận/huyện tại TP.HCM và vùng lân cận (fallback khi không có GPS)
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // TP.HCM
  'quan 1': { lat: 10.7756, lng: 106.7004 },
  'q1': { lat: 10.7756, lng: 106.7004 },
  'quan 3': { lat: 10.7844, lng: 106.6844 },
  'q3': { lat: 10.7844, lng: 106.6844 },
  'quan 4': { lat: 10.7600, lng: 106.7025 },
  'q4': { lat: 10.7600, lng: 106.7025 },
  'quan 5': { lat: 10.7554, lng: 106.6667 },
  'q5': { lat: 10.7554, lng: 106.6667 },
  'quan 6': { lat: 10.7481, lng: 106.6352 },
  'q6': { lat: 10.7481, lng: 106.6352 },
  'quan 7': { lat: 10.7340, lng: 106.7218 },
  'q7': { lat: 10.7340, lng: 106.7218 },
  'quan 8': { lat: 10.7241, lng: 106.6286 },
  'q8': { lat: 10.7241, lng: 106.6286 },
  'quan 10': { lat: 10.7716, lng: 106.6672 },
  'q10': { lat: 10.7716, lng: 106.6672 },
  'quan 11': { lat: 10.7629, lng: 106.6504 },
  'q11': { lat: 10.7629, lng: 106.6504 },
  'quan 12': { lat: 10.8672, lng: 106.6413 },
  'q12': { lat: 10.8672, lng: 106.6413 },
  'tan binh': { lat: 10.8015, lng: 106.6534 },
  'tan phu': { lat: 10.7900, lng: 106.6280 },
  'binh thanh': { lat: 10.8106, lng: 106.6982 },
  'go vap': { lat: 10.8388, lng: 106.6658 },
  'phu nhuan': { lat: 10.7992, lng: 106.6803 },
  'binh tan': { lat: 10.7654, lng: 106.6039 },
  'thu duc': { lat: 10.8494, lng: 106.7716 },
  'tp thu duc': { lat: 10.8494, lng: 106.7716 },
  'quan 2': { lat: 10.7872, lng: 106.7498 },
  'q2': { lat: 10.7872, lng: 106.7498 },
  'quan 9': { lat: 10.8428, lng: 106.8286 },
  'q9': { lat: 10.8428, lng: 106.8286 },
  'hoc mon': { lat: 10.8841, lng: 106.5925 },
  'cu chi': { lat: 10.9731, lng: 106.4939 },
  'binh chanh': { lat: 10.6875, lng: 106.5939 },
  'nha be': { lat: 10.6953, lng: 106.7297 },
  'can gio': { lat: 10.4114, lng: 106.9642 },

  // Bình Dương, Đồng Nai, Tây Ninh, Cần Thơ, Vũng Tàu lân cận
  'di an': { lat: 10.9026, lng: 106.7600 },
  'thuan an': { lat: 10.9523, lng: 106.7296 },
  'thu dau mot': { lat: 10.9914, lng: 106.6441 },
  'ben cat': { lat: 11.0963, lng: 106.6617 },
  'bien hoa': { lat: 10.9574, lng: 106.8427 },
  'long thanh': { lat: 10.8523, lng: 106.9436 },
  'trang bom': { lat: 10.9444, lng: 107.0105 },
  'xuan loc': { lat: 10.8553, lng: 107.4918 },
  'trang bang': { lat: 11.0393, lng: 106.3565 },
  'tay ninh': { lat: 11.0393, lng: 106.3565 },
  'ninh kieu': { lat: 10.0402, lng: 105.7501 },
  'can tho': { lat: 10.0402, lng: 105.7501 },
  'vung tau': { lat: 10.3614, lng: 107.0946 },
  'tp vung tau': { lat: 10.3614, lng: 107.0946 },
  'ba ria': { lat: 10.4950, lng: 107.1685 },
};

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ước tính tọa độ GPS từ thông tin địa chỉ/quận huyện (fallback khi khách không cấp quyền GPS)
 */
export function estimateCoordinatesFromAddress(
  province?: string | null,
  district?: string | null,
  address?: string | null
): { lat: number; lng: number } | null {
  const combined = normalizeVietnamese(`${district || ''} ${address || ''} ${province || ''}`);

  // Tìm match dài trước (ưu tiên cụm từ đầy đủ như "tan phu", "binh thanh")
  const keys = Object.keys(DISTRICT_COORDINATES).sort((a, b) => b.length - a.length);

  for (const k of keys) {
    // Regex boundary để tránh match nhầm substring (ví dụ "q1" trong "q12")
    const regex = new RegExp(`(^|\\s)${k}(\\s|$)`);
    if (regex.test(combined)) {
      return DISTRICT_COORDINATES[k];
    }
  }

  // Mặc định trung tâm TP.HCM nếu thuộc TP.HCM nhưng không rõ quận
  if (combined.includes('ho chi minh') || combined.includes('hcm') || combined.includes('sai gon')) {
    return { lat: 10.7769, lng: 106.7009 };
  }

  return null;
}

/**
 * Tính khoảng cách từ vị trí khách hàng đến danh sách các cửa hàng và sắp xếp tăng dần
 */
export function calculateStoreDistances<T extends StoreGeoItem>(
  stores: T[],
  customerLat: number,
  customerLng: number,
  maxRadiusKm = 25
): Array<StoreDistanceResult<T>> {
  const results: Array<StoreDistanceResult<T>> = [];

  for (const store of stores) {
    if (
      typeof store.latitude === 'number' &&
      typeof store.longitude === 'number' &&
      !isNaN(store.latitude) &&
      !isNaN(store.longitude)
    ) {
      const distanceKm = calculateHaversineDistance(
        customerLat,
        customerLng,
        store.latitude,
        store.longitude
      );
      results.push({
        store,
        distanceKm,
        isWithinRadius: distanceKm <= maxRadiusKm,
      });
    }
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Tìm cửa hàng gần nhất với khách hàng
 */
export function findNearestStore<T extends StoreGeoItem>(
  stores: T[],
  customerLat: number,
  customerLng: number,
  maxRadiusKm = 25
): StoreDistanceResult<T> | null {
  const sorted = calculateStoreDistances(stores, customerLat, customerLng, maxRadiusKm);
  return sorted.length > 0 ? sorted[0] : null;
}

