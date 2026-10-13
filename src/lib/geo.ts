/**
 * Module tiện ích địa lý & tính khoảng cách GPS
 * Tách riêng hàm tính khoảng cách để dễ dàng tích hợp Google Maps Distance Matrix hoặc OSRM sau này.
 */

import { findStreetCoordinates } from '@/data/vietnam-streets';
import { VIETNAM_ADDRESSES } from '@/data/vietnam-addresses';

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
  // 1. Ưu tiên phân giải theo tuyến đường chính xác từ danh mục đường phố
  if (address) {
    const streetMatch = findStreetCoordinates(address, district, province);
    if (streetMatch) {
      return { lat: streetMatch.lat, lng: streetMatch.lng };
    }
  }

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

export function cleanAdministrativeComponent(val: string): string {
  return (val || '')
    .replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn|Khu phố|Tổ dân phố|KP|Tổ)\s+/i, '')
    .trim();
}

/**
 * Kiểm tra xem chuỗi có phải là đơn vị Khu phố / Tổ dân phố hay không
 */
export function isKhuPho(text?: string): boolean {
  if (!text) return false;
  return /^\s*(?:khu\s+phố|tổ\s+dân\s+phố|kp|tổ)\b/i.test(text.trim());
}

/**
 * Loại bỏ triệt để các thông tin "Khu phố", "Tổ dân phố", "KP" khỏi chuỗi địa chỉ
 * Ví dụ: "Khu phố 15, Phường 14, Quận Gò Vấp" -> "Phường 14, Quận Gò Vấp"
 * "123 Dương Quảng Hàm, Khu phố 3, Phường 5" -> "123 Dương Quảng Hàm, Phường 5"
 */
export function removeKhuPho(addressText?: string): string {
  if (!addressText) return '';
  return addressText
    .replace(/(?:,\s*)?\b(?:khu\s+phố|tổ\s+dân\s+phố|kp|tổ)\s*[\d\w\-]+(?=,|$)/gi, '')
    .replace(/^\s*(?:khu\s+phố|tổ\s+dân\s+phố|kp|tổ)\s*[\d\w\-]+(?:,\s*|\s+)/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/^\s*,\s*|\s*,\s*$/g, '')
    .trim();
}

/**
 * Khớp tên hành chính với danh mục chuẩn VIETNAM_ADDRESSES 2026.
 * Tự động suy ngược Quận/Huyện từ Phường/Xã nếu Quận bị thiếu hoặc nhầm lẫn.
 */
export function matchStandardAdministrative(
  provInput?: string,
  distInput?: string,
  wardInput?: string,
  addressContext?: string
): {
  province?: string;
  district?: string;
  ward?: string;
} {
  let matchedProv: string | undefined;
  let matchedDist: string | undefined;
  let matchedWard: string | undefined;

  // Bỏ qua nếu đầu vào là cấp khu phố / tổ dân phố
  if (wardInput && isKhuPho(wardInput)) {
    wardInput = undefined;
  }

  let pQuery = provInput;
  if (!pQuery && addressContext) {
    const pFoundByAddr = VIETNAM_ADDRESSES.find((p) =>
      addressContext.toLowerCase().includes(cleanAdministrativeComponent(p.name).toLowerCase())
    );
    if (pFoundByAddr) pQuery = pFoundByAddr.name;
  }

  // Mặc định TP. Hồ Chí Minh nếu không có ngữ cảnh tỉnh cụ thể (trung tâm hoạt động chính của Thái Sơn Foods)
  if (!pQuery) {
    pQuery = 'TP. Hồ Chí Minh';
  }

  if (pQuery) {
    const pClean = cleanAdministrativeComponent(pQuery).toLowerCase();
    const pFound = VIETNAM_ADDRESSES.find((p) => {
      const pNameClean = cleanAdministrativeComponent(p.name).toLowerCase();
      return (
        pNameClean === pClean ||
        p.name.toLowerCase().includes(pClean) ||
        pClean.includes(pNameClean)
      );
    });

    if (pFound) {
      matchedProv = pFound.name;

      let dQuery = distInput;
      if (!dQuery && addressContext) {
        const dFoundByAddr = pFound.districts.find((d) => {
          const dClean = cleanAdministrativeComponent(d.name).toLowerCase();
          if (/^\d+$/.test(dClean)) {
            return new RegExp(`(?:quận|q\\.?|q\\s*)\\s*${dClean}(?!\\d)`, 'i').test(addressContext);
          }
          return (
            new RegExp(`(?:quận|q\\.?|huyện|h\\.?|tx\\.?|tp\\.?)?\\s*${dClean}\\b`, 'i').test(addressContext) ||
            addressContext.toLowerCase().includes(d.name.toLowerCase())
          );
        });
        if (dFoundByAddr) dQuery = dFoundByAddr.name;
      }

      if (dQuery) {
        const dClean = cleanAdministrativeComponent(dQuery).toLowerCase();
        const dFound = pFound.districts.find((d) => {
          const dNameClean = cleanAdministrativeComponent(d.name).toLowerCase();
          return (
            dNameClean === dClean ||
            d.name.toLowerCase().includes(dClean) ||
            dClean.includes(dNameClean)
          );
        });

        if (dFound) {
          matchedDist = dFound.name;

          if (wardInput) {
            const wClean = cleanAdministrativeComponent(wardInput).toLowerCase();
            let wFound = dFound.wards.find(
              (w) => w.name.toLowerCase() === wardInput.toLowerCase()
            );
            if (!wFound) {
              wFound = dFound.wards.find(
                (w) => cleanAdministrativeComponent(w.name).toLowerCase() === wClean
              );
            }
            if (!wFound) {
              wFound = dFound.wards.find((w) =>
                w.aliases?.some((a) => {
                  const aClean = cleanAdministrativeComponent(a).toLowerCase();
                  return (
                    a.toLowerCase() === wardInput.toLowerCase() ||
                    aClean === wClean
                  );
                })
              );
            }
            if (wFound) {
              matchedWard = wFound.name;
            }
          }
        }
      }

      // Suy ngược Quận từ Phường nếu district bị thiếu hoặc nhầm lẫn (cực kỳ quan trọng cho OSM & Google Maps)
      if (!matchedDist && pFound) {
        // Ưu tiên dùng wardInput (tránh để số nhà trong addressContext gây nhiễu)
        const targetWardText = (wardInput || addressContext || '').toLowerCase();
        const targetWardClean = cleanAdministrativeComponent(targetWardText).toLowerCase();
        for (const d of pFound.districts) {
          const wFound = d.wards.find((w) => {
            const wClean = cleanAdministrativeComponent(w.name).toLowerCase();
            if (/^\d+$/.test(wClean)) {
              return new RegExp(`(?:phường|p\\.?|p\\s*)\\s*${wClean}(?!\\d)`, 'i').test(targetWardText);
            }
            return (
              targetWardText.includes(w.name.toLowerCase()) ||
              targetWardText.includes(wClean) ||
              (targetWardClean.length >= 3 && wClean.includes(targetWardClean)) ||
              new RegExp(`\\b(phường|p\\.?)\\s*${wClean}\\b`, 'i').test(targetWardText) ||
              w.aliases?.some((a) => {
                const aClean = cleanAdministrativeComponent(a).toLowerCase();
                if (/^\d+$/.test(aClean)) {
                  return new RegExp(`(?:phường|p\\.?|p\\s*)\\s*${aClean}(?!\\d)`, 'i').test(targetWardText);
                }
                return (
                  targetWardText.includes(aClean) ||
                  (targetWardClean.length >= 3 && aClean.includes(targetWardClean)) ||
                  new RegExp(`(?:phường|p\\.?)\\s*${aClean}\\b`, 'i').test(targetWardText)
                );
              })
            );
          });
          if (wFound) {
            matchedDist = d.name;
            if (!matchedWard) matchedWard = wFound.name;
            break;
          }
        }
      }

      // Suy ngược Quận và Phường từ Tuyến đường GPS nếu vẫn chưa xác định được Quận
      if ((!matchedDist || !matchedWard) && addressContext) {
        try {
          const streetFound = findStreetCoordinates(addressContext, matchedDist, matchedProv);
          if (streetFound?.matchedStreet) {
            if (!matchedDist && streetFound.matchedStreet.district) {
              const dTarget = streetFound.matchedStreet.district;
              const dExact = pFound.districts.find(
                (d) => cleanAdministrativeComponent(d.name).toLowerCase() === cleanAdministrativeComponent(dTarget).toLowerCase()
              );
              if (dExact) matchedDist = dExact.name;
            }
            if (!matchedWard && streetFound.matchedStreet.wardHint) {
              const wTarget = streetFound.matchedStreet.wardHint;
              const currentDistObj = pFound.districts.find((d) => d.name === matchedDist);
              if (currentDistObj) {
                const wExact = currentDistObj.wards.find(
                  (w) => cleanAdministrativeComponent(w.name).toLowerCase() === cleanAdministrativeComponent(wTarget).toLowerCase()
                );
                if (wExact) matchedWard = wExact.name;
                else matchedWard = wTarget;
              } else {
                matchedWard = wTarget;
              }
            }
          }
        } catch {
          // ignore lookup error
        }
      }
    }
  }

  return {
    province: matchedProv || provInput || 'TP. Hồ Chí Minh',
    district: matchedDist || distInput,
    ward: matchedWard || (wardInput && !isKhuPho(wardInput) ? removeKhuPho(wardInput) : undefined),
  };
}

