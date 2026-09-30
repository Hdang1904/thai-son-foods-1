import { useState, useEffect } from 'react';
import { useBranchStore } from '@/store/branch';
import { products } from '@/data/products';

export function useBranchStockMap() {
  const { selectedBranch, openBranchModal } = useBranchStore();
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const storeCode = selectedBranch?.code || 'NH';

    // Gửi danh sách tất cả sản phẩm đang hoạt động để lấy tồn khả dụng tại chi nhánh
    const items = products
      .filter((p) => p.isActive)
      .map((p) => ({ productId: p.id, quantity: 9999 }));

    fetch('/api/inventory/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeCode, items }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.success && Array.isArray(data.itemsDetail)) {
          const map: Record<string, number> = {};
          for (const item of data.itemsDetail) {
            map[item.productId] = typeof item.available === 'number' ? item.available : 0;
          }
          setStockMap(map);
        }
      })
      .catch((err) => console.error('Error fetching branch stock map:', err))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedBranch?.code]);

  const getAvailable = (productId: string) => {
    // Nếu chưa load xong hoặc không có trong map thì trả về giá trị mặc định là an toàn
    return typeof stockMap[productId] === 'number' ? stockMap[productId] : 999;
  };

  return {
    selectedBranch,
    openBranchModal,
    stockMap,
    isLoading,
    getAvailable,
  };
}
