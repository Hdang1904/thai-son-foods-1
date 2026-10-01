'use client';

import React from 'react';
import { MapPin, ChevronDown, Sparkles } from 'lucide-react';
import { useBranchStore } from '@/store/branch';

export default function BranchTopBar() {
  const { selectedBranch, openBranchModal } = useBranchStore();

  return (
    <div className="bg-[#11241C] text-gray-200 text-xs py-1.5 px-3 md:px-4 border-b border-emerald-950/40 relative z-40 transition-colors">
      <div className="section-container flex items-center justify-between gap-2">
        {/* Phần hiển thị chi nhánh đang chọn */}
        <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-gray-300 hidden sm:inline shrink-0">Đang xem hàng tại:</span>
          <button
            onClick={openBranchModal}
            className="flex items-center gap-1 text-white font-bold hover:text-emerald-300 transition-colors cursor-pointer truncate group"
            title="Bấm để đổi chi nhánh nhận hàng"
          >
            <span className="truncate max-w-[200px] sm:max-w-[320px] md:max-w-[420px]">
              {selectedBranch?.name || 'Chi nhánh 1 (Tân Phú)'}
            </span>
            <span className="text-emerald-400 group-hover:text-emerald-300 text-[11px] font-semibold underline shrink-0 ml-1">
              Đổi
            </span>
            <ChevronDown className="w-3 h-3 text-emerald-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Cam kết giao nhanh hoặc hotline */}
        <div className="hidden md:flex items-center gap-3 text-gray-300 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-300">
            <Sparkles className="w-3 h-3" />
            <span>Giao nhanh từ chi nhánh gần nhất</span>
          </span>
          <span className="text-gray-500">•</span>
          <span>Hotline hỗ trợ: <strong className="text-white font-semibold">028 6291 5024</strong></span>
        </div>
      </div>
    </div>
  );
}
