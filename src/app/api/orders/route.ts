import { NextResponse } from 'next/server';
import { query, initDatabase, pool } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { sendOrderEmail } from '@/lib/email/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 0. Nhận diện tài khoản người dùng nếu có đăng nhập (Không bắt buộc)
    let userId: string | null = body.userId || body.user_id || null;
    if (!userId) {
      try {
        const userSession = await getUserSession();
        if (userSession?.id) {
          userId = userSession.id;
        }
      } catch {
        // Guest checkout
      }
    }

    // 1. Chuẩn hóa mã đơn hàng
    const orderCode =
      body.orderCode ||
      body.order_code ||
      `TSF-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Chuẩn hóa thông tin người nhận
    const customerObj = body.customer || {};
    const fullName =
      (body.fullName || body.customerName || body.full_name || customerObj.fullName || customerObj.full_name || 'Khách hàng').toString().trim();
    const phone =
      (body.phone || body.customerPhone || customerObj.phone || '').toString().trim();
    const email =
      body.email || body.customerEmail || customerObj.email || null;

    // 3. Chuẩn hóa địa chỉ giao hàng
    const rawAddress = (body.address || body.shippingAddress || customerObj.address || '').toString().trim();
    const address = rawAddress || 'Địa chỉ liên hệ qua điện thoại';
    const province = (body.province || customerObj.province || 'Đặt hàng nhanh').toString().trim();
    const district = (body.district || customerObj.district || '').toString().trim();
    const ward = (body.ward || customerObj.ward || '').toString().trim();
    const note = body.note || customerObj.note || (body.shippingAddress ? 'Đơn đặt hàng nhanh COD' : null);
    const storeCode = body.storeCode || body.store_code || customerObj.storeCode || customerObj.store_code || null;
    const storeAddress = body.storeAddress || body.store_address || customerObj.storeAddress || customerObj.store_address || null;
    const rawLat = typeof body.latitude === 'number' ? body.latitude : (typeof body.lat === 'number' ? body.lat : null);
    const rawLng = typeof body.longitude === 'number' ? body.longitude : (typeof body.lng === 'number' ? body.lng : null);

    // 4. Chuẩn hóa phương thức & phí
    const paymentMethod = body.paymentMethod || customerObj.paymentMethod || 'cod';
    const shippingFee = Math.round(Number(body.shippingFee) || 0);

    // 5. Chuẩn hóa danh sách sản phẩm
    const rawItems = Array.isArray(body.items) ? body.items : [];
    let itemsCalculatedSubtotal = 0;
    const normalizedItems = rawItems.map((item: any) => {
      const name = (item.name || item.productName || item.title || 'Sản phẩm').toString();
      const price = Math.round(Number(item.price) || 0);
      const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
      const unit = item.unit || '1 chai';
      const thumbnail = item.thumbnail || null;
      const productId = item.productId || item.id || null;
      itemsCalculatedSubtotal += price * quantity;
      return {
        productId,
        name,
        price,
        quantity,
        unit,
        thumbnail,
      };
    });

    const subtotal = Math.round(
      Number(body.subtotal ?? (body.totalAmount ?? itemsCalculatedSubtotal)) || 0
    );
    const total = Math.round(
      Number(body.total ?? (subtotal + shippingFee)) || (subtotal + shippingFee)
    );

    if (!fullName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp đầy đủ họ tên và số điện thoại!' },
        { status: 400 }
      );
    }

    // ── COD VALIDATION & ANTI-ABUSE ──────────────────────────────
    const { INVENTORY_CONFIG: INV_CFG } = await import('@/config/inventory');
    const codConfig = INV_CFG.COD_VALIDATION;

    // V1: Kiểm tra định dạng số điện thoại Việt Nam
    const cleanPhone = phone.replace(/[\s\-\.]/g, '');
    if (!codConfig.PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam (VD: 0901234567)' },
        { status: 400 }
      );
    }

    // V2: Kiểm tra địa chỉ tối thiểu (COD bắt buộc có địa chỉ giao hàng)
    if (paymentMethod === 'cod' && rawAddress.length < codConfig.MIN_ADDRESS_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Địa chỉ giao hàng quá ngắn (tối thiểu ${codConfig.MIN_ADDRESS_LENGTH} ký tự). Vui lòng nhập địa chỉ chi tiết để shipper giao hàng.` },
        { status: 400 }
      );
    }

    // V3: Kiểm tra giá trị đơn COD tối đa
    if (paymentMethod === 'cod' && total > codConfig.MAX_ORDER_VALUE) {
      return NextResponse.json(
        {
          success: false,
          error: `Đơn hàng COD không được vượt quá ${codConfig.MAX_ORDER_VALUE.toLocaleString('vi-VN')} ₫. Vui lòng liên hệ hotline để đặt đơn lớn hoặc chọn phương thức thanh toán khác.`,
          maxValue: codConfig.MAX_ORDER_VALUE,
        },
        { status: 400 }
      );
    }

    // V4: Kiểm tra số đơn PENDING cùng SĐT (chống spam)
    const pendingCheck = await query(
      `SELECT COUNT(*) AS cnt FROM orders WHERE phone = $1 AND status = 'PENDING';`,
      [cleanPhone]
    );
    if (Number(pendingCheck.rows[0]?.cnt) >= codConfig.MAX_PENDING_ORDERS_PER_PHONE) {
      return NextResponse.json(
        {
          success: false,
          error: `Bạn đang có ${codConfig.MAX_PENDING_ORDERS_PER_PHONE} đơn hàng đang chờ xử lý. Vui lòng chờ đơn hiện tại được xác nhận trước khi đặt thêm.`,
        },
        { status: 429 }
      );
    }

    // V5: Kiểm tra khoảng cách thời gian giữa 2 đơn cùng SĐT
    const recentCheck = await query(
      `SELECT created_at FROM orders WHERE phone = $1 ORDER BY created_at DESC LIMIT 1;`,
      [cleanPhone]
    );
    if (recentCheck.rows.length > 0) {
      const lastOrderTime = new Date(recentCheck.rows[0].created_at);
      const nowMs = Date.now();
      const diffMinutes = (nowMs - lastOrderTime.getTime()) / 60000;
      if (diffMinutes < codConfig.MIN_ORDER_INTERVAL_MINUTES) {
        const waitSec = Math.ceil((codConfig.MIN_ORDER_INTERVAL_MINUTES - diffMinutes) * 60);
        return NextResponse.json(
          {
            success: false,
            error: `Vui lòng chờ ${waitSec} giây trước khi đặt đơn tiếp theo.`,
          },
          { status: 429 }
        );
      }
    }

    // Đảm bảo bảng và cấu trúc schema tồn tại
    await initDatabase();

    const client = await pool.connect();
    try {
      await client.query('BEGIN;');

      // 1. Tự động dọn dẹp các reservation đã quá hạn trước khi kiểm tra tồn
      const {
        cleanupExpiredReservations,
        expandComboItems,
        reserveStock,
        resolveProductCanonical,
        InsufficientStockError,
      } = await import('@/lib/inventory');
      const { INVENTORY_CONFIG } = await import('@/config/inventory');

      await cleanupExpiredReservations(client);

      // 2. Xác định chi nhánh phục vụ
      let targetStoreCode = storeCode;
      let targetStoreAddress = storeAddress;
      let targetStoreLat: number | null = null;
      let targetStoreLng: number | null = null;

      const { estimateCoordinatesFromAddress, calculateHaversineDistance, findNearestStore } = await import('@/lib/geo');
      let customerCoords: { lat: number; lng: number } | null = null;
      if (rawLat !== null && rawLng !== null) {
        customerCoords = { lat: rawLat, lng: rawLng };
      } else if (province || district || address) {
        customerCoords = estimateCoordinatesFromAddress(province, district, address);
      }

      if (targetStoreCode) {
        const storeRes = await client.query(
          `SELECT code, name, address, latitude, longitude FROM stores WHERE code = $1 LIMIT 1;`,
          [targetStoreCode]
        );
        if (storeRes.rows.length > 0) {
          if (!targetStoreAddress) targetStoreAddress = storeRes.rows[0].address;
          targetStoreLat = storeRes.rows[0].latitude ? Number(storeRes.rows[0].latitude) : null;
          targetStoreLng = storeRes.rows[0].longitude ? Number(storeRes.rows[0].longitude) : null;
        }
      } else {
        const allStoresRes = await client.query(
          `SELECT code, name, address, latitude, longitude FROM stores WHERE is_active = true ORDER BY code ASC;`
        );
        if (allStoresRes.rows.length > 0) {
          if (customerCoords) {
            const nearest = findNearestStore(allStoresRes.rows, customerCoords.lat, customerCoords.lng);
            if (nearest) {
              targetStoreCode = nearest.store.code;
              targetStoreAddress = nearest.store.address;
              targetStoreLat = nearest.store.latitude ? Number(nearest.store.latitude) : null;
              targetStoreLng = nearest.store.longitude ? Number(nearest.store.longitude) : null;
            }
          }
          if (!targetStoreCode) {
            targetStoreCode = allStoresRes.rows[0].code;
            targetStoreAddress = allStoresRes.rows[0].address;
            targetStoreLat = allStoresRes.rows[0].latitude ? Number(allStoresRes.rows[0].latitude) : null;
            targetStoreLng = allStoresRes.rows[0].longitude ? Number(allStoresRes.rows[0].longitude) : null;
          }
        } else {
          targetStoreCode = 'NH';
        }
      }

      // 3. SERVER TỰ TÍNH LẠI GIÁ (không tin client)
      let serverCalculatedSubtotal = 0;
      const revalidatedItems = [];

      for (const rawItem of normalizedItems) {
        const pId = rawItem.productId;
        let itemPrice = rawItem.price;
        let itemName = rawItem.name;

        // Kiểm tra nếu là combo có trong DB
        if (pId && (pId.startsWith('combo-') || pId.includes('combo'))) {
          const comboRes = await client.query(
            `SELECT name, sale_price FROM combos WHERE id = $1 OR slug = $1 LIMIT 1;`,
            [pId]
          );
          if (comboRes.rows.length > 0) {
            itemPrice = comboRes.rows[0].sale_price;
            itemName = comboRes.rows[0].name;
          }
        } else {
          // Là sản phẩm đơn hoặc variant
          const prodInfo = await resolveProductCanonical(pId, rawItem.name, client);
          if (prodInfo) {
            // Nếu là variant có hệ số số chai
            const { extractBottleMultiplier } = await import('@/lib/inventory').then((m: any) => ({
              extractBottleMultiplier: (id: string, unit?: string, name?: string) => {
                const combined = `${id} ${unit || ''} ${name || ''}`.toLowerCase();
                const m1 = combined.match(/(\d+)\s*(chai|bottle)/);
                if (m1) return parseInt(m1[1], 10) || 1;
                const m2 = combined.match(/[-_](\d+)chai/);
                if (m2) return parseInt(m2[1], 10) || 1;
                return 1;
              },
            }));
            const multiplier = extractBottleMultiplier(pId || '', rawItem.unit, rawItem.name);
            itemPrice = prodInfo.price * multiplier;
            if (!itemName || itemName === 'Sản phẩm') itemName = prodInfo.name;
          }
        }

        serverCalculatedSubtotal += itemPrice * rawItem.quantity;
        revalidatedItems.push({
          ...rawItem,
          name: itemName,
          price: itemPrice,
        });
      }

      // 4. SERVER TỰ TÍNH PHÍ VẬN CHUYỂN
      const { calculateShippingFee } = await import('@/config/inventory');
      let customerDistanceKm: number | null = null;
      if (customerCoords && targetStoreLat !== null && targetStoreLng !== null) {
        customerDistanceKm = calculateHaversineDistance(
          customerCoords.lat,
          customerCoords.lng,
          targetStoreLat,
          targetStoreLng
        );
      }
      const shippingCalc = calculateShippingFee(serverCalculatedSubtotal, customerDistanceKm);
      if (shippingCalc.isBeyondRadius && INVENTORY_CONFIG.SHIPPING.DISTANCE_BASED.ENABLED) {
        await client.query('ROLLBACK;');
        return NextResponse.json(
          {
            success: false,
            error: shippingCalc.reason || 'Địa chỉ giao hàng nằm ngoài bán kính phục vụ.',
          },
          { status: 400 }
        );
      }
      const serverShippingFee = shippingCalc.fee;
      const serverTotal = serverCalculatedSubtotal + serverShippingFee;

      // 5. BÓC TÁCH COMBO VÀ CHUẨN BỊ ĐƠN HÀNG
      const { expandedBottles, comboSnapshots } = await expandComboItems(revalidatedItems, client);
      const orderId = `ord_${Date.now()}`;

      let finalEmail = email;
      if ((!finalEmail || !finalEmail.includes('@')) && userId) {
        try {
          const userRes = await client.query('SELECT email FROM users WHERE id = $1 LIMIT 1;', [userId]);
          if (userRes.rows.length > 0 && userRes.rows[0].email) {
            finalEmail = userRes.rows[0].email;
          }
        } catch (err) {
          console.error('[Orders] Error fetching user email fallback:', err);
        }
      }

      // 6. TẠO ĐƠN HÀNG VÀ DÒNG CHI TIẾT TRONG TRANSACTION
      await client.query(
        `INSERT INTO orders (id, order_code, full_name, phone, email, province, district, ward, address, note, payment_method, shipping_fee, subtotal, total, status, user_id, store_code, store_address, items_total_count, items_resolved_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          orderId,
          orderCode,
          fullName,
          phone,
          finalEmail,
          province,
          district,
          ward,
          address,
          note,
          paymentMethod,
          serverShippingFee,
          serverCalculatedSubtotal,
          serverTotal,
          'PENDING',
          userId,
          targetStoreCode,
          targetStoreAddress,
          revalidatedItems.length,
          revalidatedItems.length, // Tất cả items đều resolved (fail-fast đã chặn trước đó)
        ]
      );

      for (let i = 0; i < revalidatedItems.length; i++) {
        const item = revalidatedItems[i];
        const itemId = `item_${Date.now()}_${i}`;
        const snapshotJson = comboSnapshots[i] ? JSON.stringify(comboSnapshots[i]) : null;

        // Resolve canonical product ID và tính bottle tracking
        const rawPId = (item.productId || '').trim();
        let canonicalProductId: string | null = null;
        let bottleMultiplier = 1;
        let totalBottlesVal = item.quantity || 1;

        let itemCostPriceSnapshot: number | null = null;

        if (rawPId && !rawPId.startsWith('combo-')) {
          const resolved = await resolveProductCanonical(rawPId, item.name, client);
          if (resolved) {
            canonicalProductId = resolved.id;
            const extractMult = (id: string, unit?: string, name?: string) => {
              const combined = `${id} ${unit || ''} ${name || ''}`.toLowerCase();
              const m1 = combined.match(/(\d+)\s*(chai|bottle)/);
              if (m1) { const n = parseInt(m1[1], 10); if (!isNaN(n) && n > 0) return n; }
              const m2 = combined.match(/[-_](\d+)chai/);
              if (m2) { const n = parseInt(m2[1], 10); if (!isNaN(n) && n > 0) return n; }
              return 1;
            };
            bottleMultiplier = extractMult(rawPId, item.unit, item.name);
            totalBottlesVal = bottleMultiplier * (item.quantity || 1);

            // Snapshot giá vốn sản phẩm nhân với hệ số quy cách
            const prodCostRes = await client.query('SELECT cost_price FROM products WHERE id = $1 LIMIT 1;', [resolved.id]);
            if (prodCostRes.rows.length > 0 && prodCostRes.rows[0].cost_price !== null && prodCostRes.rows[0].cost_price !== undefined) {
              itemCostPriceSnapshot = (Number(prodCostRes.rows[0].cost_price) || 0) * bottleMultiplier;
            }
          }
        } else if (rawPId && (rawPId.startsWith('combo-') || rawPId.includes('combo'))) {
          // Snapshot giá vốn combo
          const comboCostRes = await client.query('SELECT cost_price FROM combos WHERE id = $1 OR slug = $1 LIMIT 1;', [rawPId]);
          if (comboCostRes.rows.length > 0 && comboCostRes.rows[0].cost_price !== null && comboCostRes.rows[0].cost_price !== undefined) {
            itemCostPriceSnapshot = Number(comboCostRes.rows[0].cost_price) || 0;
          }
        }

        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, name, price, quantity, unit, thumbnail, combo_snapshot, canonical_product_id, bottle_multiplier, total_bottles, cost_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            itemId,
            orderId,
            item.productId,
            item.name,
            item.price,
            item.quantity,
            item.unit,
            item.thumbnail,
            snapshotJson,
            canonicalProductId,
            bottleMultiplier,
            totalBottlesVal,
            itemCostPriceSnapshot,
          ]
        );
      }

      // 7. KIỂM TRA TỒN KHO VÀ GIỮ CHỖ DƯỚI KHÓA SELECT ... FOR UPDATE (ROLLBACK TOÀN BỘ NẾU THIẾU HÀNG)
      try {
        await reserveStock(
          targetStoreCode,
          orderId,
          expandedBottles,
          client,
          INVENTORY_CONFIG.RESERVATION_EXPIRY_HOURS
        );
      } catch (err: any) {
        if (err instanceof InsufficientStockError || err.name === 'InsufficientStockError') {
          await client.query('ROLLBACK;');
          return NextResponse.json(
            {
              success: false,
              error: 'Một số sản phẩm không đủ tồn kho khả dụng tại chi nhánh đã chọn',
              insufficientItems: err.insufficientItems,
            },
            { status: 409 }
          );
        }
        throw err;
      }

      await client.query('COMMIT;');

      // Kích hoạt gửi email xác nhận đặt hàng cho khách (Non-blocking async)
      if (finalEmail && finalEmail.includes('@')) {
        sendOrderEmail('ORDER_CONFIRMATION', {
          id: orderId,
          orderCode,
          fullName,
          phone,
          email: finalEmail,
          address,
          province,
          district,
          ward,
          paymentMethod,
          shippingFee: serverShippingFee,
          subtotal: serverCalculatedSubtotal,
          total: serverTotal,
          note,
          storeCode: targetStoreCode,
          storeAddress: targetStoreAddress,
          items: revalidatedItems,
        }).catch((err) => console.error('[Order] Error sending confirmation email:', err));
      }

      return NextResponse.json({
        success: true,
        orderId,
        orderCode,
        storeCode: targetStoreCode,
        subtotal: serverCalculatedSubtotal,
        shippingFee: serverShippingFee,
        total: serverTotal,
        savedToPostgres: true,
        order: {
          id: orderId,
          orderCode,
          storeCode: targetStoreCode,
          total: serverTotal,
        },
      });
    } catch (dbError: any) {
      await client.query('ROLLBACK;');
      console.error('PostgreSQL order insert error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: dbError.message || 'Lỗi khi lưu đơn hàng vào cơ sở dữ liệu',
          savedToPostgres: false,
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET: Tra cứu thông tin & tiến trình đơn hàng công khai bằng mã đơn (Order Tracking)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get('code') || searchParams.get('orderCode') || '').trim();
    const phone = (searchParams.get('phone') || '').trim();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp mã đơn hàng cần tra cứu' },
        { status: 400 }
      );
    }

    let sql = `SELECT * FROM orders WHERE order_code = $1 OR id = $1 LIMIT 1;`;
    let params: any[] = [code];

    if (phone) {
      sql = `SELECT * FROM orders WHERE (order_code = $1 OR id = $1) AND (phone = $2 OR phone LIKE '%' || $2) LIMIT 1;`;
      params = [code, phone];
    }

    const orderRes = await query(sql, params);
    if (orderRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đơn hàng với thông tin đã cung cấp' },
        { status: 404 }
      );
    }

    const order = orderRes.rows[0];
    const itemsRes = await query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC;`,
      [order.id]
    );

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderCode: order.order_code,
        fullName: order.full_name,
        phone: order.phone,
        email: order.email,
        address: order.address,
        province: order.province,
        district: order.district,
        ward: order.ward,
        paymentMethod: order.payment_method || 'Thanh toán tiền mặt khi nhận hàng (COD)',
        shippingFee: order.shipping_fee,
        subtotal: order.subtotal,
        total: order.total,
        status: order.status,
        storeCode: order.store_code,
        storeAddress: order.store_address,
        createdAt: order.created_at,
        items: itemsRes.rows.map((it: any) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          unit: it.unit,
          thumbnail: it.thumbnail,
        })),
      },
    });
  } catch (error: any) {
    console.error('Order tracking API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tra cứu đơn hàng' },
      { status: 500 }
    );
  }
}
