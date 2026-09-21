'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  viewAllLink?: string;
  viewAllText?: string;
  className?: string;
}

export default function SectionTitle({
  title,
  viewAllLink,
  viewAllText = 'Xem tất cả',
  className,
}: SectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn('flex items-end justify-between mb-8 md:mb-10', className)}
    >
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-dark font-heading">
        {title}
      </h2>
      {viewAllLink && (
        <Link
          href={viewAllLink}
          className="group flex items-center gap-1.5 text-sm md:text-base font-medium text-green-primary hover:text-green-dark transition-colors whitespace-nowrap"
        >
          {viewAllText}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </motion.div>
  );
}
