'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import { useLanguage } from '@/context/LanguageContext';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useUserAuth();
  const { language } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/tai-khoan');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg(language === 'en' ? 'Please enter your email' : 'Vui lòng nhập địa chỉ email');
      return;
    }
    if (!password) {
      setErrorMsg(language === 'en' ? 'Please enter your password' : 'Vui lòng nhập mật khẩu');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || (language === 'en' ? 'Login failed' : 'Đăng nhập không thành công'));
    } else {
      setSuccessMsg(language === 'en' ? 'Logged in successfully!' : 'Đăng nhập thành công!');
      setTimeout(() => {
        router.push('/tai-khoan');
      }, 500);
    }
  };

  return (
    <div className="section-container py-12 md:py-16">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block relative w-36 h-12 mb-3">
            <Image
              src="/images/logo-vien-trang.png"
              alt="Thái Sơn Foods"
              fill
              className="object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">
            {language === 'en' ? 'Customer Sign In' : 'Đăng Nhập Tài Khoản'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'en'
              ? 'Access your orders and account settings'
              : 'Theo dõi đơn hàng & quản lý thông tin mua sắm'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Social Login */}
        <SocialAuthButtons returnUrl="/tai-khoan" className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:border-[#1B5E3B] focus:ring-2 focus:ring-[#1B5E3B]/10 transition-colors"
              />
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {language === 'en' ? 'Password' : 'Mật khẩu'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:border-[#1B5E3B] focus:ring-2 focus:ring-[#1B5E3B]/10 transition-colors"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 -mr-2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#1B5E3B] hover:bg-[#14482D] text-white font-bold rounded-xl shadow-xs text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{language === 'en' ? 'Signing in...' : 'Đang đăng nhập...'}</span>
              </>
            ) : (
              <span>{language === 'en' ? 'Sign In' : 'Đăng nhập'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
          <div>
            {language === 'en' ? "Don't have an account yet?" : 'Chưa có tài khoản Thái Sơn Foods?'}{' '}
            <Link href="/dang-ky" className="font-bold text-[#1B5E3B] hover:underline py-2 -my-2 inline-block">
              {language === 'en' ? 'Register now' : 'Đăng ký ngay'}
            </Link>
          </div>
          <div>
            <Link href="/" className="text-gray-400 hover:text-gray-600 py-2 -my-2 inline-block">
              ← {language === 'en' ? 'Back to Home' : 'Quay về trang chủ'}
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-500 bg-gray-50/80 p-3 rounded-xl">
          <ShoppingBag className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-800">
              {language === 'en' ? 'Guest Checkout Available' : 'Mua sắm không bắt buộc đăng nhập'}:
            </span>{' '}
            {language === 'en'
              ? 'You can always buy products and checkout directly without registering an account.'
              : 'Bạn luôn có thể đặt hàng nhanh chóng trực tiếp tại giỏ hàng mà không cần tài khoản.'}
          </div>
        </div>
      </div>
    </div>
  );
}
