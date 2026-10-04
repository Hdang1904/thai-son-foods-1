/**
 * Format a number as Vietnamese currency
 * Example: 18000 → "18.000"
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN');
}

/**
 * Format price with unit
 * Example: 18000 → "18.000đ / 1 chai"
 */
export function formatPriceWithUnit(price: number, unit: string = 'lốc'): string {
  return `${formatPrice(price)}đ / ${unit}`;
}

/**
 * Generate a simple unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate discount percentage
 */
export function calcDiscount(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

/**
 * cn - simple class name merger (replaces clsx/twMerge for simplicity)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
