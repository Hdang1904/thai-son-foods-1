'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  X,
  Layers,
  Navigation,
  Check,
  AlertTriangle,
  Loader2,
  Compass,
  Building,
} from 'lucide-react';
import { cn, safeFetchJson } from '@/lib/utils';
import { calculateHaversineDistance } from '@/lib/geo';

interface LocationConfirmMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoords?: { lat: number; lng: number } | null;
  initialAddress?: string;
  onConfirm: (confirmed: {
    lat: number;
    lng: number;
    formattedAddress: string;
    components?: { province?: string; district?: string; ward?: string; street?: string };
    confidence: 'high' | 'medium' | 'low';
  }) => void;
}

export default function LocationConfirmMapModal({
  isOpen,
  onClose,
  initialCoords,
  initialAddress,
  onConfirm,
}: LocationConfirmMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>(
    initialCoords || { lat: 10.7769, lng: 106.7009 }
  );
  const [isSatellite, setIsSatellite] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string>(initialAddress || '');
  const [addressComponents, setAddressComponents] = useState<{
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
  }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [distanceShiftMeters, setDistanceShiftMeters] = useState(0);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const originalCoords = useRef<{ lat: number; lng: number }>(
    initialCoords || { lat: 10.7769, lng: 106.7009 }
  );

  // Giá trị ban đầu chỉ đọc lúc mở popup; thay đổi props khi đang mở không được dựng lại bản đồ (làm nhảy ghim)
  const initialCoordsRef = useRef(initialCoords);
  const initialAddressRef = useRef(initialAddress);
  initialCoordsRef.current = initialCoords;
  initialAddressRef.current = initialAddress;

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const initialCoords = initialCoordsRef.current;
    const initialAddress = initialAddressRef.current;
    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;

      if (!mapContainerRef.current) return;

      const startLat = initialCoords?.lat || 10.7769;
      const startLng = initialCoords?.lng || 106.7009;
      originalCoords.current = { lat: startLat, lng: startLng };

      // Hủy map cũ nếu đã tồn tại
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 17,
        zoomControl: false,
      });

      // Thêm nút zoom ở góc dưới phải
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Lớp tile bản đồ đường phố mặc định (OpenStreetMap Standard)
      const streetTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });

      streetTile.addTo(map);
      tileLayerRef.current = streetTile;
      mapInstanceRef.current = map;

      // Xử lý sự kiện kéo bản đồ
      map.on('movestart', () => {
        if (isMounted) setIsDragging(true);
      });

      map.on('move', () => {
        const c = map.getCenter();
        if (isMounted) {
          setCenterCoords({ lat: c.lat, lng: c.lng });
          const distKm = calculateHaversineDistance(
            originalCoords.current.lat,
            originalCoords.current.lng,
            c.lat,
            c.lng
          );
          setDistanceShiftMeters(Math.round(distKm * 1000));
        }
      });

      map.on('moveend', async () => {
        if (!isMounted) return;
        setIsDragging(false);
        const c = map.getCenter();
        setCenterCoords({ lat: c.lat, lng: c.lng });

        // Reverse geocode khi dừng kéo
        setIsReverseGeocoding(true);
        try {
          const rev = await safeFetchJson<any>(`/api/geo/reverse?lat=${c.lat}&lng=${c.lng}`);
          if (rev?.success) {
            // Giữ lại số nhà/hẻm khách đã nhập trước đó nếu reverse geocode chỉ trả về tên đường chung chung
            let finalStreet = rev.components?.street || '';
            const houseMatch = (initialAddress || '').match(/^([0-9]+[A-Za-z0-9\/\-\.]*)/);
            if (houseMatch && houseMatch[1] && finalStreet && !finalStreet.startsWith(houseMatch[1])) {
              finalStreet = `${houseMatch[1]} ${finalStreet}`;
            }

            const updatedComponents = {
              ...rev.components,
              street: finalStreet || rev.components?.street,
            };
            setAddressComponents(updatedComponents);

            if (rev.formattedAddress) {
              let displayAddr = rev.formattedAddress;
              if (houseMatch && houseMatch[1] && !displayAddr.startsWith(houseMatch[1])) {
                displayAddr = `${houseMatch[1]} ${displayAddr}`;
              }
              setResolvedAddress(displayAddr);
            }
          }
        } catch {
          // Khi reverse geocoding lỗi, vẫn giữ nguyên tọa độ ghim và địa chỉ thủ công của khách
        } finally {
          setIsReverseGeocoding(false);
        }
      });

      if (isMounted) setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Chuyển đổi lớp bản đồ Đường phố vs Vệ tinh
  const toggleSatellite = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    const L = (await import('leaflet')).default;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (!isSatellite) {
      // Bật lớp vệ tinh Esri World Imagery với attribution chuẩn
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        }
      );
      satLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = satLayer;
      setIsSatellite(true);
    } else {
      // Về lớp đường phố OpenStreetMap Standard
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });
      streetLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = streetLayer;
      setIsSatellite(false);
    }
  }, [isSatellite]);

  // Định vị GPS thiết bị hiện tại
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current.setView([latitude, longitude], 18, { animate: true });
      },
      () => {
        setIsLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleConfirm = () => {
    const confidence = distanceShiftMeters > 200 ? 'medium' : 'high';
    onConfirm({
      lat: centerCoords.lat,
      lng: centerCoords.lng,
      formattedAddress: resolvedAddress || initialAddress || '',
      components: addressComponents,
      confidence,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-3xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                Xác nhận vị trí giao hàng chính xác
              </h3>
              <p className="text-[11px] text-gray-500">
                Kéo bản đồ để đặt pin chính xác vào cổng hoặc cửa nhà bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Khung bản đồ tương tác */}
        <div className="relative flex-1 w-full bg-gray-100 overflow-hidden">
          <div ref={mapContainerRef} className="relative z-0 w-full h-full" />

          {/* PIN CỐ ĐỊNH Ở TRUNG TÂM (Grab/ShopeeFood style) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-20 flex flex-col items-center">
            {/* Nhãn trên pin */}
            <div
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg mb-1 whitespace-nowrap transition-all flex items-center gap-1',
                isDragging
                  ? 'bg-amber-500 text-white scale-105'
                  : 'bg-emerald-800 text-white'
              )}
            >
              <span>Shipper sẽ giao đến đây</span>
            </div>

            {/* Icon Pin với hiệu ứng nhấc lên khi kéo */}
            <div
              className={cn(
                'transition-transform duration-150',
                isDragging ? '-translate-y-2 scale-110' : 'translate-y-0'
              )}
            >
              <svg width="40" height="48" viewBox="0 0 24 30" fill="none">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z"
                  fill="#059669"
                />
                <circle cx="12" cy="11" r="5" fill="#ffffff" />
                <circle cx="12" cy="11" r="2.5" fill="#047857" />
              </svg>
            </div>

            {/* Bóng đổ của Pin */}
            <div
              className={cn(
                'w-4 h-1.5 bg-black/30 rounded-full blur-[1px] transition-all',
                isDragging ? 'scale-75 opacity-40' : 'scale-100 opacity-70'
              )}
            />
          </div>

          {/* Các nút điều khiển nổi trên bản đồ */}
          <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
            {/* Nút bật/tắt lớp vệ tinh */}
            <button
              type="button"
              onClick={toggleSatellite}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md',
                isSatellite
                  ? 'bg-emerald-800 text-white'
                  : 'bg-white/95 text-gray-700 hover:bg-white'
              )}
              title="Chuyển đổi lớp vệ tinh / đường phố"
            >
              <Layers className="w-4 h-4" />
              <span>{isSatellite ? 'Vệ tinh' : 'Bản đồ'}</span>
            </button>

            {/* Nút định vị vị trí hiện tại */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingUser}
              className="p-2.5 rounded-xl bg-white/95 text-gray-700 hover:bg-white shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Định vị vị trí thiết bị của bạn"
            >
              {isLocatingUser ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Navigation className="w-4 h-4 text-emerald-700" />
              )}
            </button>
          </div>

          {/* Cảnh báo nếu khách kéo lệch quá 150m */}
          {distanceShiftMeters > 150 && (
            <div className="absolute top-3 left-3 right-16 sm:right-auto sm:max-w-xs z-30 p-2.5 rounded-xl bg-amber-500/95 text-white text-xs shadow-lg flex items-center gap-2 backdrop-blur-xs animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
              <span>Đang lệch ~{distanceShiftMeters}m so với vị trí tìm kiếm. Hãy chắc chắn đây là đúng nhà bạn.</span>
            </div>
          )}
        </div>

        {/* Footer: Thông tin địa chỉ & Nút xác nhận */}
        <div className="p-4 bg-white border-t border-gray-100 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
              <span>Tọa độ xác nhận:</span>
              <span className="font-mono font-semibold text-emerald-800">
                {centerCoords.lat.toFixed(6)}, {centerCoords.lng.toFixed(6)}
              </span>
              {isReverseGeocoding && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {resolvedAddress || initialAddress || 'Đang cập nhật địa chỉ...'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận vị trí</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
