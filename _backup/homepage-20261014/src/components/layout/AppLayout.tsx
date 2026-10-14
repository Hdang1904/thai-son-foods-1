'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ReferralTracker from '@/components/common/ReferralTracker';
import { FlyToCartProvider } from '@/context/FlyToCartContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { UserAuthProvider } from '@/context/UserAuthContext';
import AuthModal from '@/components/auth/AuthModal';
import BranchSelectorModal from '@/components/store/BranchSelectorModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <LanguageProvider>
      <UserAuthProvider>
        <FlyToCartProvider>
          <Suspense fallback={null}>
            <ReferralTracker />
          </Suspense>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="min-h-screen flex-1">{children}</main>
            <Footer />
            <AuthModal />
            <BranchSelectorModal />
          </div>
        </FlyToCartProvider>
      </UserAuthProvider>
    </LanguageProvider>
  );
}
