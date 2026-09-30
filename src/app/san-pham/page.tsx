import { redirect } from 'next/navigation';

/**
 * Trang danh sách sản phẩm đã được tích hợp trực tiếp vào Trang chủ.
 * Mọi truy cập vào /san-pham sẽ được chuyển hướng về trang chủ phần sản phẩm.
 */
export default function ProductsPage() {
  redirect('/#san-pham');
}
