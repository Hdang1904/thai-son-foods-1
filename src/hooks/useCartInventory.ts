'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useBranchStore } from '@/store/branch';

export interface InsufficientItem {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

export interface AlternativeStore {
  code: string;
  name: string;
  address: string;
  phone?: string;
}

export function useCartInventory() {
  const items = useCartStore((s) => s.items);
  const selectedBranch = useBranchStore((s) => s.selectedBranch);
  const setSelectedBranch = useBranchStore((s) => s.setSelectedBranch);
  const openBranchModal = useBranchStore((s) => s.openBranchModal);

  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [insufficientItems, setInsufficientItems] = useState<InsufficientItem[]>([]);
  const [alternativeStores, setAlternativeStores] = useState<AlternativeStore[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      setIsAvailable(true);
      setInsufficientItems([]);
      setAlternativeStores([]);
      return;
    }

    let isMounted = true;
    setIsChecking(true);

    fetch('/api/inventory/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeCode: selectedBranch?.code || 'NH',
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setIsAvailable(data.isAvailable);
          setInsufficientItems(data.insufficientItems || []);
          setAlternativeStores(data.alternativeStores || []);
        }
      })
      .catch((err) => {
        console.error('[useCartInventory] Error checking inventory:', err);
      })
      .finally(() => {
        if (isMounted) setIsChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [items, selectedBranch?.code]);

  return {
    isChecking,
    isAvailable,
    insufficientItems,
    alternativeStores,
    selectedBranch,
    setSelectedBranch,
    openBranchModal,
  };
}
