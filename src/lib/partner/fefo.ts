import { PoolClient } from 'pg';
import { query } from '@/lib/db';

export interface LotAllocationResult {
  lotId: string;
  lotCode: string;
  manufacturingDate: string;
  expiryDate: string;
  allocatedQuantity: number;
  remainingAvailable: number;
}

export interface FEFOAllocationReport {
  success: boolean;
  productId: string;
  requestedQuantity: number;
  totalAllocated: number;
  allocations: LotAllocationResult[];
  error?: string;
}

/**
 * Thuật toán phân bổ tồn kho FEFO (First Expired, First Out)
 * Ưu tiên xuất các lô hàng có hạn sử dụng (expiry_date) gần nhất trước.
 * Tuyệt đối không xuất lô hàng đã hết hạn (expiry_date < CURRENT_DATE).
 */
export async function allocateLotsFEFO(
  storeCode: string,
  productId: string,
  requiredQuantity: number,
  dbClient?: PoolClient
): Promise<FEFOAllocationReport> {
  const runner = dbClient ? dbClient : { query };

  // 1. Khóa và lấy danh sách các lô hàng còn hạn sử dụng, sắp xếp hạn gần nhất lên trước
  const lockSql = dbClient ? 'FOR UPDATE' : '';
  const lotsRes = await runner.query(
    `SELECT id, lot_code, manufacturing_date, expiry_date, stock_quantity, reserved_quantity,
            (stock_quantity - reserved_quantity) AS available_quantity
     FROM inventory_lots
     WHERE store_code = $1 
       AND product_id = $2
       AND expiry_date >= CURRENT_DATE
       AND (stock_quantity - reserved_quantity) > 0
     ORDER BY expiry_date ASC, manufacturing_date ASC
     ${lockSql};`,
    [storeCode, productId]
  );

  let remainingNeeded = requiredQuantity;
  const allocations: LotAllocationResult[] = [];

  for (const lot of lotsRes.rows) {
    if (remainingNeeded <= 0) break;

    const available = Number(lot.available_quantity) || 0;
    const toTake = Math.min(available, remainingNeeded);

    allocations.push({
      lotId: lot.id,
      lotCode: lot.lot_code,
      manufacturingDate: lot.manufacturing_date,
      expiryDate: lot.expiry_date,
      allocatedQuantity: toTake,
      remainingAvailable: available - toTake,
    });

    // Cập nhật giữ chỗ trên lô
    await runner.query(
      `UPDATE inventory_lots
       SET reserved_quantity = reserved_quantity + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2;`,
      [toTake, lot.id]
    );

    remainingNeeded -= toTake;
  }

  const totalAllocated = requiredQuantity - remainingNeeded;

  if (remainingNeeded > 0) {
    return {
      success: false,
      productId,
      requestedQuantity: requiredQuantity,
      totalAllocated,
      allocations,
      error: `Không đủ tồn kho khả dụng còn hạn (FEFO). Yêu cầu: ${requiredQuantity}, khả dụng: ${totalAllocated}.`,
    };
  }

  return {
    success: true,
    productId,
    requestedQuantity: requiredQuantity,
    totalAllocated,
    allocations,
  };
}

/**
 * Thêm hoặc nhập mới một lô hàng date ngắn
 */
export async function createOrUpdateInventoryLot(params: {
  storeCode: string;
  productId: string;
  lotCode: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
}): Promise<{ id: string; lotCode: string }> {
  const lotId = `lot_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const res = await query(
    `INSERT INTO inventory_lots (
      id, store_code, product_id, lot_code, manufacturing_date, expiry_date, stock_quantity, reserved_quantity
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
    ON CONFLICT (store_code, product_id, lot_code)
    DO UPDATE SET 
      stock_quantity = inventory_lots.stock_quantity + EXCLUDED.stock_quantity,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, lot_code;`,
    [
      lotId,
      params.storeCode,
      params.productId,
      params.lotCode,
      params.manufacturingDate,
      params.expiryDate,
      params.quantity,
    ]
  );

  return res.rows[0];
}
