'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export default function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  onChange,
  min = 1,
  max = 999,
  size = 'md',
  className,
}: QuantitySelectorProps) {
  const { language } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= min && val <= max && onChange) {
      onChange(val);
    }
  };

  const sizes = {
    sm: {
      button: 'w-7 h-7',
      input: 'w-10 h-7 text-sm',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      button: 'w-10 h-10',
      input: 'w-14 h-10 text-base',
      icon: 'w-4 h-4',
    },
  };

  const s = sizes[size];

  return (
    <div className={cn('flex items-center', className)}>
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= min}
        className={cn(
          s.button,
          'flex items-center justify-center rounded-l-lg border border-border bg-white text-text-body transition-colors',
          'hover:bg-ivory-dark hover:text-text-dark disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-label={language === 'en' ? 'Decrease quantity' : 'Giảm số lượng'}
      >
        <Minus className={s.icon} />
      </button>
      <input
        type="number"
        value={quantity}
        onChange={handleChange}
        min={min}
        max={max}
        className={cn(
          s.input,
          'text-center border-y border-border bg-white text-text-dark font-medium focus:outline-none focus:ring-1 focus:ring-green-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        )}
        aria-label={language === 'en' ? 'Quantity' : 'Số lượng'}
      />
      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= max}
        className={cn(
          s.button,
          'flex items-center justify-center rounded-r-lg border border-border bg-white text-text-body transition-colors',
          'hover:bg-ivory-dark hover:text-text-dark disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-label={language === 'en' ? 'Increase quantity' : 'Tăng số lượng'}
      >
        <Plus className={s.icon} />
      </button>
    </div>
  );
}
