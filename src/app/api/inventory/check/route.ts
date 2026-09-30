import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getAvailability, expandComboItems } from '@/lib/inventory';
import { calculateHaversineDistance, estimateCoordinatesFromAddress } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeCode, items, lat, lng, latitude, longitude, province, district, address } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: true,
        isAvailable: true,
        insufficientItems: [],
        itemsDetail: [],
        alternativeStores: [],
      });
    }

    const targetStoreCode = storeCode || 'NH';

    // Xác định tọa độ khách hàng (từ GPS hoặc ước tính từ địa chỉ)
    let customerCoords: { lat: number; lng: number } | null = null;
    const rawLat = typeof latitude === 'number' ? latitude : (typeof lat === 'number' ? lat : null);
    const rawLng = typeof longitude === 'number' ? longitude : (typeof lng === 'number' ? lng : null);

    if (rawLat !== null && rawLng !== null) {
      customerCoords = { lat: rawLat, lng: rawLng };
    } else if (province || district || address) {
      customerCoords = estimateCoordinatesFromAddress(province, district, address);
    }

    // 1. Kiểm tra tồn khả dụng tại chi nhánh yêu cầu
    const availability = await getAvailability(targetStoreCode, items);

    // Tính khoảng cách chi nhánh hiện tại nếu có tọa độ
    let currentStoreDistanceKm: number | null = null;
    if (customerCoords) {
      const curStoreRes = await query(
        `SELECT latitude, longitude FROM stores WHERE code = $1 LIMIT 1;`,
        [targetStoreCode]
      );
      if (curStoreRes.rows.length > 0 && curStoreRes.rows[0].latitude && curStoreRes.rows[0].longitude) {
        currentStoreDistanceKm = calculateHaversineDistance(
          customerCoords.lat,
          customerCoords.lng,
          Number(curStoreRes.rows[0].latitude),
          Number(curStoreRes.rows[0].longitude)
        );
      }
    }

    // 2. Nếu thiếu hàng tại chi nhánh này, tìm các chi nhánh khác ĐỦ HÀNG cho cả giỏ
    const alternativeStores: Array<{
      code: string;
      name: string;
      address: string;
      phone?: string;
      distanceKm?: number;
    }> = [];

    if (!availability.isAvailable) {
      const storesRes = await query(
        `SELECT code, name, address, phone, latitude, longitude FROM stores WHERE is_active = true AND code != $1 ORDER BY code ASC;`,
        [targetStoreCode]
      );

      for (const store of storesRes.rows) {
        const checkOther = await getAvailability(store.code, items);
        if (checkOther.isAvailable) {
          let distKm: number | undefined = undefined;
          if (customerCoords && store.latitude && store.longitude) {
            distKm = calculateHaversineDistance(
              customerCoords.lat,
              customerCoords.lng,
              Number(store.latitude),
              Number(store.longitude)
            );
          }
          alternativeStores.push({
            code: store.code,
            name: store.name,
            address: store.address,
            phone: store.phone,
            distanceKm: distKm,
          });
        }
      }

      // Sắp xếp các chi nhánh thay thế theo khoảng cách gần nhất
      alternativeStores.sort((a, b) => {
        if (typeof a.distanceKm === 'number' && typeof b.distanceKm === 'number') {
          return a.distanceKm - b.distanceKm;
        }
        if (typeof a.distanceKm === 'number') return -1;
        if (typeof b.distanceKm === 'number') return 1;
        return 0;
      });
    }

    return NextResponse.json({
      success: true,
      storeCode: targetStoreCode,
      currentStoreDistanceKm,
      isAvailable: availability.isAvailable,
      insufficientItems: availability.insufficientItems,
      itemsDetail: availability.itemsDetail,
      alternativeStores,
    });
  } catch (error: any) {
    console.error('[Inventory Check API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi kiểm tra tồn kho' },
      { status: 500 }
    );
  }
}
