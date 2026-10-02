import { NextRequest, NextResponse } from 'next/server';
import { VIETNAM_ADDRESSES, findPreciseCoordinates } from '@/data/vietnam-addresses';

export const dynamic = 'force-dynamic';

export interface AutocompleteSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  source: 'google' | 'nominatim' | 'local';
  /** Tọa độ GPS nếu có sẵn từ nguồn gợi ý (chỉ Nominatim trả về trực tiếp) */
  lat?: number;
  lng?: number;
}

/**
 * Chuẩn hóa ký tự tiếng Việt để so sánh fuzzy
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Chuyển tên Tỉnh/TP từ Google Maps / Nominatim (tên dài) sang dạng viết tắt chuẩn
 * VD: "Thành phố Hồ Chí Minh" -> "TP. Hồ Chí Minh"
 *     "Tỉnh Đồng Nai" -> "Đồng Nai"
 */
function normalizeProvinceName(name: string): string {
  return name
    .replace(/^Thành phố\s+/i, 'TP. ')
    .replace(/^Tỉnh\s+/i, '')
    .trim();
}

/**
 * Trích xuất tên đường thuần túy (bỏ số nhà) để tìm kiếm tốt hơn
 */
function extractStreetName(input: string): string {
  return input.replace(/^\d+[/\-]?\d*[a-zA-Z]?\s*/, '').trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input')?.trim();
    const province = searchParams.get('province')?.trim();
    const district = searchParams.get('district')?.trim();
    const ward = searchParams.get('ward')?.trim();

    if (!input || input.length < 2) {
      return NextResponse.json({ success: true, predictions: [] });
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // ──────────────────────────────────────────────────────────
    // 1. Google Maps Places Autocomplete (ưu tiên nếu có key)
    // ──────────────────────────────────────────────────────────
    if (apiKey) {
      try {
        // Xây query kết hợp: input + khu vực đã chọn
        const queryParts = [input];
        if (ward) queryParts.push(ward);
        if (district) queryParts.push(district);
        if (province) queryParts.push(province);
        const fullQuery = queryParts.join(', ');

        // Thiên vị khu vực đã chọn (location bias) để Google ưu tiên kết quả gần hơn
        let locationParam = '';
        if (province || district) {
          const biasCoords = findPreciseCoordinates(province, district, ward);
          if (biasCoords) {
            locationParam = `&location=${biasCoords.lat},${biasCoords.lng}&radius=30000`;
          }
        }

        const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          fullQuery
        )}&components=country:vn&language=vi&types=address${locationParam}&key=${apiKey}`;

        const gRes = await fetch(googleUrl, { next: { revalidate: 30 } });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === 'OK' && Array.isArray(gData.predictions) && gData.predictions.length > 0) {
            const predictions: AutocompleteSuggestion[] = gData.predictions
              .slice(0, 6)
              .map((p: any) => ({
                place_id: p.place_id,
                description: p.description,
                main_text: p.structured_formatting?.main_text || p.description,
                secondary_text: p.structured_formatting?.secondary_text || '',
                source: 'google' as const,
              }));
            return NextResponse.json({ success: true, predictions });
          }
        }
      } catch (e) {
        console.warn('[Geo Autocomplete] Google Places API failed, falling back:', e);
      }
    }

    // ──────────────────────────────────────────────────────────
    // 2. OpenStreetMap Nominatim (structured search cho đường)
    //    Dùng structured query: street=<tên đường>&city=<tỉnh>
    //    cho kết quả chính xác hơn free-text query rất nhiều
    // ──────────────────────────────────────────────────────────
    try {
      const allPredictions: AutocompleteSuggestion[] = [];

      // Strategy A: Structured search (chính xác nhất khi biết tỉnh)
      if (province) {
        const streetInput = input;
        // Chuyển "TP. Hồ Chí Minh" -> "Hồ Chí Minh", "Tỉnh Đồng Nai" -> "Đồng Nai"
        const cityName = province
          .replace(/^TP\.\s*/i, '')
          .replace(/^Thành phố\s*/i, '')
          .replace(/^Tỉnh\s*/i, '')
          .trim();

        const structParams = new URLSearchParams({
          street: streetInput,
          format: 'json',
          countrycodes: 'vn',
          addressdetails: '1',
          limit: '5',
          'accept-language': 'vi',
        });
        if (cityName) structParams.set('city', cityName);
        // Lưu ý: Nominatim VN không dùng county cho quận/huyện, chỉ dùng street+city

        const structUrl = `https://nominatim.openstreetmap.org/search?${structParams.toString()}`;

        const sRes = await fetch(structUrl, {
          headers: {
            'User-Agent': 'ThaiSonFoodsWeb/1.0 (thaisonfoods.vn)',
            'Accept-Language': 'vi,en;q=0.9',
          },
          signal: AbortSignal.timeout(4000),
        });

        if (sRes.ok) {
          const sData = await sRes.json();
          if (Array.isArray(sData)) {
            for (const item of sData) {
              if (allPredictions.length >= 5) break;
              const addr = item.address || {};
              const road = addr.road || addr.pedestrian || addr.name || '';
              const houseNum = addr.house_number || '';
              const prov = normalizeProvinceName(addr.city || addr.state || '');
              const dist = addr.suburb || addr.city_district || addr.county || '';
              const wardName = addr.quarter || addr.neighbourhood || addr.village || '';

              // Xây mô tả chính xác
              const mainText = [houseNum, road].filter(Boolean).join(' ') || item.name || input;
              const secondaryParts = [wardName, dist, prov].filter(Boolean);
              const secondaryText = secondaryParts.join(', ');

              // Tránh trùng lặp
              const desc = `${mainText}, ${secondaryText}`.replace(/,\s*$/, '');
              if (allPredictions.some((p) => p.description === desc)) continue;

              allPredictions.push({
                place_id: `nom_${item.place_id}`,
                description: desc,
                main_text: mainText,
                secondary_text: secondaryText || item.display_name,
                source: 'nominatim' as const,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
              });
            }
          }
        }
      }

      // Strategy B: Free-text search (bổ sung khi structured search ít kết quả)
      if (allPredictions.length < 3) {
        const freeQuery = [input, ward, district, province, 'Việt Nam']
          .filter(Boolean)
          .join(', ');

        const freeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          freeQuery
        )}&format=json&countrycodes=vn&addressdetails=1&limit=${5 - allPredictions.length}`;

        const fRes = await fetch(freeUrl, {
          headers: {
            'User-Agent': 'ThaiSonFoodsWeb/1.0 (thaisonfoods.vn)',
            'Accept-Language': 'vi,en;q=0.9',
          },
          signal: AbortSignal.timeout(3500),
        });

        if (fRes.ok) {
          const fData = await fRes.json();
          if (Array.isArray(fData)) {
            for (const item of fData) {
              if (allPredictions.length >= 5) break;
              const addr = item.address || {};
              const road = addr.road || addr.pedestrian || '';
              const houseNum = addr.house_number || '';
              const prov = normalizeProvinceName(addr.city || addr.state || '');
              const dist = addr.suburb || addr.city_district || addr.county || '';
              const wardName = addr.quarter || addr.neighbourhood || addr.village || '';
              const amenity = addr.amenity || addr.shop || addr.building || '';

              const mainText =
                amenity ||
                [houseNum, road].filter(Boolean).join(' ') ||
                item.name ||
                input;
              const secondaryParts = [wardName, dist, prov].filter(Boolean);
              const secondaryText = secondaryParts.join(', ');
              const desc = `${mainText}, ${secondaryText}`.replace(/,\s*$/, '');

              // Tránh trùng lặp
              if (allPredictions.some((p) => p.description === desc)) continue;
              // Lọc kết quả ở tỉnh khác nếu người dùng đã chọn tỉnh
              if (province && prov && normalize(prov) !== normalize(province)) {
                // Vẫn cho hiện nhưng đẩy xuống cuối
                continue;
              }

              allPredictions.push({
                place_id: `nom_${item.place_id}`,
                description: desc,
                main_text: mainText,
                secondary_text: secondaryText || item.display_name,
                source: 'nominatim' as const,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
              });
            }
          }
        }
      }

      if (allPredictions.length > 0) {
        return NextResponse.json({ success: true, predictions: allPredictions });
      }
    } catch (e) {
      // Nominatim timeout or error -> tiếp tục sang Local fallback
      console.warn('[Geo Autocomplete] Nominatim error:', e);
    }

    // ──────────────────────────────────────────────────────────
    // 3. Fallback Local Database: Tìm theo phường/quận/tỉnh
    // ──────────────────────────────────────────────────────────
    const qNorm = normalize(input);
    const localMatches: AutocompleteSuggestion[] = [];

    for (const prov of VIETNAM_ADDRESSES) {
      // Ưu tiên tỉnh đã chọn
      if (province && normalize(prov.name) !== normalize(province)) continue;

      for (const dist of prov.districts) {
        if (district && normalize(dist.name) !== normalize(district)) continue;

        for (const w of dist.wards) {
          const wNorm = normalize(w.name);
          const dNorm = normalize(dist.name);
          const pNorm = normalize(prov.name);
          const fullDesc = `${w.name}, ${dist.name}, ${prov.name}`;
          const fullNorm = `${wNorm} ${dNorm} ${pNorm}`;

          if (
            fullNorm.includes(qNorm) ||
            qNorm.includes(wNorm) ||
            (qNorm.length >= 3 && fullDesc.toLowerCase().includes(input.toLowerCase()))
          ) {
            localMatches.push({
              place_id: `loc_${encodeURIComponent(fullDesc)}`,
              description: fullDesc,
              main_text: w.name,
              secondary_text: `${dist.name}, ${prov.name}`,
              source: 'local' as const,
              lat: w.lat || dist.lat,
              lng: w.lng || dist.lng,
            });
            if (localMatches.length >= 5) break;
          }
        }
        if (localMatches.length >= 5) break;
      }
      if (localMatches.length >= 5) break;
    }

    return NextResponse.json({ success: true, predictions: localMatches });
  } catch (error: any) {
    console.error('[Geo Autocomplete] Internal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', predictions: [] },
      { status: 500 }
    );
  }
}
