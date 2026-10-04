'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import { useLanguage } from '@/context/LanguageContext';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register } = useUserAuth();
  const { language } = useLanguage();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
  });

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

    if (!form.fullName.trim()) {
      setErrorMsg(language === 'en' ? 'Please enter your full name' : 'Vui lòng nhập họ và tên');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setErrorMsg(language === 'en' ? 'Please enter a valid email' : 'Vui lòng nhập email hợp lệ');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setErrorMsg(
        language === 'en'
          ? 'Password must be at least 6 characters'
          : 'Mật khẩu phải có ít nhất 6 ký tự'
      );
      return;
    }

    setIsSubmitting(true);
    const res = await register(form);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || (language === 'en' ? 'Registration failed' : 'Đăng ký không thành công'));
    } else {
      setSuccessMsg(
        language === 'en' ? 'Account created successfully!' : 'Tạo tài khoản thành công!'
      );
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
            {language === 'en' ? 'Create Customer Account' : 'Đăng Ký Tài Khoản'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'en'
              ? 'Save your address for faster checkout & track deliveries'
              : 'Lưu địa chỉ nhận hàng & theo dõi đơn hàng tiện lợi'}
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

        {/* Quick Social Registration */}
        <SocialAuthButtons returnUrl="/tai-khoan" className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Full Name' : 'Họ và tên'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder={language === 'en' ? 'Nguyen Van A' : 'Nguyễn Văn A'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:border-[#1B5E3B] focus:ring-2 focus:ring-[#1B5E3B]/10 transition-colors"
              />
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:border-[#1B5E3B] focus:ring-2 focus:ring-[#1B5E3B]/10 transition-colors"
              />
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Phone Number' : 'Số điện thoại'}
            </label>
            <div className="relative">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:border-[#1B5E3B] focus:ring-2 focus:ring-[#1B5E3B]/10 transition-colors"
              />
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Password' : 'Mật khẩu'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:border-[#1B5E3B] focus:ring-2 focus:ring-[#1B5E3B]/10 transition-colors"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 bg-[#1B5E3B] hover:bg-[#14482D] text-white font-bold rounded-xl shadow-xs text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{language === 'en' ? 'Creating account...' : 'Đang tạo tài khoản...'}</span>
              </>
            ) : (
              <span>{language === 'en' ? 'Register Account' : 'Đăng ký tài khoản'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
          <div>
            {language === 'en' ? 'Already have an account?' : 'Đã có tài khoản?'}{' '}
            <Link href="/dang-nhap" className="font-bold text-[#1B5E3B] hover:underline">
              {language === 'en' ? 'Sign in now' : 'Đăng nhập ngay'}
            </Link>
          </div>
          <div>
            <Link href="/" className="text-gray-400 hover:text-gray-600">
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
