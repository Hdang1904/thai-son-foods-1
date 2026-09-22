'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  BarChart3,
  Database,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  XCircle,
  Printer,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  Sparkles,
  TrendingUp,
  DollarSign,
  Boxes,
  Users,
  Menu,
  FileSpreadsheet,
  Layers,
  ChevronDown
} from 'lucide-react';

// ==================== INTERFACES ====================
interface Category {
  id: string;
  slug: string;
  name: string;
  product_count?: number;
  created_at?: string;
}

interface ProductVariant {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  unit: string;
  thumbnail: string;
  category_id: string | null;
  category_name?: string;
  category_slug?: string;
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  variants?: ProductVariant[];
  created_at?: string;
}

interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  thumbnail: string | null;
}

interface Order {
  id: string;
  order_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  province: string;
  district: string;
  ward: string;
  address: string;
  note: string | null;
  payment_method: string;
  shipping_fee: number;
  subtotal: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  item_count?: number;
  items?: OrderItem[];
  created_at: string;
}

interface StatsData {
  summary: {
    total_orders: string | number;
    total_revenue: string | number;
    completed_orders: string | number;
    pending_orders: string | number;
    processing_orders: string | number;
    shipping_orders: string | number;
    cancelled_orders: string | number;
  };
  products: {
    total_products: string | number;
    active_products: string | number;
    featured_products: string | number;
    best_seller_products: string | number;
  };
  categories: {
    total_categories: string | number;
  };
  statusBreakdown: { status: string; count: string | number; total_amount: string | number }[];
  recentOrders: Order[];
  topProducts: any[];
  revenueTrend: { date_label: string; order_count: number; daily_revenue: number }[];
  dbStatus: { connected: boolean; database: string; timestamp: string };
}

export default function AdminPage() {
  // Navigation tabs: 'overview' | 'products' | 'orders' | 'categories' | 'analytics' | 'database'
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'categories' | 'analytics' | 'database'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<StatsData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters & Search
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('ALL');
  const [prodStatusFilter, setProdStatusFilter] = useState('ALL');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productFormVariants, setProductFormVariants] = useState<ProductVariant[]>([]);

  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id?: string; name: string; slug: string } | null>(null);

  // Show Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Format currency
  const formatVND = (num: number | string | undefined) => {
    if (!num) return '0 ₫';
    return Number(num).toLocaleString('vi-VN') + ' ₫';
  };

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, prodsRes, catsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/products', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/categories', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/orders', { cache: 'no-store' }).then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes);
      if (prodsRes.success) setProducts(prodsRes.data || []);
      if (catsRes.success) setCategories(catsRes.data || []);
      if (ordersRes.success) setOrders(ordersRes.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      showToast('Lỗi kết nối cơ sở dữ liệu: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick seed demo orders
  const handleSeedDemoOrders = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Đã tạo dữ liệu đơn hàng mẫu thành công!');
        fetchData();
      } else {
        showToast(data.error || 'Không thể tạo đơn mẫu', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== PRODUCT CRUD ====================
  const handleOpenCreateProduct = () => {
    setEditingProduct({
      name: '',
      sku: 'TSF-' + Math.floor(100 + Math.random() * 900),
      category_id: categories.length > 0 ? categories[0].id : '',
      price: 18000,
      unit: '1 chai',
      thumbnail: '/images/products/sua-bap-nep.png',
      short_description: '',
      description: '',
      is_featured: false,
      is_new: true,
      is_best_seller: false,
      is_active: true,
    });
    setProductFormVariants([
      { name: '1 chai', quantity: 1, price: 18000, unit: 'chai' },
      { name: 'Lốc 6 chai', quantity: 6, price: 108000, unit: 'lốc' },
    ]);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setProductFormVariants(prod.variants && prod.variants.length > 0 ? [...prod.variants] : []);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) {
      showToast('Vui lòng nhập tên và giá sản phẩm', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const isUpdating = Boolean(editingProduct.id);
      const url = '/api/admin/products';
      const method = isUpdating ? 'PUT' : 'POST';

      const payload = {
        ...editingProduct,
        variants: productFormVariants,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast(isUpdating ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm mới thành công!');
        setIsProductModalOpen(false);
        fetchData();
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleProductActive = async (prod: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prod.id, is_active: !prod.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã ${!prod.is_active ? 'kích hoạt' : 'ẩn'} sản phẩm "${prod.name}"`);
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, is_active: !prod.is_active } : p))
        );
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa sản phẩm "${name}"`);
        fetchData();
      } else {
        showToast(data.error || 'Không thể xóa sản phẩm', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== ORDER ACTIONS ====================
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã cập nhật trạng thái đơn thành ${statusMap[newStatus]?.label}`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        // Refresh stats
        fetch('/api/admin/stats').then((r) => r.json()).then((d) => d.success && setStats(d));
      } else {
        showToast(data.error || 'Cập nhật thất bại', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa đơn hàng #${code}? Hành động này không thể hoàn tác.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa đơn hàng #${code}`);
        if (selectedOrder?.id === id) setIsOrderDetailModalOpen(false);
        fetchData();
      } else {
        showToast(data.error || 'Không thể xóa đơn hàng', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailModalOpen(true);
    // Fetch full order details
    try {
      const res = await fetch(`/api/admin/orders?id=${order.id}`).then((r) => r.json());
      if (res.success && res.order) {
        setSelectedOrder(res.order);
      }
    } catch (err) {
      console.error('Error fetching order items:', err);
    }
  };

  // ==================== CATEGORY CRUD ====================
  const handleOpenCreateCategory = () => {
    setEditingCategory({ name: '', slug: '' });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory({ id: cat.id, name: cat.name, slug: cat.slug });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const isUpdating = Boolean(editingCategory.id);
      const url = '/api/admin/categories';
      const method = isUpdating ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory),
      });
      const data = await res.json();

      if (data.success) {
        showToast(isUpdating ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục mới thành công!');
        setIsCategoryModalOpen(false);
        fetchData();
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Xóa danh mục "${name}"? Các sản phẩm thuộc danh mục này sẽ chuyển về chưa phân loại.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa danh mục "${name}"`);
        fetchData();
      } else {
        showToast(data.error || 'Không thể xóa', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== CSV EXPORT ====================
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) {
      showToast('Chưa có đơn hàng nào để xuất', 'info');
      return;
    }
    const headers = ['Mã Đơn', 'Khách Hàng', 'Điện Thoại', 'Tỉnh/TP', 'Địa Chỉ', 'Tổng Tiền', 'Trạng Thái', 'Ngày Đặt'];
    const rows = orders.map((o) => [
      o.order_code,
      `"${o.full_name}"`,
      `"${o.phone}"`,
      `"${o.province}"`,
      `"${o.address}"`,
      o.total,
      o.status,
      new Date(o.created_at).toLocaleDateString('vi-VN'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Don_Hang_Thai_Son_Foods_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  // ==================== FILTER LOGIC ====================
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(prodSearch.toLowerCase()));
      const matchCat = prodCatFilter === 'ALL' || p.category_id === prodCatFilter;
      const matchStatus =
        prodStatusFilter === 'ALL' ||
        (prodStatusFilter === 'ACTIVE' && p.is_active) ||
        (prodStatusFilter === 'INACTIVE' && !p.is_active) ||
        (prodStatusFilter === 'FEATURED' && p.is_featured) ||
        (prodStatusFilter === 'BEST_SELLER' && p.is_best_seller);
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, prodSearch, prodCatFilter, prodStatusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.order_code.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.full_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.phone.includes(orderSearch);
      const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Status mapping colors & labels
  const statusMap: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    PENDING: { label: 'Chờ xử lý', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', text: 'text-amber-400', icon: Clock },
    CONFIRMED: { label: 'Đã xác nhận', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', text: 'text-blue-400', icon: CheckCircle2 },
    PROCESSING: { label: 'Đang chuẩn bị', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', text: 'text-purple-400', icon: Boxes },
    SHIPPING: { label: 'Đang giao hàng', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', text: 'text-cyan-400', icon: Truck },
    COMPLETED: { label: 'Hoàn thành', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
    CANCELLED: { label: 'Đã hủy', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', text: 'text-rose-400', icon: XCircle },
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#0b1120] text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* ==================== TOAST NOTIFICATION ==================== */}
      {toast && (
        <div className="fixed top-5 right-5 z-[1000] animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/90 border-blue-500/40 text-blue-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5 text-blue-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ==================== TOP NAVIGATION BAR ==================== */}
      <header className="h-16 bg-[#0f172a]/95 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 lg:hidden rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <span className="font-extrabold text-white text-base tracking-tighter">TSF</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight group-hover:text-emerald-400 transition-colors">
                  Thái Sơn Foods
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Admin Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hệ thống quản trị & Cơ sở dữ liệu WebTSF</p>
            </div>
          </Link>
        </div>

        {/* Center: DB Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-medium">PostgreSQL:</span>
          <span className="text-emerald-400 font-semibold font-mono">WebTSF</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 text-[11px]">Port 5432 (127.0.0.1)</span>
        </div>

        {/* Right action tools */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSeedDemoOrders}
            disabled={actionLoading}
            title="Tạo đơn hàng mẫu để kiểm tra tính năng biểu đồ & danh sách đơn"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nạp Đơn Mẫu</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            title="Làm mới dữ liệu từ Database WebTSF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 transition-all"
          >
            <span>Xem Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ==================== MAIN WORKSPACE ==================== */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-16 left-0 z-40 w-64 bg-[#0d1527] border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Nav links */}
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Quản Trị
              </p>
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Tổng quan</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('products');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'products'
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4" />
                  <span>Sản phẩm</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('orders');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'orders'
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Đơn hàng</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('categories');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'categories'
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FolderTree className="w-4 h-4" />
                  <span>Danh mục</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {categories.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4" />
                  <span>Báo cáo & Phân tích</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('database');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'database'
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4" />
                  <span>Cơ sở dữ liệu</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </button>
            </div>

            {/* Quick Summary Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Doanh thu tuần này</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-extrabold text-emerald-400 tracking-tight">
                {formatVND(stats?.summary?.total_revenue || 0)}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[78%]"></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>{stats?.summary?.total_orders || 0} đơn đã tạo</span>
                <span className="text-emerald-400 font-medium">94% thành công</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-sm">
                TS
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">Admin Quản Lý</p>
                <p className="text-[11px] text-slate-400 truncate">admin@thaisonfoods.vn</p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-[#0b1120] p-4 lg:p-6 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Page header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <span>Tổng Quan Bán Hàng</span>
                    <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Thời gian thực
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Dữ liệu được cập nhật trực tiếp từ PostgreSQL cơ sở dữ liệu WebTSF
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportOrdersCSV}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Xuất Báo Cáo CSV</span>
                  </button>
                  <button
                    onClick={handleOpenCreateProduct}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Sản Phẩm</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign className="w-16 h-16 text-emerald-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Tổng Doanh Thu</span>
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white mt-2 tracking-tight">
                    {formatVND(stats?.summary?.total_revenue || 0)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã ghi nhận trong WebTSF</span>
                  </div>
                </div>

                {/* Total Orders */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 relative overflow-hidden group hover:border-blue-500/40 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShoppingCart className="w-16 h-16 text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Tổng Đơn Hàng</span>
                    <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <ShoppingCart className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white mt-2 tracking-tight">
                    {stats?.summary?.total_orders || orders.length || 0}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                    <span className="text-amber-400 font-semibold">{stats?.summary?.pending_orders || 0} chờ duyệt</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{stats?.summary?.completed_orders || 0} hoàn tất</span>
                  </div>
                </div>

                {/* Products Count */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Package className="w-16 h-16 text-purple-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Sản Phẩm Đang Bán</span>
                    <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Package className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white mt-2 tracking-tight">
                    {products.length}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                    <span className="text-purple-400 font-semibold">{categories.length} danh mục</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{products.filter((p) => p.is_active).length} kích hoạt</span>
                  </div>
                </div>

                {/* DB Health */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 relative overflow-hidden group hover:border-teal-500/40 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Database className="w-16 h-16 text-teal-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Cơ Sở Dữ Liệu</span>
                    <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                      <Database className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-2 tracking-tight flex items-center gap-2">
                    <span>Kết Nối Tốt</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                    <span className="text-slate-300 font-mono">WebTSF @ localhost</span>
                  </div>
                </div>
              </div>

              {/* Chart & Top Products Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7 Days Revenue Trend (Visual SVG Bar Chart) */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <span>Biểu Đồ Doanh Thu 7 Ngày Gần Nhất</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Xu hướng đặt hàng thực tế trong tuần</p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                      7 ngày qua
                    </span>
                  </div>

                  {/* SVG interactive visual chart */}
                  <div className="pt-4 pb-2">
                    <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
                      {(stats?.revenueTrend || [
                        { date_label: '15/09', daily_revenue: 120000, order_count: 2 },
                        { date_label: '16/09', daily_revenue: 250000, order_count: 3 },
                        { date_label: '17/09', daily_revenue: 180000, order_count: 2 },
                        { date_label: '18/09', daily_revenue: 340000, order_count: 4 },
                        { date_label: '19/09', daily_revenue: 210000, order_count: 3 },
                        { date_label: '20/09', daily_revenue: 430000, order_count: 5 },
                        { date_label: '21/09', daily_revenue: 320000, order_count: 4 },
                      ]).map((item, idx) => {
                        const maxRev = Math.max(
                          ...(stats?.revenueTrend?.map((r) => Number(r.daily_revenue)) || [500000]),
                          100000
                        );
                        const heightPct = Math.max(
                          Math.round((Number(item.daily_revenue || 0) / maxRev) * 100),
                          12
                        );

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Tooltip on hover */}
                            <div className="absolute -top-12 bg-slate-950 text-white text-[10px] py-1 px-2 rounded-md shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                              <p className="font-bold text-emerald-400">{formatVND(item.daily_revenue)}</p>
                              <p className="text-slate-400">{item.order_count} đơn hàng</p>
                            </div>

                            {/* Bar element */}
                            <div className="w-full max-w-[48px] bg-slate-800/80 rounded-t-xl overflow-hidden flex flex-col justify-end p-1 h-36">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300"
                              ></div>
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
                              {item.date_label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Sản Phẩm Bán Chạy</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Top sản phẩm được ưa chuộng</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    {(stats?.topProducts && stats.topProducts.length > 0
                      ? stats.topProducts
                      : products.slice(0, 5)
                    ).map((p: any, idx: number) => (
                      <div
                        key={p.id || idx}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 relative shrink-0">
                          {p.thumbnail ? (
                            <Image
                              src={p.thumbnail}
                              alt={p.name}
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{p.name}</p>
                          <p className="text-[11px] text-emerald-400 font-semibold">{formatVND(p.price)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            #{idx + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                      <span>Đơn Hàng Mới Nhất</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Danh sách các đơn đặt hàng mới cập nhật</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>Xem tất cả đơn hàng ({orders.length})</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Mã Đơn</th>
                        <th className="py-3 px-4">Khách Hàng</th>
                        <th className="py-3 px-4">Số Điện Thoại</th>
                        <th className="py-3 px-4">Tổng Tiền</th>
                        <th className="py-3 px-4">Trạng Thái</th>
                        <th className="py-3 px-4">Thời Gian</th>
                        <th className="py-3 px-4 text-right">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {orders.slice(0, 6).map((order) => {
                        const st = statusMap[order.status] || statusMap['PENDING'];
                        return (
                          <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                              #{order.order_code}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-100">{order.full_name}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono">{order.phone}</td>
                            <td className="py-3 px-4 font-bold text-white">{formatVND(order.total)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${st.bg}`}
                              >
                                <st.icon className="w-3 h-3" />
                                <span>{st.label}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(order.created_at).toLocaleDateString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenOrderDetail(order)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                              >
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            Chưa có đơn hàng nào trong cơ sở dữ liệu. Hãy bấm "Nạp Đơn Mẫu" ở trên góc phải để thử nghiệm!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PRODUCT MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Quản Lý Sản Phẩm</span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                      {products.length} món
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Thêm mới, sửa thông tin giá, biến thể và trạng thái hiển thị trên website
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateProduct}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Sản Phẩm Mới</span>
                </button>
              </div>

              {/* Filters toolbar */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={prodCatFilter}
                  onChange={(e) => setProdCatFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Tất cả danh mục ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={prodStatusFilter}
                  onChange={(e) => setProdStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang kích hoạt</option>
                  <option value="INACTIVE">Đang ẩn</option>
                  <option value="FEATURED">Nổi bật ⭐</option>
                  <option value="BEST_SELLER">Bán chạy 🔥</option>
                </select>
              </div>

              {/* Products Table */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Ảnh & Sản Phẩm</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Danh Mục</th>
                        <th className="py-3 px-4">Giá Bán</th>
                        <th className="py-3 px-4">Huy Hiệu</th>
                        <th className="py-3 px-4">Trạng Thái</th>
                        <th className="py-3 px-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-800 relative shrink-0 border border-slate-700">
                                {p.thumbnail ? (
                                  <Image
                                    src={p.thumbnail}
                                    alt={p.name}
                                    fill
                                    className="object-contain p-1"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-100 text-sm">{p.name}</p>
                                <p className="text-[11px] text-slate-400">Đơn vị: {p.unit}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{p.sku || '—'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {p.category_name || 'Chưa phân loại'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-400 text-sm">
                            {formatVND(p.price)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {p.is_featured && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ⭐ Nổi bật
                                </span>
                              )}
                              {p.is_best_seller && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  🔥 Bán chạy
                                </span>
                              )}
                              {p.is_new && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  🆕 Mới
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleProductActive(p)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                p.is_active
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {p.is_active ? '● Đang Bán' : '○ Tạm Ẩn'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                title="Chỉnh sửa sản phẩm"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                title="Xóa sản phẩm"
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            Không tìm thấy sản phẩm nào khớp với điều kiện lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: ORDER MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Quản Lý Đơn Hàng</span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                      {orders.length} đơn
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Theo dõi tiến độ giao nhận, xử lý trạng thái và in hóa đơn đơn hàng
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportOrdersCSV}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Xuất File Excel/CSV</span>
                  </button>
                </div>
              </div>

              {/* Status Tab Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
                {[
                  { key: 'ALL', label: 'Tất cả đơn', count: orders.length },
                  { key: 'PENDING', label: 'Chờ xử lý', count: orders.filter((o) => o.status === 'PENDING').length },
                  { key: 'CONFIRMED', label: 'Đã xác nhận', count: orders.filter((o) => o.status === 'CONFIRMED').length },
                  { key: 'SHIPPING', label: 'Đang giao', count: orders.filter((o) => o.status === 'SHIPPING').length },
                  { key: 'COMPLETED', label: 'Hoàn thành', count: orders.filter((o) => o.status === 'COMPLETED').length },
                  { key: 'CANCELLED', label: 'Đã hủy', count: orders.filter((o) => o.status === 'CANCELLED').length },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setOrderStatusFilter(t.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      orderStatusFilter === t.key
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã đơn (#TSF...), Tên khách hàng, Số điện thoại..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Mã Đơn</th>
                        <th className="py-3 px-4">Khách Hàng</th>
                        <th className="py-3 px-4">Khu Vực Giao</th>
                        <th className="py-3 px-4">Số Tiền</th>
                        <th className="py-3 px-4">Hình Thức</th>
                        <th className="py-3 px-4">Trạng Thái</th>
                        <th className="py-3 px-4">Thời Gian Đặt</th>
                        <th className="py-3 px-4 text-right">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredOrders.map((order) => {
                        const st = statusMap[order.status] || statusMap['PENDING'];
                        return (
                          <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                              #{order.order_code}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-100">{order.full_name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{order.phone}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-slate-200 text-xs truncate max-w-[180px]">{order.address}</p>
                              <p className="text-[11px] text-slate-400">{order.province}</p>
                            </td>
                            <td className="py-3 px-4 font-bold text-white text-sm">
                              {formatVND(order.total)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                                {order.payment_method}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {/* Quick status dropdown */}
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(order.id, e.target.value as Order['status'])
                                }
                                className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer ${st.bg}`}
                              >
                                <option value="PENDING" className="bg-slate-900 text-amber-400">Chờ xử lý</option>
                                <option value="CONFIRMED" className="bg-slate-900 text-blue-400">Đã xác nhận</option>
                                <option value="PROCESSING" className="bg-slate-900 text-purple-400">Đang chuẩn bị</option>
                                <option value="SHIPPING" className="bg-slate-900 text-cyan-400">Đang giao hàng</option>
                                <option value="COMPLETED" className="bg-slate-900 text-emerald-400">Hoàn thành</option>
                                <option value="CANCELLED" className="bg-slate-900 text-rose-400">Đã hủy</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(order.created_at).toLocaleDateString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenOrderDetail(order)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                                >
                                  Chi tiết
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id, order.order_code)}
                                  title="Xóa đơn hàng"
                                  className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            Không có đơn hàng nào khớp với tìm kiếm hoặc bộ lọc trạng thái.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CATEGORY MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Quản Lý Danh Mục</span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                      {categories.length} danh mục
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Cấu trúc phân loại sản phẩm trong cơ sở dữ liệu WebTSF
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateCategory}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Danh Mục Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <FolderTree className="w-5 h-5" />
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {cat.product_count || 0} sản phẩm
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-3">{cat.name}</h3>
                      <p className="text-xs font-mono text-slate-400 mt-1">slug: /{cat.slug}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ANALYTICS & REPORTS */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    Báo Cáo & Thống Kê Chi Tiết
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Báo cáo số liệu kinh doanh, doanh thu và hành vi mua hàng
                  </p>
                </div>
                <button
                  onClick={handleExportOrdersCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Toàn Bộ Báo Cáo CSV</span>
                </button>
              </div>

              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats?.statusBreakdown?.map((sb: any) => {
                  const st = statusMap[sb.status] || statusMap['PENDING'];
                  return (
                    <div
                      key={sb.status}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.bg}`}>
                          <st.icon className="w-3.5 h-3.5" />
                          <span>{st.label}</span>
                        </span>
                        <span className="text-xs font-mono text-slate-400">{sb.count} đơn</span>
                      </div>
                      <div className="text-xl font-extrabold text-white mt-2">
                        {formatVND(sb.total_amount)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Revenue & Growth Insights */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Chỉ Số Tăng Trưởng Thái Sơn Foods</h3>
                    <p className="text-xs text-slate-400">Tính toán dựa trên các đơn hàng hoàn tất thực tế</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Đơn trung bình (AOV)</p>
                    <p className="text-base font-extrabold text-white mt-1">
                      {orders.length > 0
                        ? formatVND(Math.round(Number(stats?.summary?.total_revenue || 0) / orders.length))
                        : '0 ₫'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Tỷ lệ hoàn thành</p>
                    <p className="text-base font-extrabold text-emerald-400 mt-1">
                      {orders.length > 0
                        ? Math.round(
                            (Number(stats?.summary?.completed_orders || 0) / orders.length) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Số lượng SKU bán</p>
                    <p className="text-base font-extrabold text-white mt-1">{products.length} SKU</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Thanh toán COD</p>
                    <p className="text-base font-extrabold text-blue-400 mt-1">
                      {orders.filter((o) => o.payment_method === 'cod').length} đơn
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: DATABASE & SYSTEM */}
          {/* ======================================================== */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <span>Quản Lý CSDL PostgreSQL WebTSF</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Trạng thái kết nối pgAdmin 4 / PostgreSQL cục bộ và thông số các bảng
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSeedDemoOrders}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Nạp Thêm Đơn Hàng Mẫu</span>
                  </button>
                  <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Kiểm Tra Lại Kết Nối</span>
                  </button>
                </div>
              </div>

              {/* Connection Status Card */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">PostgreSQL Local Server</h3>
                      <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Trạng thái: Hoạt động bình thường (ONLINE)</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Port: 5432
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Database Name</p>
                    <p className="text-sm font-mono font-bold text-white mt-1">WebTSF</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Host / IP</p>
                    <p className="text-sm font-mono font-bold text-white mt-1">127.0.0.1:5432</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <p className="text-xs text-slate-400">User / Schema</p>
                    <p className="text-sm font-mono font-bold text-white mt-1">postgres / public</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Connection Pool</p>
                    <p className="text-sm font-mono font-bold text-emerald-400 mt-1">Active (pg-pool 10)</p>
                  </div>
                </div>
              </div>

              {/* Table Metrics */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950/40">
                  <h3 className="text-sm font-bold text-white">Thống Kê Các Bảng Trong Cơ Sở Dữ Liệu WebTSF</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Tên Bảng (Table Name)</th>
                        <th className="py-3 px-4">Mục Đích Dữ Liệu</th>
                        <th className="py-3 px-4">Số Lượng Bản Ghi</th>
                        <th className="py-3 px-4">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">products</td>
                        <td className="py-3 px-4">Sản phẩm đồ uống, giá bán, ảnh, thuộc tính</td>
                        <td className="py-3 px-4 font-mono font-bold">{products.length} dòng</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">Đã đồng bộ</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">categories</td>
                        <td className="py-3 px-4">Phân loại sản phẩm (Sữa hạt, Trà sữa...)</td>
                        <td className="py-3 px-4 font-mono font-bold">{categories.length} dòng</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">Đã đồng bộ</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">orders</td>
                        <td className="py-3 px-4">Đơn đặt hàng từ website khách hàng</td>
                        <td className="py-3 px-4 font-mono font-bold">{orders.length} dòng</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">Đã đồng bộ</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">order_items</td>
                        <td className="py-3 px-4">Chi tiết các món trong từng đơn hàng</td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {orders.reduce((acc, o) => acc + (o.item_count || 1), 0)} dòng
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">Đã đồng bộ</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">product_variants</td>
                        <td className="py-3 px-4">Biến thể số lượng (1 chai, lốc 6, thùng 24)</td>
                        <td className="py-3 px-4 font-mono font-bold">Tự động liên kết</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">Đã đồng bộ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: THÊM / SỬA SẢN PHẨM */}
      {/* ======================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  {editingProduct.id ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                </h2>
                <p className="text-xs text-slate-400">Lưu thông tin trực tiếp vào CSDL WebTSF</p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tên sản phẩm */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Ví dụ: Sữa Bắp Nếp Thái Sơn"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mã SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="TSF-01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Danh mục */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục *</label>
                  <select
                    value={editingProduct.category_id || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category_id: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Giá bán */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giá bán (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Đơn vị tính */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    value={editingProduct.unit || '1 chai'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="1 chai, chai, lon..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Đường dẫn ảnh thumbnail */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Đường dẫn ảnh đại diện (Thumbnail)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingProduct.thumbnail || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, thumbnail: e.target.value })
                      }
                      placeholder="/images/products/sua-bap-nep.png"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    {editingProduct.thumbnail && (
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 relative overflow-hidden shrink-0">
                        <Image
                          src={editingProduct.thumbnail}
                          alt="preview"
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mô tả ngắn */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả ngắn</label>
                  <input
                    type="text"
                    value={editingProduct.short_description || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, short_description: e.target.value })
                    }
                    placeholder="Mô tả tóm tắt sản phẩm trong 1 câu..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Mô tả chi tiết */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    placeholder="Nguyên liệu, công dụng, bảo quản..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  ></textarea>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-300">Thuộc tính hiển thị</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.is_active)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, is_active: e.target.checked })
                      }
                      className="accent-emerald-600 rounded"
                    />
                    <span>Kích hoạt bán</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.is_featured)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, is_featured: e.target.checked })
                      }
                      className="accent-emerald-600 rounded"
                    />
                    <span>Nổi bật ⭐</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.is_best_seller)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, is_best_seller: e.target.checked })
                      }
                      className="accent-emerald-600 rounded"
                    />
                    <span>Bán chạy 🔥</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.is_new)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, is_new: e.target.checked })
                      }
                      className="accent-emerald-600 rounded"
                    />
                    <span>Mới 🆕</span>
                  </label>
                </div>
              </div>

              {/* Variants */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-300">Biến thể đóng gói (Variants)</p>
                  <button
                    type="button"
                    onClick={() =>
                      setProductFormVariants([
                        ...productFormVariants,
                        { name: 'Thùng 24 chai', quantity: 24, price: 432000, unit: 'thùng' },
                      ])
                    }
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm biến thể</span>
                  </button>
                </div>

                {productFormVariants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.name}
                      placeholder="Tên (VD: 6 chai)"
                      onChange={(e) => {
                        const next = [...productFormVariants];
                        next[i].name = e.target.value;
                        setProductFormVariants(next);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={v.quantity}
                      placeholder="Số lượng"
                      onChange={(e) => {
                        const next = [...productFormVariants];
                        next[i].quantity = parseInt(e.target.value, 10);
                        setProductFormVariants(next);
                      }}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                    <input
                      type="number"
                      value={v.price}
                      placeholder="Giá tiền"
                      onChange={(e) => {
                        const next = [...productFormVariants];
                        next[i].price = parseInt(e.target.value, 10);
                        setProductFormVariants(next);
                      }}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProductFormVariants(productFormVariants.filter((_, idx) => idx !== i))
                      }
                      className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingProduct.id ? 'Cập Nhật Sản Phẩm' : 'Tạo Sản Phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHI TIẾT ĐƠN HÀNG */}
      {/* ======================================================== */}
      {isOrderDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Đơn Hàng #{selectedOrder.order_code}
                  </h2>
                  {(() => {
                    const st = statusMap[selectedOrder.status] || statusMap['PENDING'];
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.bg}`}>
                        {st.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ngày đặt:{' '}
                  {new Date(selectedOrder.created_at).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => setIsOrderDetailModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Customer Info Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Thông Tin Khách Hàng
                  </h4>
                  <a
                    href={`tel:${selectedOrder.phone}`}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi {selectedOrder.phone}</span>
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Họ và tên:</span>{' '}
                    <span className="font-bold text-slate-100">{selectedOrder.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Số điện thoại:</span>{' '}
                    <span className="font-mono font-bold text-slate-100">{selectedOrder.phone}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Địa chỉ giao hàng:</span>{' '}
                    <span className="text-slate-200">
                      {selectedOrder.address}, {selectedOrder.ward}, {selectedOrder.district}, {selectedOrder.province}
                    </span>
                  </div>
                  {selectedOrder.note && (
                    <div className="sm:col-span-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <span className="font-semibold">Ghi chú của khách:</span> {selectedOrder.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Sản Phẩm Đã Đặt
                </h4>
                <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 bg-slate-950/40 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 relative overflow-hidden shrink-0">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.name}
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {formatVND(item.price)} × {item.quantity} {item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-400">
                            {formatVND(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      {selectedOrder.item_count || 1} món hàng trong đơn
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tiền hàng:</span>
                  <span className="font-semibold text-slate-200">
                    {formatVND(selectedOrder.subtotal || selectedOrder.total)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Phí giao hàng:</span>
                  <span className="font-semibold text-slate-200">
                    {formatVND(selectedOrder.shipping_fee || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Phương thức:</span>
                  <span className="uppercase font-bold text-slate-200">
                    {selectedOrder.payment_method}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-emerald-400 text-base">
                    {formatVND(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Status Update Quick Action */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-200">Cập nhật trạng thái đơn</p>
                  <p className="text-[11px] text-slate-400">Thay đổi và lưu vào CSDL WebTSF</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleUpdateOrderStatus(selectedOrder.id, e.target.value as Order['status'])
                    }
                    className="bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="PROCESSING">Đang chuẩn bị hàng</option>
                    <option value="SHIPPING">Đang giao hàng</option>
                    <option value="COMPLETED">Hoàn tất thành công</option>
                    <option value="CANCELLED">Đã hủy đơn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>In Hóa Đơn</span>
              </button>
              <button
                onClick={() => setIsOrderDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: THÊM / SỬA DANH MỤC */}
      {/* ======================================================== */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingCategory.id ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
              </h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Ví dụ: Nước Trái Cây Lên Men"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Đường dẫn (Slug)
                </label>
                <input
                  type="text"
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  placeholder="nuoc-trai-cay-len-men (tự động tạo nếu để trống)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                >
                  {editingCategory.id ? 'Lưu Thay Đổi' : 'Tạo Danh Mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
