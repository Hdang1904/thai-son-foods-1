'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'sale';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-green-primary text-white hover:bg-green-dark focus:ring-green-primary rounded-xl',
      secondary:
        'bg-corn text-text-dark hover:bg-corn-dark focus:ring-corn rounded-xl',
      outline:
        'border-2 border-green-primary text-green-primary hover:bg-green-primary hover:text-white focus:ring-green-primary rounded-xl',
      ghost:
        'text-text-body hover:bg-ivory-dark focus:ring-green-primary rounded-xl',
      sale:
        'bg-sale text-white hover:bg-sale-light focus:ring-sale rounded-xl',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
