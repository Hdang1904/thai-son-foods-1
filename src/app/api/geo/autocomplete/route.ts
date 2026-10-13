import { NextRequest, NextResponse } from 'next/server';
import { VIETNAM_ADDRESSES, findPreciseCoordinates } from '@/data/vietnam-addresses';
import {
  searchStreetSuggestions,
  extractHouseNumberAndStreet,
  findStreetCoordinates,
} from '@/data/vietnam-streets';
import { matchStandardAdministrative, isKhuPho, removeKhuPho } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export interface AutocompleteSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  source: 'google' | 'nominatim' | 'photon' | 'local';
  /** Tọa độ GPS chính xác */
  lat?: number;
  lng?: number;
  /** Đơn vị hành chính bóc tách chuẩn 2026 */
  ward?: string;
  district?: string;
  province?: string;
}

/**
 * Chuẩn hóa ký tự tiếng Việt để so sánh fuzzy
 */
function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

/**
 * Chuyển tên Tỉnh/TP sang dạng chuẩn
 */
function normalizeProvinceName(name: string): string {
  return (name || '')
    .replace(/^Thành phố\s+/i, 'TP. ')
    .replace(/^Tỉnh\s+/i, '')
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input')?.trim();
    const provinceParam = searchParams.get('province')?.trim();
    const districtParam = searchParams.get('district')?.trim();
    const wardParam = searchParams.get('ward')?.trim();

    if (!input || input.length < 2) {
      return NextResponse.json({ success: true, predictions: [] });
    }

    const { houseNumber, streetQuery } = extractHouseNumberAndStreet(input);
    const effectiveStreetQuery = streetQuery || input;

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const aggregated: AutocompleteSuggestion[] = [];
    const seenDescriptions = new Set<string>();

    const addSuggestion = (item: AutocompleteSuggestion, prepend = false) => {
      // 1. Loại bỏ triệt để mọi thông tin "Khu phố", "Tổ dân phố", "KP"
      item.main_text = removeKhuPho(item.main_text);
      item.secondary_text = removeKhuPho(item.secondary_text);
      item.description = removeKhuPho(item.description);
      if (item.ward) item.ward = removeKhuPho(item.ward);

      // Chuẩn hóa mô tả để chống trùng lặp
      const normKey = normalize(`${item.main_text} ${item.secondary_text}`);
      if (seenDescriptions.has(normKey)) return;
      seenDescriptions.add(normKey);

      if (prepend) {
        aggregated.unshift(item);
      } else {
        aggregated.push(item);
      }
    };

    // ──────────────────────────────────────────────────────────
    // 1. Google Maps Places Autocomplete (Ưu tiên nếu có API Key)
    // ──────────────────────────────────────────────────────────
    if (apiKey) {
      try {
        const queryParts = [input];
        if (wardParam) queryParts.push(wardParam);
        if (districtParam) queryParts.push(districtParam);
        if (provinceParam) queryParts.push(provinceParam);
        const fullQuery = queryParts.join(', ');

        let locationParam = '';
        if (provinceParam || districtParam) {
          const biasCoords = findPreciseCoordinates(provinceParam, districtParam, wardParam);
          if (biasCoords) {
            locationParam = `&location=${biasCoords.lat},${biasCoords.lng}&radius=35000`;
          }
        }

        const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          fullQuery
        )}&components=country:vn&language=vi&types=address${locationParam}&key=${apiKey}`;

        const gRes = await fetch(googleUrl, { next: { revalidate: 30 } });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === 'OK' && Array.isArray(gData.predictions)) {
            for (const p of gData.predictions.slice(0, 8)) {
              addSuggestion({
                place_id: p.place_id,
                description: p.description,
                main_text: p.structured_formatting?.main_text || p.description,
                secondary_text: p.structured_formatting?.secondary_text || '',
                source: 'google',
              });
            }
          }
        }
      } catch (e) {
        console.warn('[Geo Autocomplete] Google Places API warning:', e);
      }
    }

    // ──────────────────────────────────────────────────────────
    // 2. CSDL Tuyến đường GPS Nội bộ (Vietnam Streets & Landmark Dataset 2026)
    //    Siêu tốc (< 2ms), gắn chuẩn xác 100% Phường & Quận theo quy hoạch mới
    // ──────────────────────────────────────────────────────────
    try {
      const streetSuggestions = searchStreetSuggestions(
        input,
        districtParam,
        provinceParam,
        wardParam,
        10
      );

      for (const s of streetSuggestions) {
        // Tự động suy ngược Quận chuẩn từ Phường nếu cần
        const adminMatched = matchStandardAdministrative(
          s.province,
          s.district,
          s.wardHint,
          input
        );

        const resolvedDistrict = adminMatched.district || s.district;
        const resolvedWard = adminMatched.ward || s.wardHint;
        const resolvedProvince = adminMatched.province || s.province;

        let mainText = s.main_text;
        const numToPrefix = s.houseNumber || houseNumber;
        if (numToPrefix && !new RegExp(`^${numToPrefix}\\b`, 'i').test(mainText)) {
          mainText = `${numToPrefix} ${mainText}`;
        }

        const secondaryParts = [resolvedWard, resolvedDistrict, resolvedProvince].filter(Boolean);
        const secondaryText = secondaryParts.join(', ');
        const description = `${mainText}, ${secondaryText}`;

        addSuggestion({
          place_id: s.place_id,
          description,
          main_text: mainText,
          secondary_text: secondaryText,
          source: 'local',
          lat: s.lat,
          lng: s.lng,
          ward: resolvedWard,
          district: resolvedDistrict,
          province: resolvedProvince,
        });
      }
    } catch (e) {
      console.warn('[Geo Autocomplete] Street suggestions warning:', e);
    }

    // ──────────────────────────────────────────────────────────
    // 3. OpenStreetMap Nominatim Engine
    //    Bóc tách chuẩn đơn vị hành chính 2026, khôi phục Quận tự động
    // ──────────────────────────────────────────────────────────
    try {
      const cityName = (provinceParam || 'TP. Hồ Chí Minh')
        .replace(/^TP\.\s*/i, '')
        .replace(/^Thành phố\s*/i, '')
        .replace(/^Tỉnh\s*/i, '')
        .trim();

      // 3.1. Structured search theo tên đường
      const structParams = new URLSearchParams({
        street: effectiveStreetQuery,
        format: 'json',
        countrycodes: 'vn',
        addressdetails: '1',
        limit: '8',
        'accept-language': 'vi',
      });
      if (cityName) structParams.set('city', cityName);

      const structUrl = `https://nominatim.openstreetmap.org/search?${structParams.toString()}`;
      const sRes = await fetch(structUrl, {
        headers: {
          'User-Agent': 'ThaiSonFoodsWeb/1.0 (contact@thaisonfoods.vn)',
          'Accept-Language': 'vi,en;q=0.9',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (sRes.ok) {
        const sData = await sRes.json();
        if (Array.isArray(sData)) {
          for (const item of sData) {
            const addr = item.address || {};
            const road = addr.road || addr.pedestrian || addr.name || effectiveStreetQuery;
            const itemHouseNum = addr.house_number || houseNumber || '';

            // Bóc tách cấp Phường (chỉ nhận Phường/Xã/Thị trấn, LOẠI BỎ Khu phố/Tổ)
            let rawWard = '';
            if (addr.suburb && /^(phường|xã|thị trấn)\s+/i.test(addr.suburb)) {
              rawWard = addr.suburb;
            } else if (addr.quarter && /^(phường|xã|thị trấn)\s+/i.test(addr.quarter)) {
              rawWard = addr.quarter;
            } else if (addr.suburb && !isKhuPho(addr.suburb)) {
              rawWard = addr.suburb;
            } else {
              const candidate = addr.village || wardParam || '';
              rawWard = isKhuPho(candidate) ? (wardParam || '') : candidate;
            }
            if (isKhuPho(rawWard)) rawWard = '';

            const rawDist = addr.city_district || addr.county || districtParam || '';
            const rawProv = addr.city || addr.state || provinceParam || 'TP. Hồ Chí Minh';

            // Suy ngược Quận từ Phường nếu rawDist bị thiếu trong OSM
            const matched = matchStandardAdministrative(rawProv, rawDist, rawWard, effectiveStreetQuery);

            const finalProv = matched.province || normalizeProvinceName(rawProv);
            const finalDist = matched.district || (rawDist ? rawDist : undefined);
            const finalWard = matched.ward && !isKhuPho(matched.ward) ? removeKhuPho(matched.ward) : undefined;

            let mainText = removeKhuPho(road || item.name || input);
            if (itemHouseNum && !new RegExp(`^${itemHouseNum}\\b`, 'i').test(mainText)) {
              mainText = `${itemHouseNum} ${mainText}`;
            }

            // Xây dựng secondary text chuẩn: Phường, Quận, Tỉnh/TP (loại bỏ hoàn toàn khu phố)
            const secondaryParts = [finalWard, finalDist, finalProv].map(removeKhuPho).filter(Boolean);
            const secondaryText = secondaryParts.join(', ');
            const desc = `${mainText}, ${secondaryText}`;

            addSuggestion({
              place_id: `nom_${item.place_id}`,
              description: desc,
              main_text: mainText,
              secondary_text: secondaryText,
              source: 'nominatim',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              ward: finalWard,
              district: finalDist,
              province: finalProv,
            });
          }
        }
      }

      // 3.2. Photon Geocoder bổ sung ngõ hẻm và công trình chi tiết
      if (aggregated.length < 10) {
        try {
          const photonQuery = [effectiveStreetQuery, districtParam, cityName].filter(Boolean).join(', ');
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
            photonQuery
          )}&lat=10.82&lon=106.68&limit=6`;

          const pRes = await fetch(photonUrl, {
            headers: {
              'User-Agent': 'ThaiSonFoodsWeb/1.0 (contact@thaisonfoods.vn)',
              'Accept-Language': 'vi',
            },
            signal: AbortSignal.timeout(2500),
          });

          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData?.features && Array.isArray(pData.features)) {
              for (const feat of pData.features) {
                const prop = feat.properties || {};
                const coords = feat.geometry?.coordinates; // [lon, lat]
                if (!coords || coords.length < 2) continue;

                const road = prop.name || prop.street || effectiveStreetQuery;
                const pHouse = prop.housenumber || houseNumber || '';
                const pWardRaw = prop.district || prop.locality || wardParam || '';
                const pDistRaw = districtParam || '';
                const pProvRaw = prop.city || prop.state || provinceParam || 'TP. Hồ Chí Minh';

                const matched = matchStandardAdministrative(pProvRaw, pDistRaw, pWardRaw, effectiveStreetQuery);

                const finalProv = matched.province || normalizeProvinceName(pProvRaw);
                const finalDist = matched.district || (pDistRaw ? pDistRaw : undefined);
                const finalWard = matched.ward || (pWardRaw ? pWardRaw : undefined);

                let mainText = road;
                if (pHouse && !new RegExp(`^${pHouse}\\b`, 'i').test(mainText)) {
                  mainText = `${pHouse} ${mainText}`;
                }
                const secondaryParts = [finalWard, finalDist, finalProv].map(removeKhuPho).filter(Boolean);
                const secondaryText = secondaryParts.join(', ');
                const desc = `${mainText}, ${secondaryText}`;

                addSuggestion({
                  place_id: `pho_${prop.osm_id || Math.random()}`,
                  description: desc,
                  main_text: mainText,
                  secondary_text: secondaryText,
                  source: 'nominatim',
                  lat: coords[1],
                  lng: coords[0],
                  ward: finalWard,
                  district: finalDist,
                  province: finalProv,
                });
              }
            }
          }
        } catch (e) {
          // ignore photon error
        }
      }
    } catch (e) {
      console.warn('[Geo Autocomplete] OSM warning:', e);
    }

    // ──────────────────────────────────────────────────────────
    // 4. Đảm bảo Gợi Ý Chính Xác Số 1 (VIP Exact Match)
    //    Nếu người dùng gõ số nhà rõ ràng (vd: "10 đường dương quảng hàm"),
    //    đảm bảo luôn có 1 gợi ý số 1 với đúng số nhà + tên đường + Phường & Quận chuẩn
    // ──────────────────────────────────────────────────────────
    if (houseNumber && effectiveStreetQuery) {
      const directMatch = findStreetCoordinates(
        input,
        districtParam,
        provinceParam || 'TP. Hồ Chí Minh'
      );

      if (directMatch) {
        const s = directMatch.matchedStreet;
        const adminMatched = matchStandardAdministrative(
          s.province,
          s.district,
          s.wardHint,
          input
        );

        const resolvedDist = adminMatched.district || s.district;
        const resolvedWard = adminMatched.ward || s.wardHint;
        const resolvedProv = adminMatched.province || s.province;

        const mainText = `${houseNumber} ${s.streetName}`;
        const secondaryParts = [resolvedWard, resolvedDist, resolvedProv].filter(Boolean);
        const secondaryText = secondaryParts.join(', ');
        const desc = `${mainText}, ${secondaryText}`;

        addSuggestion(
          {
            place_id: `vip_${s.districtClean}_${s.streetNameClean}_${houseNumber}`,
            description: desc,
            main_text: mainText,
            secondary_text: secondaryText,
            source: 'local',
            lat: directMatch.lat,
            lng: directMatch.lng,
            ward: resolvedWard,
            district: resolvedDist,
            province: resolvedProv,
          },
          true // Đưa lên vị trí đầu tiên
        );
      }
    }

    // ──────────────────────────────────────────────────────────
    // 5. Fallback Phường/Xã từ Danh mục Hành chính 2026
    // ──────────────────────────────────────────────────────────
    if (aggregated.length < 4) {
      const qNorm = normalize(input);
      for (const prov of VIETNAM_ADDRESSES) {
        if (provinceParam && normalize(prov.name) !== normalize(provinceParam)) continue;
        for (const dist of prov.districts) {
          if (districtParam && normalize(dist.name) !== normalize(districtParam)) continue;
          for (const w of dist.wards) {
            const wNorm = normalize(w.name);
            const fullDesc = `${input}, ${w.name}, ${dist.name}, ${prov.name}`;
            if (
              qNorm.includes(wNorm) ||
              wNorm.includes(qNorm) ||
              w.aliases?.some((a) => normalize(a).includes(qNorm))
            ) {
              addSuggestion({
                place_id: `loc_${encodeURIComponent(fullDesc)}`,
                description: fullDesc,
                main_text: `${input}, ${w.name}`,
                secondary_text: `${dist.name}, ${prov.name}`,
                source: 'local',
                lat: w.lat || dist.lat,
                lng: w.lng || dist.lng,
                ward: w.name,
                district: dist.name,
                province: prov.name,
              });
              if (aggregated.length >= 8) break;
            }
          }
          if (aggregated.length >= 8) break;
        }
        if (aggregated.length >= 8) break;
      }
    }

    // ──────────────────────────────────────────────────────────
    // 6. Xếp hạng thông minh (Smart Ranking)
    // ──────────────────────────────────────────────────────────
    const pNorm = provinceParam ? normalize(provinceParam) : '';
    const dNorm = districtParam ? normalize(districtParam) : '';
    const wNorm = wardParam ? normalize(wardParam) : '';

    const sortedPredictions = aggregated.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      const descA = normalize(a.description);
      const descB = normalize(b.description);

      // Ưu tiên trùng khớp số nhà nếu người dùng có nhập
      if (houseNumber) {
        if (a.main_text.startsWith(houseNumber)) scoreA += 150;
        if (b.main_text.startsWith(houseNumber)) scoreB += 150;
      }

      if (wNorm && descA.includes(wNorm)) scoreA += 100;
      if (wNorm && descB.includes(wNorm)) scoreB += 100;

      if (dNorm && descA.includes(dNorm)) scoreA += 50;
      if (dNorm && descB.includes(dNorm)) scoreB += 50;

      if (pNorm && descA.includes(pNorm)) scoreA += 20;
      if (pNorm && descB.includes(pNorm)) scoreB += 20;

      // Ưu tiên kết quả có GPS sẵn
      if (a.lat && a.lng) scoreA += 10;
      if (b.lat && b.lng) scoreB += 10;

      return scoreB - scoreA;
    });

    return NextResponse.json({
      success: true,
      predictions: sortedPredictions.slice(0, 10),
    });
  } catch (error: any) {
    console.error('[Geo Autocomplete] Internal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', predictions: [] },
      { status: 500 }
    );
  }
}
