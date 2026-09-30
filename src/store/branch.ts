'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StoreBranch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  mapUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface BranchState {
  selectedBranch: StoreBranch | null;
  branches: StoreBranch[];
  isBranchModalOpen: boolean;
  isLoading: boolean;
  setSelectedBranch: (branch: StoreBranch) => void;
  openBranchModal: () => void;
  closeBranchModal: () => void;
  fetchBranches: () => Promise<void>;
  initDefaultBranch: () => Promise<void>;
}

// Chi nhánh mặc định (Cửa hàng Vườn Lài - Tân Phú) nếu người dùng chưa chọn
const DEFAULT_BRANCH: StoreBranch = {
  id: 'store_NH',
  code: 'NH',
  name: 'Cửa Hàng Vườn Lài (Tân Phú)',
  address: '298/4 Vườn Lài, P Phú Thọ Hòa, Quận Tân Phú, TP. HCM',
  phone: '0911812425',
  province: 'Hồ Chí Minh',
  district: 'Tân Phú',
  ward: 'Phú Thọ Hòa',
  latitude: 10.7882898,
  longitude: 106.6251124,
  mapUrl: 'https://maps.app.goo.gl/dPfkW2gVxy9k55TD7',
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      selectedBranch: DEFAULT_BRANCH,
      branches: [],
      isBranchModalOpen: false,
      isLoading: false,

      setSelectedBranch: (branch) => {
        set({ selectedBranch: branch });
      },

      openBranchModal: () => set({ isBranchModalOpen: true }),
      closeBranchModal: () => set({ isBranchModalOpen: false }),

      fetchBranches: async () => {
        try {
          set({ isLoading: true });
          const res = await fetch('/api/stores');
          const data = await res.json();
          if (data.success && Array.isArray(data.stores)) {
            set({ branches: data.stores });
            // Nếu chưa có chi nhánh hoặc chi nhánh không còn hợp lệ
            const current = get().selectedBranch;
            if (!current || !data.stores.some((s: StoreBranch) => s.code === current.code)) {
              const matched = data.stores.find((s: StoreBranch) => s.code === 'NH') || data.stores[0];
              if (matched) set({ selectedBranch: matched });
            }
          }
        } catch (err) {
          console.error('[BranchStore] Error fetching branches:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      initDefaultBranch: async () => {
        if (!get().selectedBranch) {
          set({ selectedBranch: DEFAULT_BRANCH });
        }
        if (get().branches.length === 0) {
          await get().fetchBranches();
        }
      },
    }),
    {
      name: 'tsf-selected-branch',
      partialize: (state) => ({ selectedBranch: state.selectedBranch }),
    }
  )
);
