// tests/phase0_test_g.mjs
// Test kiểm tra công thức maxCombos trong /api/inventory/check vs getAvailability

function currentApiFormula(items, availabilityItemsDetail) {
  // src/app/api/inventory/check/route.ts lines 106-115:
  const firstItemQuantity = Math.max(1, Number(items[0]?.quantity) || 1);
  const enrichedItemsDetail = availabilityItemsDetail.map((detail) => {
    const bottlesPerUnit = detail.requested > 0 ? detail.requested / firstItemQuantity : 1;
    const maxCombos = bottlesPerUnit > 0 ? Math.floor(detail.available / bottlesPerUnit) : 0;
    return {
      ...detail,
      bottlesPerUnit,
      maxCombos,
    };
  });

  const availableStock = enrichedItemsDetail.length > 0
    ? Math.max(0, Math.min(...enrichedItemsDetail.map((d) => d.maxCombos)))
    : null;

  return { firstItemQuantity, enrichedItemsDetail, availableStock };
}

function runTestG() {
  console.log('=== TEST PHASE 0 - g) Kiểm tra công thức maxCombos ===');

  // Case 1: Đơn hàng chỉ có 1 combo 4/3/3 (P1: 4, P2: 3, P3: 3) với quantity yêu cầu = 1
  // Tồn khả dụng kho: P1 = 16, P2 = 15, P3 = 9
  // Đúng về mặt nghiệp vụ:
  // P1: floor(16 / 4) = 4 combo
  // P2: floor(15 / 3) = 5 combo
  // P3: floor(9 / 3) = 3 combo
  // => Max combo có thể bán = min(4, 5, 3) = 3 combo (P3 là nút thắt).
  const singleComboItems = [{ id: 'combo-433', quantity: 1 }];
  const singleComboDetail = [
    { productId: 'P1', requested: 4, available: 16 },
    { productId: 'P2', requested: 3, available: 15 },
    { productId: 'P3', requested: 3, available: 9 },
  ];
  const resSingle = currentApiFormula(singleComboItems, singleComboDetail);
  console.log('\n--- Case 1: 1 combo định mức 4/3/3, req qty = 1 ---');
  console.log('Kết quả tính maxCombos từng chai:', resSingle.enrichedItemsDetail.map(d => ({ p: d.productId, perUnit: d.bottlesPerUnit, maxCombos: d.maxCombos })));
  console.log('Available Stock tổng hợp:', resSingle.availableStock, '(Kỳ vọng: 3)');

  // Case 2: Combo định mức 2/5/1 (P1: 2, P2: 5, P3: 1) với quantity yêu cầu = 1
  // Tồn khả dụng kho: P1 = 10, P2 = 20, P3 = 10
  // Kỳ vọng đúng:
  // P1: floor(10 / 2) = 5
  // P2: floor(20 / 5) = 4
  // P3: floor(10 / 1) = 10
  // => Max combo = min(5, 4, 10) = 4 combo (P2 là nút thắt).
  const combo2Detail = [
    { productId: 'P1', requested: 2, available: 10 },
    { productId: 'P2', requested: 5, available: 20 },
    { productId: 'P3', requested: 1, available: 10 },
  ];
  const resCombo2 = currentApiFormula([{ id: 'combo-251', quantity: 1 }], combo2Detail);
  console.log('\n--- Case 2: 1 combo định mức 2/5/1, req qty = 1 ---');
  console.log('Kết quả tính maxCombos từng chai:', resCombo2.enrichedItemsDetail.map(d => ({ p: d.productId, perUnit: d.bottlesPerUnit, maxCombos: d.maxCombos })));
  console.log('Available Stock tổng hợp:', resCombo2.availableStock, '(Kỳ vọng: 4)');

  // Case 3: LỖI NGHIÊM TRỌNG KHI GIỎ HÀNG CÓ NHIỀU MÓN HOẶC 2 COMBO
  // Giả sử giỏ hàng có:
  // - Item 0: Combo 4/3/3, số lượng đặt = 2 (firstItemQuantity = 2)
  // - Item 1: Combo 2/5/1, số lượng đặt = 1
  // Chai P2 xuất hiện ở cả 2 combo:
  // requested của P2 = (2 * 3) + (1 * 5) = 11 chai.
  // Khi đó code hiện tại:
  // bottlesPerUnit = detail.requested / firstItemQuantity = 11 / 2 = 5.5!
  // Chai P1: requested = (2 * 4) + (1 * 2) = 10 -> bottlesPerUnit = 10 / 2 = 5 (thay vì định mức thực tế).
  // Chai P3: requested = (2 * 3) + (1 * 1) = 7 -> bottlesPerUnit = 7 / 2 = 3.5.
  const multiItems = [
    { id: 'combo-433', quantity: 2 },
    { id: 'combo-251', quantity: 1 },
  ];
  const multiDetail = [
    { productId: 'P1', requested: 10, available: 20 },
    { productId: 'P2', requested: 11, available: 20 },
    { productId: 'P3', requested: 7, available: 20 },
  ];
  const resMulti = currentApiFormula(multiItems, multiDetail);
  console.log('\n--- Case 3: LỖI KHI CÓ NHIỀU SẢN PHẨM TRONG GIỎ HÀNG ---');
  console.log('firstItemQuantity lấy từ items[0]:', resMulti.firstItemQuantity);
  console.log('Kết quả sai lệch do chia cho firstItemQuantity:', resMulti.enrichedItemsDetail.map(d => ({
    p: d.productId,
    requested: d.requested,
    bottlesPerUnit_SAI: d.bottlesPerUnit,
    maxCombos_SAI: d.maxCombos
  })));
}

runTestG();
