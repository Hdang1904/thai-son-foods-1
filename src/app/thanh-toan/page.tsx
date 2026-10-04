'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  ArrowLeft,
  Banknote,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  User,
  Store,
  MapPin,
  RefreshCw,
  Search,
  Navigation,
  Compass,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useUserAuth } from '@/context/UserAuthContext';
import { products } from '@/data/products';
import { combos } from '@/data/combos';
import { useBranchStore } from '@/store/branch';
import { calculateShippingFee, INVENTORY_CONFIG } from '@/config/inventory';
import { calculateHaversineDistance, estimateCoordinatesFromAddress, findNearestStore } from '@/lib/geo';
import {
  getProvinceNames,
  getDistrictsByProvince,
  getWardsByDistrict,
  findPreciseCoordinates,
} from '@/data/vietnam-addresses';
import type { AutocompleteSuggestion } from '@/app/api/geo/autocomplete/route';

const MIN_ORDER_THRESHOLD = 120000;

export default function CheckoutPage() {
  const { language } = useLanguage();
  const { user, openAuthModal } = useUserAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { items, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const paymentMethod = 'cod';
  const [orderCode, setOrderCode] = useState('');
  const [completedOrder, setCompletedOrder] = useState<{
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    total: number;
    paymentMethod: string;
    storeAddress?: string;
  } | null>(null);

  // Chi nhánh phục vụ: MẶC ĐỊNH lấy từ chi nhánh đang chọn toàn site
  const { selectedBranch, setSelectedBranch } = useBranchStore();
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>(
    selectedBranch?.code || 'NH'
  );

  // Trạng thái kiểm tra tồn kho giỏ hàng tại chi nhánh
  const [isStockChecking, setIsStockChecking] = useState(false);
  const [isStockAvailable, setIsStockAvailable] = useState(true);
  const [insufficientItems, setInsufficientItems] = useState<any[]>([]);
  const [alternativeStores, setAlternativeStores] = useState<any[]>([]);
  const [suggestedCloserStore, setSuggestedCloserStore] = useState<{
    code: string;
    name: string;
    address: string;
    phone?: string;
    distanceKm: number;
  } | null>(null);
  const [stockConflictError, setStockConflictError] = useState<string | null>(null);

  // Tọa độ GPS khách hàng (hoặc ước tính từ địa chỉ) để tính khoảng cách & định tuyến kho
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Nạp danh sách stores và đồng bộ chi nhánh đang chọn
  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.stores)) {
          setStores(data.stores);
          if (selectedBranch?.code) {
            setSelectedStoreCode(selectedBranch.code);
          } else {
            setSelectedStoreCode(data.stores[0]?.code || 'NH');
          }
        }
      })
      .catch(console.error);
  }, [selectedBranch?.code]);

  const handleSelectStore = (storeCode: string) => {
    setSelectedStoreCode(storeCode);
    setSuggestedCloserStore(null);
    const matched = stores.find((s) => s.code === storeCode);
    if (matched) {
      setSelectedBranch(matched);
    }
  };

  const handleLocateGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert(language === 'en' ? 'Geolocation is not supported by your browser.' : 'Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCustomerCoords(coords);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert(
          language === 'en'
            ? 'Unable to retrieve your GPS location. Nearest branch will be estimated from your address.'
            : 'Không thể lấy vị trí GPS. Hệ thống sẽ ước tính kho gần nhất theo quận/huyện bạn nhập.'
        );
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    note: '',
  });

  // Danh mục tỉnh / thành phố hành chính Việt Nam
  const allProvinces = useMemo(() => getProvinceNames(), []);
  const availableDistricts = useMemo(() => getDistrictsByProvince(form.province), [form.province]);
  const availableWards = useMemo(() => getWardsByDistrict(form.province, form.district), [form.province, form.district]);

  // Trạng thái gợi ý địa chỉ Google Maps Places Autocomplete
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [geoResolvedDesc, setGeoResolvedDesc] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown gợi ý khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xử lý thay đổi Tỉnh / Thành phố
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceVal = e.target.value;
    setForm((prev) => ({
      ...prev,
      province: provinceVal,
      district: '',
      ward: '',
    }));
    if (errors.province) {
      setErrors((prev) => ({ ...prev, province: '' }));
    }
    const coords = findPreciseCoordinates(provinceVal);
    if (coords) {
      setCustomerCoords(coords);
    }
  };

  // Xử lý thay đổi Quận / Huyện
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtVal = e.target.value;
    setForm((prev) => ({
      ...prev,
      district: districtVal,
      ward: '',
    }));
    if (errors.district) {
      setErrors((prev) => ({ ...prev, district: '' }));
    }
    const coords = findPreciseCoordinates(form.province, districtVal);
    if (coords) {
      setCustomerCoords(coords);
    }
  };

  // Xử lý thay đổi Phường / Xã
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardVal = e.target.value;
    setForm((prev) => ({
      ...prev,
      ward: wardVal,
    }));
    if (errors.ward) {
      setErrors((prev) => ({ ...prev, ward: '' }));
    }
    const coords = findPreciseCoordinates(form.province, form.district, wardVal);
    if (coords) {
      setCustomerCoords(coords);
    }
  };

  // Xử lý nhập số nhà, tên đường
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, address: val }));
    if (errors.address) {
      setErrors((prev) => ({ ...prev, address: '' }));
    }
    // Xóa thông báo định vị cũ khi user gõ lại
    if (geoResolvedDesc) {
      setGeoResolvedDesc(null);
    }
  };

  // Tìm kiếm gợi ý Google Maps khi người dùng gõ số nhà / tên đường
  useEffect(() => {
    if (!form.address || form.address.trim().length < 2) {
      setSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        // Truyền province/district/ward context để API trả kết quả chính xác theo khu vực
        const params = new URLSearchParams({ input: form.address });
        if (form.province) params.set('province', form.province);
        if (form.district) params.set('district', form.district);
        if (form.ward) params.set('ward', form.ward);

        const res = await fetch(`/api/geo/autocomplete?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.predictions)) {
          setSuggestions(data.predictions);
          if (data.predictions.length > 0) {
            setShowSuggestions(true);
          }
        }
      } catch (err) {
        console.error('Error fetching address suggestions:', err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [form.address, form.ward, form.district, form.province]);

  // Geocode ngầm địa chỉ nếu người dùng chọn dropdown + gõ số nhà mà không click gợi ý
  useEffect(() => {
    if (form.address && form.district && form.province) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/geo/geocode?address=${encodeURIComponent(form.address)}&ward=${encodeURIComponent(
              form.ward
            )}&district=${encodeURIComponent(form.district)}&province=${encodeURIComponent(form.province)}`
          );
          const data = await res.json();
          if (data.success && data.lat && data.lng) {
            setCustomerCoords({ lat: data.lat, lng: data.lng });
          }
        } catch (e) {
          // ignore
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [form.address, form.ward, form.district, form.province]);

  // Chọn một địa chỉ từ gợi ý Google Maps / Nominatim
  const handleSelectSuggestion = async (suggestion: AutocompleteSuggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setIsSearchingAddress(true);
    try {
      // Nếu suggestion đã có tọa độ sẵn (Nominatim) -> dùng trực tiếp, không cần geocode lại
      if (suggestion.lat && suggestion.lng && suggestion.source === 'nominatim') {
        setCustomerCoords({ lat: suggestion.lat, lng: suggestion.lng });

        // Geocode để lấy thông tin hành chính chuẩn và street
        const res = await fetch(
          `/api/geo/geocode?place_id=${encodeURIComponent(suggestion.place_id)}&address=${encodeURIComponent(
            suggestion.description
          )}&province=${encodeURIComponent(form.province)}&district=${encodeURIComponent(form.district)}&ward=${encodeURIComponent(form.ward)}`
        );
        const data = await res.json();
        if (data.success && data.components) {
          setForm((prev) => ({
            ...prev,
            province: data.components.province || prev.province,
            district: data.components.district || prev.district,
            ward: data.components.ward || prev.ward,
            address: data.components.street || suggestion.main_text || prev.address,
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            address: suggestion.main_text || prev.address,
          }));
        }
        setGeoResolvedDesc(data?.formattedAddress || suggestion.description);
      } else {
        // Google Places hoặc Local -> cần geocode qua API
        const res = await fetch(
          `/api/geo/geocode?place_id=${encodeURIComponent(suggestion.place_id)}&address=${encodeURIComponent(
            suggestion.description
          )}&province=${encodeURIComponent(form.province)}&district=${encodeURIComponent(form.district)}&ward=${encodeURIComponent(form.ward)}`
        );
        const data = await res.json();
        if (data.success) {
          if (data.lat && data.lng) {
            setCustomerCoords({ lat: data.lat, lng: data.lng });
          }
          if (data.components) {
            setForm((prev) => ({
              ...prev,
              province: data.components.province || prev.province,
              district: data.components.district || prev.district,
              ward: data.components.ward || prev.ward,
              address: data.components.street || suggestion.main_text || prev.address,
            }));
          } else {
            setForm((prev) => ({
              ...prev,
              address: suggestion.main_text || prev.address,
            }));
          }
          setGeoResolvedDesc(data.formattedAddress || suggestion.description);
        }
      }

      setErrors((prev) => ({
        ...prev,
        province: '',
        district: '',
        ward: '',
        address: '',
      }));
    } catch (err) {
      console.error('Error geocoding selected suggestion:', err);
      // Nếu có tọa độ sẵn thì vẫn set dù geocode fail
      if (suggestion.lat && suggestion.lng) {
        setCustomerCoords({ lat: suggestion.lat, lng: suggestion.lng });
      }
      setForm((prev) => ({
        ...prev,
        address: suggestion.main_text || prev.address,
      }));
      setGeoResolvedDesc(suggestion.description);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Kiểm tra tồn kho toàn giỏ (đã bóc combo) mỗi khi đổi chi nhánh hoặc đổi giỏ hàng / tọa độ
  const checkCartStock = useCallback(
    async (storeCode: string) => {
      if (items.length === 0) return;
      setIsStockChecking(true);
      setStockConflictError(null);
      try {
        const res = await fetch('/api/inventory/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeCode,
            items,
            latitude: customerCoords?.lat,
            longitude: customerCoords?.lng,
            province: form.province,
            district: form.district,
            address: form.address,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsStockAvailable(data.isAvailable);
          setInsufficientItems(data.insufficientItems || []);
          setAlternativeStores(data.alternativeStores || []);
          setSuggestedCloserStore(data.suggestedCloserStore || null);
        }
      } catch (e) {
        console.error('Error checking cart stock:', e);
      } finally {
        setIsStockChecking(false);
      }
    },
    [items, customerCoords, form.province, form.district, form.address]
  );

  useEffect(() => {
    checkCartStock(selectedStoreCode);
  }, [selectedStoreCode, checkCartStock]);

  // Tự động điền thông tin nếu khách hàng đã đăng nhập
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        address: prev.address || user.address || '',
        province: prev.province || user.province || '',
        district: prev.district || user.district || '',
        ward: prev.ward || user.ward || '',
        note: prev.note || '',
      }));
    }
  }, [user]);

  const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);

  // Tính khoảng cách đến chi nhánh đang chọn
  const selectedStore = stores.find((s) => s.code === selectedStoreCode);
  let currentStoreDistanceKm: number | null = null;
  if (customerCoords && selectedStore?.latitude && selectedStore?.longitude) {
    currentStoreDistanceKm = calculateHaversineDistance(
      customerCoords.lat,
      customerCoords.lng,
      Number(selectedStore.latitude),
      Number(selectedStore.longitude)
    );
  }

  // Sắp xếp các chi nhánh theo khoảng cách tăng dần khi có tọa độ khách hàng
  const sortedStores = useMemo(() => {
    if (!customerCoords) return stores;
    return [...stores].sort((a, b) => {
      const distA =
        a.latitude && a.longitude
          ? calculateHaversineDistance(
              customerCoords.lat,
              customerCoords.lng,
              Number(a.latitude),
              Number(a.longitude)
            )
          : 99999;
      const distB =
        b.latitude && b.longitude
          ? calculateHaversineDistance(
              customerCoords.lat,
              customerCoords.lng,
              Number(b.latitude),
              Number(b.longitude)
            )
          : 99999;
      return distA - distB;
    });
  }, [stores, customerCoords]);

  // Tính phí vận chuyển theo config (hỗ trợ cả bậc khoảng cách km khi bật cấu hình)
  const shippingInfo = calculateShippingFee(subtotal, currentStoreDistanceKm);
  const shippingFee = shippingInfo.fee;
  const total = subtotal + shippingFee;

  // Kiểm tra nếu giỏ hàng có combo -> combo tính sau (được phép đặt dù dưới 120k)
  const hasCombo = items.some((i) => i.productId.includes('combo') || i.slug?.includes('combo'));
  const isEligibleToOrder = subtotal >= MIN_ORDER_THRESHOLD || hasCombo;
  const missingForMinOrder = Math.max(0, MIN_ORDER_THRESHOLD - subtotal);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) {
      newErrors.fullName = language === 'en' ? 'Please enter full name' : 'Vui lòng nhập họ tên';
    }
    if (!form.phone.trim()) {
      newErrors.phone = language === 'en' ? 'Please enter phone number' : 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = language === 'en' ? 'Invalid phone number' : 'Số điện thoại không hợp lệ';
    }
    if (!form.province.trim()) {
      newErrors.province = language === 'en' ? 'Please enter province/city' : 'Vui lòng nhập tỉnh/thành phố';
    }
    if (!form.district.trim()) {
      newErrors.district = language === 'en' ? 'Please enter district' : 'Vui lòng nhập quận/huyện';
    }
    if (!form.ward.trim()) {
      newErrors.ward = language === 'en' ? 'Please enter ward' : 'Vui lòng nhập phường/xã';
    }
    if (!form.address.trim()) {
      newErrors.address = language === 'en' ? 'Please enter street address' : 'Vui lòng nhập địa chỉ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligibleToOrder) {
      alert(
        language === 'en'
          ? 'Minimum order value is 120,000đ to proceed with ordering.'
          : 'Đơn hàng tối thiểu từ 120.000đ mới có thể tiến hành đặt hàng.'
      );
      return;
    }
    if (!validate()) return;

    // Chặn gửi đơn nếu chi nhánh thiếu hàng
    if (!isStockAvailable) {
      alert(
        language === 'en'
          ? 'The selected store does not have enough stock. Please choose an alternative store.'
          : 'Chi nhánh hiện tại không đủ tồn kho cho các món trong giỏ. Vui lòng đổi chi nhánh còn hàng bên dưới.'
      );
      return;
    }

    const generatedCode = `TSF-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderCode(generatedCode);

    setIsSubmitting(true);
    setStockConflictError(null);
    try {
      const targetStore = stores.find((s) => s.code === selectedStoreCode);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: generatedCode,
          userId: user?.id || null,
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          province: form.province,
          district: form.district,
          ward: form.ward,
          address: form.address,
          note: form.note,
          paymentMethod,
          shippingFee,
          subtotal,
          total,
          items,
          storeCode: selectedStoreCode,
          storeAddress: targetStore?.address || null,
          latitude: customerCoords?.lat || null,
          longitude: customerCoords?.lng || null,
        }),
      });

      // Bắt lỗi 409 Conflict: Có người vừa mua mất hàng
      if (res.status === 409) {
        let friendlyMsg = language === 'en'
          ? 'An item was just ordered by another customer. Your cart has been updated.'
          : 'Combo vừa có người đặt, hiện không còn đủ số lượng.';

        // Tự động kiểm tra lại tồn khả dụng cho từng món trong giỏ hàng và tự chỉnh số lượng
        for (const item of items) {
          try {
            const checkRes = await fetch('/api/inventory/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                storeCode: selectedStoreCode,
                items: [{ productId: item.productId, quantity: 1 }],
              }),
            });
            const checkData = await checkRes.json();
            if (checkData.success) {
              const remaining = typeof checkData.maxQuantity === 'number' ? checkData.maxQuantity : 0;
              if (item.quantity > remaining) {
                if (remaining > 0) {
                  useCartStore.getState().updateQuantity(item.productId, remaining);
                  friendlyMsg = language === 'en'
                    ? `Combo "${item.name}" was just purchased by another customer. Only ${remaining} left. Cart quantity adjusted.`
                    : `Combo "${item.name}" vừa có người đặt, hiện còn ${remaining}. Số lượng trong giỏ đã được tự động điều chỉnh.`;
                } else {
                  useCartStore.getState().updateQuantity(item.productId, 0);
                  useCartStore.getState().removeItem(item.productId);
                  friendlyMsg = language === 'en'
                    ? `Combo "${item.name}" was just purchased by another customer and is now out of stock at this store.`
                    : `Combo "${item.name}" vừa có người đặt và hiện đã hết hàng tại chi nhánh này.`;
                }
              }
            }
          } catch (err) {
            console.error('Error re-checking item after 409:', err);
          }
        }

        setStockConflictError(friendlyMsg);
        alert(friendlyMsg);
        checkCartStock(selectedStoreCode);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success || data.savedToPostgres === false) {
        alert(
          data.error ||
            data.message ||
            (language === 'en'
              ? 'An error occurred while saving your order. Please try again!'
              : 'Có lỗi xảy ra khi lưu đơn hàng vào hệ thống. Vui lòng thử lại!')
        );
        return;
      }

      setCompletedOrder({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || user?.email,
        address: `${form.address}, ${form.ward}, ${form.district}, ${form.province}`,
        total: total,
        paymentMethod:
          language === 'en'
            ? 'Cash on Delivery (COD)'
            : 'Thanh toán tiền mặt khi nhận hàng (COD)',
        storeAddress: targetStore?.address,
      });
      setIsSubmitted(true);
      clearCart();
    } catch (err) {
      console.error('Order sync error:', err);
      alert(
        language === 'en'
          ? 'Unable to connect to server. Please try again shortly!'
          : 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau ít phút!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && completedOrder) {
    return (
      <div className="section-container py-12 md:py-20">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-border-light text-center">
          <div className="w-20 h-20 bg-green-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-primary" />
          </div>
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-primary bg-green-primary/10 rounded-full mb-3">
            {language === 'en' ? `Order #${orderCode}` : `Đơn hàng #${orderCode}`}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-text-dark font-heading mb-3">
            {language === 'en' ? 'Order Placed Successfully!' : 'Đặt hàng thành công!'}
          </h1>
          <p className="text-text-muted text-sm md:text-base mb-8">
            {language === 'en' ? (
              <>
                Thank you for choosing <span className="font-semibold text-green-primary">Thai Son Foods</span>. Your order is being received and processed quickly.
              </>
            ) : (
              <>
                Cảm ơn bạn đã tin tưởng chọn <span className="font-semibold text-green-primary">Thái Sơn Foods</span>. Đơn hàng của bạn đang được tiếp nhận và xử lý nhanh chóng.
              </>
            )}
          </p>

          {/* Email Confirmation Notice Banner */}
          {completedOrder.email && (
            <div className="mb-6 p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-left text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 mb-0.5">
                  {language === 'en' ? 'Confirmation Email Sent!' : 'Đã gửi email xác nhận đến hộp thư!'}
                </p>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  {language === 'en'
                    ? `Order details & fresh beverage care guide have been sent to ${completedOrder.email}.`
                    : `Chi tiết từng món & cẩm nang bảo quản đồ uống tươi đã được gửi đến ${completedOrder.email}.`}
                </p>
              </div>
            </div>
          )}

          {/* Order Details Card */}
          <div className="bg-ivory/60 rounded-2xl p-5 text-left text-sm space-y-3 mb-8 border border-border-light">
            <div className="flex justify-between pb-2 border-b border-border-light">
              <span className="text-text-muted">{language === 'en' ? 'Recipient:' : 'Người nhận:'}</span>
              <span className="font-semibold text-text-dark">{completedOrder.fullName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-border-light">
              <span className="text-text-muted">{language === 'en' ? 'Phone:' : 'Số điện thoại:'}</span>
              <span className="font-semibold text-text-dark">{completedOrder.phone}</span>
            </div>
            {completedOrder.email && (
              <div className="flex justify-between pb-2 border-b border-border-light">
                <span className="text-text-muted">{language === 'en' ? 'Email:' : 'Email nhận tin:'}</span>
                <span className="font-semibold text-emerald-800 text-right">{completedOrder.email}</span>
              </div>
            )}
            <div className="flex justify-between pb-2 border-b border-border-light">
              <span className="text-text-muted">{language === 'en' ? 'Delivery Address:' : 'Địa chỉ giao:'}</span>
              <span className="font-semibold text-text-dark text-right max-w-[280px]">{completedOrder.address}</span>
            </div>
            {completedOrder.storeAddress && (
              <div className="flex justify-between pb-2 border-b border-border-light">
                <span className="text-text-muted">{language === 'en' ? 'Fulfillment Branch:' : 'Chi nhánh tiếp nhận:'}</span>
                <span className="font-semibold text-emerald-800 text-right max-w-[280px]">{completedOrder.storeAddress}</span>
              </div>
            )}
            <div className="flex justify-between pb-2 border-b border-border-light">
              <span className="text-text-muted">{language === 'en' ? 'Payment Method:' : 'Phương thức:'}</span>
              <span className="font-semibold text-green-primary">{completedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-1 text-base">
              <span className="font-bold text-text-dark">{language === 'en' ? 'Total Payment:' : 'Tổng thanh toán:'}</span>
              <span className="font-bold text-green-primary text-lg">{formatPrice(completedOrder.total)}đ</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors text-sm"
            >
              {language === 'en' ? 'Back to Home' : 'Về trang chủ'}
            </Link>
            <Link
              href="/#san-pham"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-border text-text-dark font-semibold rounded-xl hover:bg-ivory transition-colors text-sm"
            >
              {language === 'en' ? 'Shop More Drinks' : 'Mua thêm thức uống'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="section-container py-20 text-center">
        <div className="max-w-md mx-auto animate-pulse">
          <div className="w-16 h-16 bg-ivory-dark rounded-full mx-auto mb-4" />
          <div className="h-6 bg-ivory-dark rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-ivory-dark rounded w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section-container py-20 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-text-dark font-heading mb-2">
            {language === 'en' ? 'No items in cart' : 'Không có sản phẩm'}
          </h1>
          <p className="text-text-muted mb-8">
            {language === 'en'
              ? 'Please add products to your cart before checking out.'
              : 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.'}
          </p>
          <Link
            href="/#san-pham"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'en' ? 'Shop Now' : 'Mua sắm ngay'}
          </Link>
        </div>
      </div>
    );
  }

  // Chặn thanh toán nếu đơn hàng chưa đạt mức tối thiểu 120.000đ (ngoại trừ combo)
  if (!isEligibleToOrder) {
    return (
      <div className="section-container py-16 md:py-24 text-center">
        <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-text-dark font-heading mb-2">
            {language === 'en' ? 'Minimum Order Requirement Not Met' : 'Đơn hàng chưa đạt mức tối thiểu'}
          </h1>
          <p className="text-text-muted text-sm mb-3">
            {language === 'en' ? (
              <>
                Thai Son Foods applies a minimum order value of <strong>{formatPrice(MIN_ORDER_THRESHOLD)}đ</strong>.
              </>
            ) : (
              <>
                Thái Sơn Foods áp dụng mức đặt hàng tối thiểu từ <strong>{formatPrice(MIN_ORDER_THRESHOLD)}đ</strong>.
              </>
            )}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 mb-6 font-medium text-left space-y-1">
            <p>
              • {language === 'en' ? 'Current cart total:' : 'Giá trị giỏ hàng hiện tại:'}{' '}
              <strong className="text-text-dark">{formatPrice(subtotal)}đ</strong>
            </p>
            <p>
              • {language === 'en' ? 'Need to add at least:' : 'Cần chọn thêm ít nhất:'}{' '}
              <strong className="text-amber-900 font-bold">{formatPrice(missingForMinOrder)}đ</strong>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/#san-pham"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'en' ? 'Shop More Products' : 'Mua thêm sản phẩm'}
            </Link>
            <Link
              href="/gio-hang"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              {language === 'en' ? 'View Cart' : 'Xem lại giỏ hàng'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container pt-4 pb-8 md:pt-5 md:pb-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1.5 text-sm text-text-muted">
          <li>
            <Link href="/" className="hover:text-green-primary transition-colors">
              {language === 'en' ? 'Home' : 'Trang chủ'}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/gio-hang" className="hover:text-green-primary transition-colors">
              {language === 'en' ? 'Shopping Cart' : 'Giỏ hàng'}
            </Link>
          </li>
          <li>/</li>
          <li className="text-text-dark font-medium">
            {language === 'en' ? 'Checkout' : 'Thanh toán'}
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold text-text-dark font-heading mb-8">
        {language === 'en' ? 'Checkout' : 'Thanh toán'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Account Banner (Tùy chọn đăng nhập - KHÔNG bắt buộc) */}
            {user ? (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1B5E3B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {language === 'en' ? 'Ordering with account:' : 'Đang đặt hàng với tài khoản:'}{' '}
                    </span>
                    <span className="font-bold text-gray-900">{user.fullName}</span>{' '}
                    <span className="text-gray-400">({user.email})</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {language === 'en' ? '✓ Auto-filled address' : '✓ Đã tự động điền địa chỉ'}
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-gray-600">
                    <span className="font-bold text-gray-800">
                      {language === 'en' ? 'Already have an account?' : 'Bạn đã có tài khoản Thái Sơn Foods?'}
                    </span>{' '}
                    <span className="hidden sm:inline">
                      {language === 'en'
                        ? 'Sign in to autofill your shipping details & save orders (or continue as guest below).'
                        : 'Đăng nhập để tự động điền địa chỉ & lưu đơn hàng (hoặc tiếp tục mua hàng nhanh bên dưới).'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <a
                    href="/api/auth/google?returnUrl=/thanh-toan"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                    title="Đăng nhập nhanh với Google"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google</span>
                  </a>
                  <a
                    href="/api/auth/facebook?returnUrl=/thanh-toan"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                    title="Đăng nhập nhanh với Facebook"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="px-3 py-1.5 bg-[#1B5E3B] hover:bg-[#14482D] text-white font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer text-xs"
                  >
                    {language === 'en' ? 'Email' : 'Email'}
                  </button>
                </div>
              </div>
            )}

            <h2 className="text-lg font-bold text-text-dark">
              {language === 'en' ? 'Shipping Information' : 'Thông tin giao hàng'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-text-dark mb-1.5">
                  {language === 'en' ? 'Full Name' : 'Họ và tên'} <span className="text-sale">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                    errors.fullName ? 'border-sale' : 'border-border'
                  )}
                  placeholder={language === 'en' ? 'John Doe' : 'Nguyễn Văn A'}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-sale">{errors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-dark mb-1.5">
                  {language === 'en' ? 'Phone Number' : 'Số điện thoại'} <span className="text-sale">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                    errors.phone ? 'border-sale' : 'border-border'
                  )}
                  placeholder="0912 345 678"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-sale">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1.5 flex items-center justify-between">
                  <span>
                    Email{' '}
                    <span className="text-xs font-normal text-emerald-700">
                      {language === 'en' ? '(Receive order status updates)' : '(Nhận thông báo tình trạng đơn hàng)'}
                    </span>
                  </span>
                  {user?.email && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {language === 'en' ? 'Account email' : 'Email từ tài khoản'}
                    </span>
                  )}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-dark text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors"
                  placeholder={user?.email || 'email@example.com'}
                />
              </div>

              {/* Province */}
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-text-dark mb-1.5">
                  {language === 'en' ? 'Province / City' : 'Tỉnh / Thành phố'} <span className="text-sale">*</span>
                </label>
                <select
                  id="province"
                  name="province"
                  value={form.province}
                  onChange={handleProvinceChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors cursor-pointer',
                    errors.province ? 'border-sale' : 'border-border'
                  )}
                >
                  <option value="">{language === 'en' ? '-- Select Province / City --' : '-- Chọn Tỉnh / Thành phố --'}</option>
                  {allProvinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="mt-1 text-xs text-sale">{errors.province}</p>
                )}
              </div>

              {/* District */}
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-text-dark mb-1.5">
                  {language === 'en' ? 'District' : 'Quận / Huyện'} <span className="text-sale">*</span>
                </label>
                <select
                  id="district"
                  name="district"
                  value={form.district}
                  onChange={handleDistrictChange}
                  disabled={!form.province}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed',
                    errors.district ? 'border-sale' : 'border-border'
                  )}
                >
                  <option value="">
                    {!form.province
                      ? (language === 'en' ? '-- Select Province first --' : '-- Vui lòng chọn Tỉnh/Thành trước --')
                      : (language === 'en' ? '-- Select District --' : '-- Chọn Quận / Huyện --')}
                  </option>
                  {availableDistricts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="mt-1 text-xs text-sale">{errors.district}</p>
                )}
              </div>

              {/* Ward */}
              <div>
                <label htmlFor="ward" className="block text-sm font-medium text-text-dark mb-1.5">
                  {language === 'en' ? 'Ward' : 'Phường / Xã'} <span className="text-sale">*</span>
                </label>
                <select
                  id="ward"
                  name="ward"
                  value={form.ward}
                  onChange={handleWardChange}
                  disabled={!form.district}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed',
                    errors.ward ? 'border-sale' : 'border-border'
                  )}
                >
                  <option value="">
                    {!form.district
                      ? (language === 'en' ? '-- Select District first --' : '-- Vui lòng chọn Quận/Huyện trước --')
                      : (language === 'en' ? '-- Select Ward --' : '-- Chọn Phường / Xã --')}
                  </option>
                  {availableWards.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.ward && (
                  <p className="mt-1 text-xs text-sale">{errors.ward}</p>
                )}
              </div>

              {/* Address */}
              <div className="sm:col-span-2 relative" ref={suggestionsRef}>
                <label htmlFor="address" className="block text-sm font-medium text-text-dark mb-1.5 flex items-center justify-between">
                  <span>
                    {language === 'en' ? 'House number & street name' : 'Số nhà, tên đường'}{' '}
                    <span className="text-sale">*</span>
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {language === 'en' ? 'Google Maps Autocomplete' : 'Gợi ý chuẩn Google Maps'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="address"
                    name="address"
                    type="text"
                    autoComplete="off"
                    value={form.address}
                    onChange={handleAddressInputChange}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className={cn(
                      'w-full pl-4 pr-10 py-3 rounded-xl border bg-white text-text-dark text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                      errors.address ? 'border-sale' : 'border-border'
                    )}
                    placeholder={
                      language === 'en'
                        ? 'Ex: 27 Van Chung or 123 Pho Quang...'
                        : 'Ví dụ: 27 Văn Chung hoặc 123 Phổ Quang...'
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 pointer-events-none">
                    {isSearchingAddress ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </div>
                </div>
                {errors.address && (
                  <p className="mt-1 text-xs text-sale">{errors.address}</p>
                )}

                {/* Dropdown Gợi ý từ Google Maps / OpenStreetMap */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-2 bg-emerald-50/70 flex items-center justify-between text-[11px] font-semibold text-emerald-900 border-b border-emerald-100">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {language === 'en' ? 'Address Suggestions' : 'Gợi ý địa điểm chính xác'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-normal">
                        {language === 'en' ? 'Click to auto-fill & locate nearest store' : 'Nhấp để tự điền & tìm kho gần nhất'}
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      {suggestions.map((item, idx) => (
                        <button
                          key={item.place_id}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/60 transition-colors flex items-start gap-2.5 cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-200 transition-colors">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 truncate">
                                {item.main_text}
                              </p>
                              <span className={cn(
                                'text-[9px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0',
                                item.source === 'google'
                                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                                  : item.source === 'nominatim'
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : 'text-gray-600 bg-gray-50 border-gray-200'
                              )}>
                                {item.source === 'google' ? 'Google' : item.source === 'nominatim' ? 'OSM' : 'Local'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate leading-snug">
                              {item.secondary_text || item.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thông báo định vị thành công */}
                {geoResolvedDesc && (
                  <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start gap-2 text-xs text-emerald-900">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-emerald-900 mb-0.5">
                        {language === 'en' ? 'Location resolved' : 'Đã xác định vị trí'}
                      </p>
                      <p className="text-[11px] text-emerald-800 truncate leading-snug">
                        {geoResolvedDesc}
                      </p>
                      {customerCoords && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          GPS: {customerCoords.lat.toFixed(6)}, {customerCoords.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="sm:col-span-2">
                <label htmlFor="note" className="block text-sm font-medium text-text-dark mb-1.5">
                  {language === 'en' ? 'Order Note' : 'Ghi chú'}
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-dark text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors resize-none"
                  placeholder={language === 'en' ? 'Optional order notes or delivery instructions...' : 'Ghi chú thêm cho đơn hàng...'}
                />
              </div>
            </div>

            {/* LỰA CHỌN CỬA HÀNG GẦN NHẤT ĐỂ ĐẶT HÀNG */}
            {stores.length > 0 && (
              <div className="pt-4 border-t border-border-light">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-600" />
                    <span>
                      {language === 'en'
                        ? 'Select Nearest Store for Fulfillment'
                        : 'Chọn chi nhánh cửa hàng gần nhất để đặt hàng'}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={handleLocateGPS}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {isLocating
                        ? (language === 'en' ? 'Locating...' : 'Đang định vị...')
                        : customerCoords
                        ? (language === 'en' ? 'GPS Active' : 'Đã định vị')
                        : (language === 'en' ? 'Find nearest branch' : 'Định vị tìm kho gần nhất')}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-text-muted mb-3.5">
                  {language === 'en'
                    ? 'Your order will be prepared and confirmed directly by this store.'
                    : 'Đơn hàng sẽ được nhân viên cửa hàng chi nhánh này tiếp nhận và xác nhận xuất kho.'}
                </p>

                {/* Gợi ý chi nhánh gần hơn & còn đủ hàng (nếu có) */}
                {suggestedCloserStore && suggestedCloserStore.code !== selectedStoreCode && (
                  <div className="mb-3.5 p-3.5 bg-blue-50/95 rounded-2xl border border-blue-200 flex items-center justify-between gap-3 flex-wrap text-xs text-blue-950 animate-in fade-in duration-200 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-700">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-900">
                          {language === 'en'
                            ? 'Closer branch available with full stock:'
                            : 'Phát hiện chi nhánh gần bạn hơn & còn đủ hàng:'}
                        </p>
                        <p className="text-blue-800 text-[11px] mt-0.5">
                          <strong className="text-blue-950">{suggestedCloserStore.name}</strong>
                          {typeof suggestedCloserStore.distanceKm === 'number' && (
                            <span className="font-semibold text-blue-700 ml-1">
                              (~ {suggestedCloserStore.distanceKm} km)
                            </span>
                          )}{' '}
                          - {suggestedCloserStore.address}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectStore(suggestedCloserStore.code)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
                    >
                      {language === 'en' ? 'Switch to this branch' : 'Đổi sang chi nhánh này'}
                    </button>
                  </div>
                )}

                {customerCoords && selectedStore && (
                  <div className="mb-3.5 p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2 flex-wrap text-xs text-emerald-950 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {language === 'en' ? 'Selected fulfillment store:' : 'Chi nhánh bạn đang chọn phục vụ:'}{' '}
                        <strong className="text-emerald-900">{selectedStore.name}</strong>
                        {currentStoreDistanceKm !== null && (
                          <span className="font-semibold text-emerald-700 ml-1">
                            (~ {currentStoreDistanceKm} km)
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                      {language === 'en' ? 'Selected' : 'Đang chọn'}
                    </span>
                  </div>
                )}

                {/* Lưới danh sách cửa hàng: 1 cột trên mobile, 2 cột trên tablet, 3 cột trên desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {sortedStores.map((st) => {
                    const isChosen = selectedStoreCode === st.code;
                    const distanceVal =
                      customerCoords && st.latitude && st.longitude
                        ? calculateHaversineDistance(
                            customerCoords.lat,
                            customerCoords.lng,
                            Number(st.latitude),
                            Number(st.longitude)
                          )
                        : null;

                    return (
                      <label
                        key={st.code}
                        onClick={() => handleSelectStore(st.code)}
                        className={cn(
                          'flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border-2 cursor-pointer transition-all relative h-full text-left',
                          isChosen
                            ? (!isStockAvailable
                                ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400 shadow-2xs'
                                : 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500/20 shadow-2xs')
                            : 'border-border bg-white hover:border-emerald-300 hover:bg-gray-50/60'
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <input
                                type="radio"
                                name="storeCodeSelection"
                                checked={isChosen}
                                onChange={() => handleSelectStore(st.code)}
                                className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
                              />
                              <span className="font-bold text-gray-900 text-xs sm:text-[13px] leading-snug line-clamp-1">
                                {st.name}
                              </span>
                            </div>
                            {isChosen && (
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
                                  !isStockAvailable ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                                )}
                              >
                                {!isStockAvailable
                                  ? (language === 'en' ? 'Shortage' : 'Thiếu hàng')
                                  : (language === 'en' ? 'Selected' : 'Đang chọn')}
                              </span>
                            )}
                          </div>

                          <p className="text-gray-500 text-[11px] leading-snug line-clamp-2 pl-5" title={st.address}>
                            {st.address}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-2 mt-2 border-t border-gray-100 pl-5 text-[10px] sm:text-[11px]">
                          {distanceVal !== null ? (
                            <span className="text-emerald-800 font-semibold bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                              ~ {distanceVal} km
                            </span>
                          ) : (
                            <span className="text-gray-400 truncate">
                              {st.district || st.province || 'Hệ thống TSF'}
                            </span>
                          )}
                          <span className="text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                            {st.phone}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Cảnh báo thiếu hàng cho chi nhánh đang chọn (hiển thị toàn chiều rộng bên dưới lưới) */}
                {!isStockAvailable && selectedStore && (
                  <div className="mt-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-bold text-red-900">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{selectedStore.name} hiện không đủ hàng cho các món trong giỏ:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      {insufficientItems.map((it) => (
                        <li key={it.productId}>
                          <strong>{it.productName}</strong>: cần {it.requested}, kho chỉ còn{' '}
                          <span className="text-red-700 font-bold">{it.available}</span> chai
                        </li>
                      ))}
                    </ul>

                    {alternativeStores.length > 0 ? (
                      <div className="pt-2 border-t border-red-200/60">
                        <span className="font-semibold text-emerald-950 block mb-1.5 text-xs">
                          Gợi ý các chi nhánh ĐỦ HÀNG cho cả giỏ:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {alternativeStores.map((alt) => (
                            <div
                              key={alt.code}
                              className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs gap-2"
                            >
                              <div className="truncate min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-emerald-900 block text-xs truncate">{alt.name}</span>
                                  {typeof alt.distanceKm === 'number' && (
                                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                                      ~ {alt.distanceKm} km
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-500 text-[10px] truncate block mt-0.5">{alt.address}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectStore(alt.code)}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
                              >
                                Đổi sang kho này
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-red-700 italic">
                        Hiện không có chi nhánh nào khác đủ toàn bộ số lượng này. Quý khách vui lòng giảm bớt số lượng hoặc liên hệ hotline để được hỗ trợ.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method - Tiền mặt khi nhận hàng (COD) */}
            <div className="pt-4 border-t border-border-light">
              <h2 className="text-lg font-bold text-text-dark mb-3">
                {language === 'en' ? 'Payment Method' : 'Phương thức thanh toán'}
              </h2>
              <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/40 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-sm text-text-dark">
                    {language === 'en' ? 'Cash on Delivery (COD)' : 'Thanh toán tiền mặt khi nhận hàng (COD)'}
                  </span>
                  <span className="block text-xs text-text-muted mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'Inspect fresh beverages upon arrival and pay cash directly to the courier.'
                      : 'Quý khách kiểm tra đồ uống tươi khi giao đến và thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-border-light sticky top-[100px]">
              <h2 className="text-lg font-bold text-text-dark mb-5">
                {language === 'en' ? 'Order Summary' : 'Tóm tắt đơn hàng'}
              </h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => {
                  const productMatch = products.find((p) => p.id === item.productId || p.slug === item.slug);
                  const comboMatch = combos.find((c) => c.id === item.productId || c.slug === item.slug);
                  const itemName = language === 'en'
                    ? (productMatch?.nameEn || comboMatch?.nameEn || item.name)
                    : item.name;

                  return (
                    <div key={item.productId} className="flex gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-ivory-dark shrink-0">
                        <Image
                          src={item.thumbnail}
                          alt={itemName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-dark leading-snug">
                          {itemName}
                        </p>
                        <p className="text-xs text-text-muted">
                          x{item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-text-dark whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}đ
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border-light pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-body">{language === 'en' ? 'Subtotal' : 'Tạm tính'}</span>
                  <span className="font-medium">{formatPrice(subtotal)}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-body">{language === 'en' ? 'Shipping Fee' : 'Phí vận chuyển'}</span>
                  <span className="font-medium">
                    {shippingFee === 0 ? (
                      <span className="text-green-primary">
                        {language === 'en' ? 'Free' : 'Miễn phí'}
                      </span>
                    ) : (
                      `${formatPrice(shippingFee)}đ`
                    )}
                  </span>
                </div>
                <div className="border-t border-border-light pt-3 flex justify-between">
                  <span className="font-bold text-text-dark text-base">
                    {language === 'en' ? 'Total' : 'Tổng cộng'}
                  </span>
                  <span className="font-bold text-green-primary text-xl">
                    {formatPrice(total)}đ
                  </span>
                </div>
              </div>

              {/* Trạng thái kiểm tra tồn kho & Cảnh báo */}
              {isStockChecking ? (
                <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Đang kiểm tra tồn kho tại chi nhánh...</span>
                </div>
              ) : !isStockAvailable ? (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Chi nhánh hiện chưa đủ số lượng</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Chúng tôi đang nỗ lực điều phối để bổ sung sớm nhất. Quý khách vui lòng chọn chi nhánh khác còn hàng ở danh sách bên trái hoặc giảm số lượng để tiếp tục đặt hàng.
                  </p>
                  {alternativeStores.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectStore(alternativeStores[0].code)}
                      className="w-full mt-1 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                    >
                      Đổi sang {alternativeStores[0].name.slice(0, 20)}... (Đủ hàng)
                    </button>
                  )}
                </div>
              ) : null}

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !isStockAvailable || isStockChecking}
                className={cn(
                  "mt-5 w-full py-3.5 px-3 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2",
                  isStockAvailable && !isStockChecking
                    ? "bg-green-primary hover:bg-green-dark active:scale-[0.98] cursor-pointer shadow-md hover:shadow-lg"
                    : "bg-amber-50/90 text-amber-950 cursor-not-allowed border border-amber-300 shadow-none opacity-90"
                )}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{language === 'en' ? 'Processing order...' : 'Đang xử lý đơn hàng...'}</span>
                  </>
                ) : !isStockAvailable ? (
                  <div className="flex flex-col items-center leading-tight gap-0.5">
                    <span className="font-bold text-amber-950 text-sm">
                      {language === 'en' ? 'Branch currently out of stock' : 'Chi nhánh tạm chưa đủ hàng'}
                    </span>
                    <span className="text-[11px] text-amber-800 font-normal">
                      {language === 'en'
                        ? 'We are restocking • Please switch branch'
                        : 'Đang nỗ lực điều phối • Vui lòng đổi chi nhánh'}
                    </span>
                  </div>
                ) : (
                  language === 'en' ? 'Place Order' : 'Đặt hàng'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

