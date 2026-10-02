/**
 * src/data/vietnam-addresses.ts
 * 
 * Dữ liệu phân cấp hành chính chuẩn Việt Nam (Tỉnh / Thành phố -> Quận / Huyện -> Phường / Xã)
 * Kèm tọa độ GPS trung tâm từng khu vực để ước tính khoảng cách chính xác đến chuỗi cửa hàng Thái Sơn Foods.
 */

export interface WardItem {
  name: string;
  lat?: number;
  lng?: number;
  aliases?: string[];
}

export interface DistrictItem {
  name: string;
  lat: number;
  lng: number;
  wards: WardItem[];
}

export interface ProvinceItem {
  name: string;
  lat: number;
  lng: number;
  districts: DistrictItem[];
}

export const VIETNAM_ADDRESSES: ProvinceItem[] = [
  {
    name: 'TP. Hồ Chí Minh',
    lat: 10.7769,
    lng: 106.7009,
    districts: [
      {
        name: 'Quận Tân Bình',
        lat: 10.8015,
        lng: 106.6534,
        wards: [
          {
            name: 'Phường Tân Sơn Hòa',
            lat: 10.8035,
            lng: 106.6665,
            aliases: ['Phường 1', 'Phường 2', 'Phường 3', 'P1', 'P2', 'P3', 'P.1', 'P.2', 'P.3', '1', '2', '3'],
          },
          {
            name: 'Phường Tân Sơn Nhất',
            lat: 10.7963,
            lng: 106.6538,
            aliases: ['Phường 4', 'Phường 5', 'Phường 7', 'P4', 'P5', 'P7', 'P.4', 'P.5', 'P.7', '4', '5', '7'],
          },
          {
            name: 'Phường Tân Hòa',
            lat: 10.7834,
            lng: 106.6515,
            aliases: ['Phường 6', 'Phường 8', 'Phường 9', 'P6', 'P8', 'P9', 'P.6', 'P.8', 'P.9', '6', '8', '9'],
          },
          {
            name: 'Phường Bảy Hiền',
            lat: 10.7885,
            lng: 106.6460,
            aliases: ['Phường 10', 'Phường 11', 'Phường 12', 'P10', 'P11', 'P12', 'P.10', 'P.11', 'P.12', '10', '11', '12'],
          },
          {
            name: 'Phường Tân Bình',
            lat: 10.8025,
            lng: 106.6410,
            aliases: ['Phường 13', 'Phường 14', 'P13', 'P14', 'P.13', 'P.14', '13', '14'], // Nơi có đường Văn Chung
          },
          {
            name: 'Phường Tân Sơn',
            lat: 10.8252,
            lng: 106.6358,
            aliases: ['Phường 15', 'P15', 'P.15', '15'],
          },
        ],
      },
      {
        name: 'Quận 1',
        lat: 10.7756,
        lng: 106.7004,
        wards: [
          { name: 'Phường Bến Nghé', lat: 10.7812, lng: 106.7032 },
          { name: 'Phường Bến Thành', lat: 10.7725, lng: 106.6981 },
          { name: 'Phường Đa Kao', lat: 10.7895, lng: 106.6988 },
          { name: 'Phường Tân Định', lat: 10.7912, lng: 106.6915 },
          { name: 'Phường Nguyễn Thái Bình', lat: 10.7681, lng: 106.6985 },
          { name: 'Phường Phạm Ngũ Lão', lat: 10.7689, lng: 106.6925 },
          { name: 'Phường Cô Giang', lat: 10.7628, lng: 106.6942 },
          { name: 'Phường Cầu Kho', lat: 10.7585, lng: 106.6912 },
          { name: 'Phường Cầu Ông Lãnh', lat: 10.7651, lng: 106.6978 },
          { name: 'Phường Nguyễn Cư Trinh', lat: 10.7658, lng: 106.6872 },
        ],
      },
      {
        name: 'Quận 3',
        lat: 10.7844,
        lng: 106.6844,
        wards: [
          { name: 'Phường Võ Thị Sáu', lat: 10.7856, lng: 106.6912 },
          { name: 'Phường 1', lat: 10.7682, lng: 106.6789 },
          { name: 'Phường 2', lat: 10.7712, lng: 106.6815 },
          { name: 'Phường 3', lat: 10.7745, lng: 106.6828 },
          { name: 'Phường 4', lat: 10.7765, lng: 106.6845 },
          { name: 'Phường 5', lat: 10.7758, lng: 106.6892 },
          { name: 'Phường 9', lat: 10.7825, lng: 106.6812, aliases: ['Phường 10', 'P10', 'P.10', '10'] },
          { name: 'Phường 11', lat: 10.7872, lng: 106.6758 },
          { name: 'Phường 12', lat: 10.7892, lng: 106.6728, aliases: ['Phường 13', 'P13', 'P.13', '13'] },
          { name: 'Phường 14', lat: 10.7932, lng: 106.6835 },
        ],
      },
      {
        name: 'Quận 4',
        lat: 10.7600,
        lng: 106.7025,
        wards: [
          { name: 'Phường 1', lat: 10.7582, lng: 106.6935 },
          { name: 'Phường 2', lat: 10.7592, lng: 106.6965 },
          { name: 'Phường 3', lat: 10.7585, lng: 106.6998 },
          { name: 'Phường 4', lat: 10.7575, lng: 106.7032 },
          { name: 'Phường 8', lat: 10.7635, lng: 106.7038, aliases: ['Phường 10', 'P10', 'P.10', '10'] },
          { name: 'Phường 9', lat: 10.7645, lng: 106.7015, aliases: ['Phường 6', 'P6', 'P.6', '6'] },
          { name: 'Phường 13', lat: 10.7665, lng: 106.7082 },
          { name: 'Phường 15', lat: 10.7588, lng: 106.7075, aliases: ['Phường 14', 'P14', 'P.14', '14'] },
          { name: 'Phường 16', lat: 10.7595, lng: 106.7125 },
          { name: 'Phường 18', lat: 10.7625, lng: 106.7152 },
        ],
      },
      {
        name: 'Quận 5',
        lat: 10.7554,
        lng: 106.6667,
        wards: [
          { name: 'Phường 1', lat: 10.7512, lng: 106.6812 },
          { name: 'Phường 2', lat: 10.7535, lng: 106.6785, aliases: ['Phường 3', 'P3', 'P.3', '3'] },
          { name: 'Phường 4', lat: 10.7582, lng: 106.6782 },
          { name: 'Phường 5', lat: 10.7555, lng: 106.6685, aliases: ['Phường 6', 'P6', 'P.6', '6'] },
          { name: 'Phường 7', lat: 10.7515, lng: 106.6612, aliases: ['Phường 8', 'P8', 'P.8', '8'] },
          { name: 'Phường 9', lat: 10.7588, lng: 106.6645 },
          { name: 'Phường 11', lat: 10.7565, lng: 106.6562, aliases: ['Phường 10', 'P10', 'P.10', '10'] },
          { name: 'Phường 12', lat: 10.7582, lng: 106.6585 },
          { name: 'Phường 13', lat: 10.7512, lng: 106.6535 },
          { name: 'Phường 14', lat: 10.7535, lng: 106.6515 },
        ],
      },
      {
        name: 'Quận 6',
        lat: 10.7481,
        lng: 106.6352,
        wards: [
          { name: 'Phường 1', lat: 10.7512, lng: 106.6492, aliases: ['Phường 3', 'Phường 4', 'P3', 'P4', '3', '4'] },
          { name: 'Phường 2', lat: 10.7485, lng: 106.6465, aliases: ['Phường 6', 'P6', '6'] },
          { name: 'Phường 7', lat: 10.7425, lng: 106.6355 },
          { name: 'Phường 8', lat: 10.7465, lng: 106.6362 },
          { name: 'Phường 9', lat: 10.7515, lng: 106.6375, aliases: ['Phường 5', 'P5', '5'] },
          { name: 'Phường 10', lat: 10.7478, lng: 106.6312 },
          { name: 'Phường 11', lat: 10.7432, lng: 106.6265 },
          { name: 'Phường 12', lat: 10.7485, lng: 106.6245 },
          { name: 'Phường 13', lat: 10.7532, lng: 106.6285 },
          { name: 'Phường 14', lat: 10.7562, lng: 106.6335 },
        ],
      },
      {
        name: 'Quận 7',
        lat: 10.7340,
        lng: 106.7218,
        wards: [
          { name: 'Phường Tân Thuận Đông', lat: 10.7512, lng: 106.7255 },
          { name: 'Phường Tân Thuận Tây', lat: 10.7455, lng: 106.7185 },
          { name: 'Phường Tân Kiểng', lat: 10.7468, lng: 106.7112 },
          { name: 'Phường Tân Hưng', lat: 10.7475, lng: 106.7025 },
          { name: 'Phường Bình Thuận', lat: 10.7395, lng: 106.7215 },
          { name: 'Phường Tân Quy', lat: 10.7412, lng: 106.7085 },
          { name: 'Phường Tân Phong', lat: 10.7312, lng: 106.7065 },
          { name: 'Phường Tân Phú', lat: 10.7287, lng: 106.7323 }, // Cửa hàng Huỳnh Tấn Phát
          { name: 'Phường Phú Thuận', lat: 10.7215, lng: 106.7415 },
          { name: 'Phường Phú Mỹ', lat: 10.7095, lng: 106.7385 },
        ],
      },
      {
        name: 'Quận 8',
        lat: 10.7241,
        lng: 106.6286,
        wards: [
          {
            name: 'Phường Rạch Ông',
            lat: 10.7445,
            lng: 106.6842,
            aliases: ['Phường 1', 'Phường 2', 'Phường 3', 'P1', 'P2', 'P3', '1', '2', '3'],
          },
          {
            name: 'Phường Chánh Hưng',
            lat: 10.7375,
            lng: 106.6715,
            aliases: ['Phường 4', 'Phường 5', 'P4', 'P5', '4', '5'], // Cửa hàng Cao Lỗ
          },
          { name: 'Phường 6', lat: 10.7352, lng: 106.6598 },
          { name: 'Phường 7', lat: 10.7185, lng: 106.6455 },
          {
            name: 'Phường Hưng Phú',
            lat: 10.7460,
            lng: 106.6580,
            aliases: ['Phường 8', 'Phường 9', 'Phường 10', 'P8', 'P9', 'P10', '8', '9', '10'],
          },
          {
            name: 'Phường Xóm Củi',
            lat: 10.7430,
            lng: 106.6465,
            aliases: ['Phường 11', 'Phường 12', 'Phường 13', 'P11', 'P12', 'P13', '11', '12', '13'],
          },
          { name: 'Phường 14', lat: 10.7385, lng: 106.6385 },
          { name: 'Phường 15', lat: 10.7352, lng: 106.6315 },
          { name: 'Phường 16', lat: 10.7295, lng: 106.6255 },
        ],
      },
      {
        name: 'Quận 10',
        lat: 10.7716,
        lng: 106.6672,
        wards: [
          { name: 'Phường 1', lat: 10.7655, lng: 106.6785 },
          { name: 'Phường 2', lat: 10.7635, lng: 106.6755 },
          { name: 'Phường 4', lat: 10.7658, lng: 106.6715 },
          { name: 'Phường 6', lat: 10.7628, lng: 106.6615, aliases: ['Phường 7', 'P7', '7'] },
          { name: 'Phường 8', lat: 10.7675, lng: 106.6665, aliases: ['Phường 5', 'P5', '5'] },
          { name: 'Phường 9', lat: 10.7698, lng: 106.6705 },
          { name: 'Phường 10', lat: 10.7725, lng: 106.6745, aliases: ['Phường 11', 'P11', '11'] },
          { name: 'Phường 12', lat: 10.7775, lng: 106.6725 },
          { name: 'Phường 13', lat: 10.7812, lng: 106.6685 },
          { name: 'Phường 14', lat: 10.7703, lng: 106.6645 }, // Cửa hàng Cư Xá Đồng Tiến
          { name: 'Phường 15', lat: 10.7785, lng: 106.6598 },
        ],
      },
      {
        name: 'Quận 11',
        lat: 10.7629,
        lng: 106.6504,
        wards: [
          { name: 'Phường 1', lat: 10.7585, lng: 106.6485, aliases: ['Phường 2', 'P2', '2'] },
          { name: 'Phường 3', lat: 10.7675, lng: 106.6415 },
          { name: 'Phường 5', lat: 10.7695, lng: 106.6455 },
          { name: 'Phường 7', lat: 10.7645, lng: 106.6612, aliases: ['Phường 4', 'Phường 6', 'P4', 'P6', '4', '6'] },
          { name: 'Phường 8', lat: 10.7655, lng: 106.6545, aliases: ['Phường 12', 'P12', '12'] },
          { name: 'Phường 10', lat: 10.7675, lng: 106.6485, aliases: ['Phường 9', 'P9', '9'] },
          { name: 'Phường 11', lat: 10.7715, lng: 106.6495, aliases: ['Phường 13', 'P13', '13'] },
          { name: 'Phường 14', lat: 10.7655, lng: 106.6385 },
          { name: 'Phường 15', lat: 10.7745, lng: 106.6535 },
          { name: 'Phường 16', lat: 10.7595, lng: 106.6415 },
        ],
      },
      {
        name: 'Quận 12',
        lat: 10.8672,
        lng: 106.6413,
        wards: [
          { name: 'Phường Tân Chánh Hiệp', lat: 10.8719, lng: 106.6252 }, // Cửa hàng TCH
          { name: 'Phường An Phú Đông', lat: 10.8575, lng: 106.6912 },
          { name: 'Phường Đông Hưng Thuận', lat: 10.8415, lng: 106.6285 },
          { name: 'Phường Hiệp Thành', lat: 10.8812, lng: 106.6385 },
          { name: 'Phường Tân Hưng Thuận', lat: 10.8455, lng: 106.6215 },
          { name: 'Phường Tân Thới Hiệp', lat: 10.8655, lng: 106.6385 },
          { name: 'Phường Tân Thới Nhất', lat: 10.8355, lng: 106.6185 },
          { name: 'Phường Thạnh Lộc', lat: 10.8755, lng: 106.6855 },
          { name: 'Phường Thạnh Xuân', lat: 10.8885, lng: 106.6685 },
          { name: 'Phường Thới An', lat: 10.8715, lng: 106.6515 },
          { name: 'Phường Trung Mỹ Tây', lat: 10.8555, lng: 106.6115 },
        ],
      },
      {
        name: 'Quận Tân Phú',
        lat: 10.7900,
        lng: 106.6280,
        wards: [
          { name: 'Phường Phú Thọ Hòa', lat: 10.7883, lng: 106.6251 }, // Cửa hàng Vườn Lài
          { name: 'Phường Hiệp Tân', lat: 10.7685, lng: 106.6315 },
          { name: 'Phường Hòa Thạnh', lat: 10.7755, lng: 106.6345 },
          { name: 'Phường Phú Thạnh', lat: 10.7815, lng: 106.6285 },
          { name: 'Phường Phú Trung', lat: 10.7715, lng: 106.6415 },
          { name: 'Phường Sơn Kỳ', lat: 10.8085, lng: 106.6185 },
          { name: 'Phường Tân Quý', lat: 10.7955, lng: 106.6215 },
          { name: 'Phường Tân Sơn Nhì', lat: 10.8015, lng: 106.6285 },
          { name: 'Phường Tân Thành', lat: 10.7915, lng: 106.6315 },
          { name: 'Phường Tân Thới Hòa', lat: 10.7655, lng: 106.6385 },
          { name: 'Phường Tây Thạnh', lat: 10.8185, lng: 106.6285 },
        ],
      },
      {
        name: 'Quận Bình Thạnh',
        lat: 10.8106,
        lng: 106.6982,
        wards: [
          { name: 'Phường 25', lat: 10.8044, lng: 106.7219 }, // Cửa hàng Ung Văn Khiêm
          { name: 'Phường 1', lat: 10.7985, lng: 106.6965 },
          { name: 'Phường 2', lat: 10.8015, lng: 106.6945, aliases: ['Phường 15', 'P15', '15'] },
          { name: 'Phường 3', lat: 10.8045, lng: 106.6915 },
          { name: 'Phường 5', lat: 10.8115, lng: 106.6935 },
          { name: 'Phường 6', lat: 10.8135, lng: 106.6912 },
          { name: 'Phường 7', lat: 10.8075, lng: 106.6955 },
          { name: 'Phường 11', lat: 10.8195, lng: 106.6915, aliases: ['Phường 13', 'P13', '13'] },
          { name: 'Phường 12', lat: 10.8095, lng: 106.6985 },
          { name: 'Phường 14', lat: 10.8025, lng: 106.6985, aliases: ['Phường 24', 'P24', '24'] },
          { name: 'Phường 17', lat: 10.7915, lng: 106.7085 },
          { name: 'Phường 19', lat: 10.7925, lng: 106.7115, aliases: ['Phường 21', 'P21', '21'] },
          { name: 'Phường 22', lat: 10.7915, lng: 106.7215 },
          { name: 'Phường 26', lat: 10.8155, lng: 106.7125 },
          { name: 'Phường 27', lat: 10.8255, lng: 106.7185 },
          { name: 'Phường 28', lat: 10.8355, lng: 106.7315 },
        ],
      },
      {
        name: 'Quận Gò Vấp',
        lat: 10.8388,
        lng: 106.6658,
        wards: [
          { name: 'Phường 6', lat: 10.8371, lng: 106.6812 }, // Cửa hàng Tân Nhơn
          { name: 'Phường 1', lat: 10.8195, lng: 106.6855, aliases: ['Phường 4', 'Phường 7', 'P4', 'P7', '4', '7'] },
          { name: 'Phường 3', lat: 10.8215, lng: 106.6785 },
          { name: 'Phường 5', lat: 10.8315, lng: 106.6885 },
          { name: 'Phường 8', lat: 10.8415, lng: 106.6545, aliases: ['Phường 9', 'P9', '9'] },
          { name: 'Phường 10', lat: 10.8355, lng: 106.6655 },
          { name: 'Phường 11', lat: 10.8415, lng: 106.6625 },
          { name: 'Phường 12', lat: 10.8455, lng: 106.6485 },
          { name: 'Phường 14', lat: 10.8555, lng: 106.6415, aliases: ['Phường 13', 'P13', '13'] },
          { name: 'Phường 15', lat: 10.8515, lng: 106.6785 },
          { name: 'Phường 16', lat: 10.8485, lng: 106.6685 },
          { name: 'Phường 17', lat: 10.8455, lng: 106.6785 },
        ],
      },
      {
        name: 'Quận Phú Nhuận',
        lat: 10.7992,
        lng: 106.6803,
        wards: [
          { name: 'Phường 1', lat: 10.7955, lng: 106.6912 },
          { name: 'Phường 2', lat: 10.7945, lng: 106.6885 },
          { name: 'Phường 4', lat: 10.8065, lng: 106.6885, aliases: ['Phường 3', 'P3', '3'] },
          { name: 'Phường 5', lat: 10.8045, lng: 106.6845 },
          { name: 'Phường 7', lat: 10.8015, lng: 106.6855 },
          { name: 'Phường 8', lat: 10.7975, lng: 106.6795 },
          { name: 'Phường 9', lat: 10.8065, lng: 106.6785 },
          { name: 'Phường 10', lat: 10.7935, lng: 106.6765 },
          { name: 'Phường 11', lat: 10.7915, lng: 106.6785 },
          { name: 'Phường 13', lat: 10.7895, lng: 106.6815 },
          { name: 'Phường 15', lat: 10.7925, lng: 106.6845, aliases: ['Phường 17', 'P17', '17'] },
        ],
      },
      {
        name: 'Quận Bình Tân',
        lat: 10.7654,
        lng: 106.6039,
        wards: [
          { name: 'Phường Bình Trị Đông', lat: 10.7598, lng: 106.6188 }, // Cửa hàng Chiến Lược
          { name: 'Phường An Lạc', lat: 10.7355, lng: 106.6115 },
          { name: 'Phường An Lạc A', lat: 10.7485, lng: 106.6185 },
          { name: 'Phường Bình Hưng Hòa', lat: 10.8015, lng: 106.6085 },
          { name: 'Phường Bình Hưng Hòa A', lat: 10.7855, lng: 106.6055 },
          { name: 'Phường Bình Hưng Hòa B', lat: 10.8025, lng: 106.5915 },
          { name: 'Phường Bình Trị Đông A', lat: 10.7685, lng: 106.6015 },
          { name: 'Phường Bình Trị Đông B', lat: 10.7555, lng: 106.6055 },
          { name: 'Phường Tân Tạo', lat: 10.7455, lng: 106.5815 },
          { name: 'Phường Tân Tạo A', lat: 10.7585, lng: 106.5755 },
        ],
      },
      {
        name: 'TP. Thủ Đức',
        lat: 10.8494,
        lng: 106.7716,
        wards: [
          { name: 'Phường Linh Tây', lat: 10.8618, lng: 106.7558 }, // Cửa hàng Linh Tây
          { name: 'Phường Bình Chiểu', lat: 10.8826, lng: 106.7297 }, // Cửa hàng Bình Chiểu
          { name: 'Phường Tăng Nhơn Phú A', lat: 10.8479, lng: 106.7953 }, // Cửa hàng Tăng Nhơn Phú
          { name: 'Phường An Khánh', lat: 10.7855, lng: 106.7355 },
          { name: 'Phường An Phú', lat: 10.8015, lng: 106.7455 },
          { name: 'Phường Bình Thọ', lat: 10.8485, lng: 106.7655 },
          { name: 'Phường Hiệp Bình Chánh', lat: 10.8355, lng: 106.7215 },
          { name: 'Phường Hiệp Bình Phước', lat: 10.8555, lng: 106.7185 },
          { name: 'Phường Linh Chiểu', lat: 10.8555, lng: 106.7615 },
          { name: 'Phường Linh Đông', lat: 10.8485, lng: 106.7485 },
          { name: 'Phường Linh Trung', lat: 10.8685, lng: 106.7755 },
          { name: 'Phường Linh Xuân', lat: 10.8815, lng: 106.7715 },
          { name: 'Phường Phước Long A', lat: 10.8255, lng: 106.7655 },
          { name: 'Phường Phước Long B', lat: 10.8215, lng: 106.7815 },
          { name: 'Phường Tam Bình', lat: 10.8685, lng: 106.7385 },
          { name: 'Phường Tam Phú', lat: 10.8585, lng: 106.7415 },
          { name: 'Phường Thảo Điền', lat: 10.8085, lng: 106.7315 },
          { name: 'Phường Thủ Thiêm', lat: 10.7715, lng: 106.7185 },
          { name: 'Phường Trường Thọ', lat: 10.8385, lng: 106.7555 },
        ],
      },
      {
        name: 'Huyện Hóc Môn',
        lat: 10.8841,
        lng: 106.5925,
        wards: [
          { name: 'Thị trấn Hóc Môn', lat: 10.8875, lng: 106.5915 },
          { name: 'Xã Bà Điểm', lat: 10.8415, lng: 106.6015 },
          { name: 'Xã Đông Thạnh', lat: 10.8915, lng: 106.6455 },
          { name: 'Xã Tân Hiệp', lat: 10.9015, lng: 106.5715 },
          { name: 'Xã Thới Tam Thôn', lat: 10.8755, lng: 106.6115 },
          { name: 'Xã Trung Chánh', lat: 10.8555, lng: 106.6115 },
          { name: 'Xã Xuân Thới Thượng', lat: 10.8455, lng: 106.5615 },
        ],
      },
      {
        name: 'Huyện Củ Chi',
        lat: 10.9731,
        lng: 106.4939,
        wards: [
          { name: 'Thị trấn Củ Chi', lat: 10.9712, lng: 106.4929 }, // Cửa hàng Củ Chi
          { name: 'Xã Tân An Hội', lat: 10.9615, lng: 106.4815 },
          { name: 'Xã Tân Thông Hội', lat: 10.9415, lng: 106.5185 },
          { name: 'Xã Tân Phú Trung', lat: 10.9255, lng: 106.5415 },
          { name: 'Xã Bình Mỹ', lat: 10.9415, lng: 106.6515 },
          { name: 'Xã Hòa Phú', lat: 10.9755, lng: 106.6185 },
        ],
      },
      {
        name: 'Huyện Bình Chánh',
        lat: 10.6875,
        lng: 106.5939,
        wards: [
          { name: 'Thị trấn Tân Túc', lat: 10.6915, lng: 106.5785 },
          { name: 'Xã Bình Hưng', lat: 10.7255, lng: 106.6615 },
          { name: 'Xã Phong Phú', lat: 10.7085, lng: 106.6515 },
          { name: 'Xã Vĩnh Lộc A', lat: 10.8155, lng: 106.5615 },
          { name: 'Xã Vĩnh Lộc B', lat: 10.7855, lng: 106.5515 },
          { name: 'Xã Tân Kiên', lat: 10.7215, lng: 106.5815 },
        ],
      },
      {
        name: 'Huyện Nhà Bè',
        lat: 10.6953,
        lng: 106.7297,
        wards: [
          { name: 'Thị trấn Nhà Bè', lat: 10.7015, lng: 106.7385 },
          { name: 'Xã Phước Kiển', lat: 10.7185, lng: 106.7055 },
          { name: 'Xã Phú Xuân', lat: 10.6855, lng: 106.7355 },
          { name: 'Xã Nhơn Đức', lat: 10.6685, lng: 106.7055 },
          { name: 'Xã Long Thới', lat: 10.6515, lng: 106.7415 },
          { name: 'Xã Hiệp Phước', lat: 10.6155, lng: 106.7585 },
        ],
      },
      {
        name: 'Huyện Cần Giờ',
        lat: 10.4114,
        lng: 106.9642,
        wards: [
          { name: 'Thị trấn Cần Thạnh', lat: 10.4055, lng: 106.9615 },
          { name: 'Xã Bình Khánh', lat: 10.6655, lng: 106.7815 },
          { name: 'Xã Long Hòa', lat: 10.4355, lng: 106.9215 },
        ],
      },
    ],
  },
  {
    name: 'Đồng Nai',
    lat: 10.9574,
    lng: 106.8427,
    districts: [
      {
        name: 'TP. Biên Hòa',
        lat: 10.9574,
        lng: 106.8427,
        wards: [
          { name: 'Phường Tân Hiệp', lat: 10.9606, lng: 106.8700 }, // Cửa hàng Tân Hiệp Biên Hòa (AMA)
          { name: 'Phường Phước Tân', lat: 10.8724, lng: 106.9062 }, // Cửa hàng Phước Tân (LB)
          { name: 'Phường Tam Hiệp', lat: 10.9485, lng: 106.8615 },
          { name: 'Phường Trảng Dài', lat: 10.9855, lng: 106.8655 },
          { name: 'Phường Tân Phong', lat: 10.9715, lng: 106.8385 },
          { name: 'Phường Quyết Thắng', lat: 10.9485, lng: 106.8215 },
          { name: 'Phường Trung Dũng', lat: 10.9525, lng: 106.8285 },
          { name: 'Phường Thống Nhất', lat: 10.9415, lng: 106.8315 },
          { name: 'Phường Hố Nai', lat: 10.9615, lng: 106.8915 },
          { name: 'Phường Long Bình', lat: 10.9415, lng: 106.9015 },
          { name: 'Phường Long Bình Tân', lat: 10.9015, lng: 106.8685 },
          { name: 'Phường Bửu Long', lat: 10.9685, lng: 106.8015 },
        ],
      },
      {
        name: 'Huyện Long Thành',
        lat: 10.7815,
        lng: 106.9555,
        wards: [
          { name: 'Thị trấn Long Thành', lat: 10.7751, lng: 106.9568 }, // Cửa hàng Cầu Xéo (CM)
          { name: 'Xã An Phước', lat: 10.8115, lng: 106.9415 },
          { name: 'Xã Bình Sơn', lat: 10.7915, lng: 107.0015 },
          { name: 'Xã Lộc An', lat: 10.7985, lng: 106.9715 },
          { name: 'Xã Tam An', lat: 10.8255, lng: 106.9115 },
        ],
      },
      {
        name: 'Huyện Trảng Bom',
        lat: 10.9444,
        lng: 107.0105,
        wards: [
          { name: 'Thị trấn Trảng Bom', lat: 10.9444, lng: 107.0105 }, // Cửa hàng Trảng Bom (TRB)
          { name: 'Xã Hố Nai 3', lat: 10.9515, lng: 106.9215 },
          { name: 'Xã Bắc Sơn', lat: 10.9615, lng: 106.9455 },
          { name: 'Xã Bình Minh', lat: 10.9585, lng: 106.9715 },
          { name: 'Xã Quảng Tiến', lat: 10.9485, lng: 106.9915 },
        ],
      },
      {
        name: 'Huyện Xuân Lộc',
        lat: 10.8553,
        lng: 107.4918,
        wards: [
          { name: 'Thị trấn Gia Ray', lat: 10.9255, lng: 107.3815 },
          { name: 'Xã Xuân Hưng', lat: 10.8553, lng: 107.4918 }, // Cửa hàng Xuân Lộc (XL)
          { name: 'Xã Xuân Tâm', lat: 10.8915, lng: 107.4415 },
          { name: 'Xã Xuân Định', lat: 10.8915, lng: 107.3115 },
        ],
      },
      {
        name: 'TP. Long Khánh',
        lat: 10.9385,
        lng: 107.2415,
        wards: [
          { name: 'Phường Xuân An', lat: 10.9415, lng: 107.2455 },
          { name: 'Phường Xuân Bình', lat: 10.9385, lng: 107.2385 },
          { name: 'Phường Xuân Hòa', lat: 10.9355, lng: 107.2355 },
          { name: 'Phường Xuân Trung', lat: 10.9455, lng: 107.2415 },
        ],
      },
      {
        name: 'Huyện Nhơn Trạch',
        lat: 10.6885,
        lng: 106.9015,
        wards: [
          { name: 'Thị trấn Hiệp Phước', lat: 10.7115, lng: 106.9385 },
          { name: 'Xã Phước Thiền', lat: 10.7255, lng: 106.9015 },
          { name: 'Xã Đại Phước', lat: 10.7415, lng: 106.8115 },
        ],
      },
    ],
  },
  {
    name: 'Bình Dương',
    lat: 10.9914,
    lng: 106.6441,
    districts: [
      {
        name: 'TP. Thuận An',
        lat: 10.9323,
        lng: 106.7096,
        wards: [
          { name: 'Phường An Phú', lat: 10.9523, lng: 106.7296 }, // Cửa hàng An Phú (ME)
          { name: 'Phường Lái Thiêu', lat: 10.9085, lng: 106.6985 },
          { name: 'Phường Thuận Giao', lat: 10.9415, lng: 106.7115 },
          { name: 'Phường Bình Hòa', lat: 10.9155, lng: 106.7255 },
          { name: 'Phường Vĩnh Phú', lat: 10.8855, lng: 106.7015 },
        ],
      },
      {
        name: 'TP. Bến Cát',
        lat: 11.0963,
        lng: 106.6617,
        wards: [
          { name: 'Phường Hòa Lợi', lat: 11.0963, lng: 106.6617 }, // Cửa hàng Mỹ Phước (MP)
          { name: 'Phường Mỹ Phước', lat: 11.1215, lng: 106.6115 },
          { name: 'Phường Thới Hòa', lat: 11.0855, lng: 106.6315 },
          { name: 'Phường Tân Định', lat: 11.0615, lng: 106.6485 },
        ],
      },
      {
        name: 'TP. Thủ Dầu Một',
        lat: 10.9914,
        lng: 106.6441,
        wards: [
          { name: 'Phường Chánh Mỹ', lat: 10.9914, lng: 106.6441 }, // Cửa hàng Thủ Dầu Một (TDM)
          { name: 'Phường Phú Cường', lat: 10.9785, lng: 106.6515 },
          { name: 'Phường Phú Hòa', lat: 10.9715, lng: 106.6785 },
          { name: 'Phường Định Hòa', lat: 11.0255, lng: 106.6515 },
          { name: 'Phường Hiệp Thành', lat: 10.9915, lng: 106.6615 },
        ],
      },
      {
        name: 'TP. Dĩ An',
        lat: 10.9026,
        lng: 106.7600,
        wards: [
          { name: 'Phường Dĩ An', lat: 10.9026, lng: 106.7600 },
          { name: 'Phường An Bình', lat: 10.8815, lng: 106.7485 },
          { name: 'Phường Tân Đông Hiệp', lat: 10.9255, lng: 106.7685 },
          { name: 'Phường Đông Hòa', lat: 10.8915, lng: 106.7815 },
          { name: 'Phường Bình An', lat: 10.8985, lng: 106.8015 },
        ],
      },
      {
        name: 'TP. Tân Uyên',
        lat: 11.0615,
        lng: 106.7815,
        wards: [
          { name: 'Phường Uyên Hưng', lat: 11.0615, lng: 106.7815 },
          { name: 'Phường Tân Phước Khánh', lat: 10.9985, lng: 106.7315 },
          { name: 'Phường Thái Hòa', lat: 10.9715, lng: 106.7585 },
        ],
      },
    ],
  },
  {
    name: 'Bà Rịa - Vũng Tàu',
    lat: 10.3614,
    lng: 107.0946,
    districts: [
      {
        name: 'TP. Vũng Tàu',
        lat: 10.3614,
        lng: 107.0946,
        wards: [
          { name: 'Phường Nguyễn An Ninh', lat: 10.3614, lng: 107.0946 }, // Cửa hàng Vũng Tàu (VT)
          { name: 'Phường 1', lat: 10.3455, lng: 107.0755 },
          { name: 'Phường 2', lat: 10.3385, lng: 107.0815 },
          { name: 'Phường 3', lat: 10.3485, lng: 107.0855 },
          { name: 'Phường 7', lat: 10.3615, lng: 107.0885 },
          { name: 'Phường 8', lat: 10.3555, lng: 107.0985 },
          { name: 'Phường 9', lat: 10.3685, lng: 107.0985 },
          { name: 'Phường Thắng Nhất', lat: 10.3785, lng: 107.1085 },
          { name: 'Phường Thắng Nhì', lat: 10.3685, lng: 107.0785 },
          { name: 'Phường Rạch Dừa', lat: 10.3885, lng: 107.1185 },
        ],
      },
      {
        name: 'TP. Bà Rịa',
        lat: 10.4950,
        lng: 107.1685,
        wards: [
          { name: 'Phường Phước Trung', lat: 10.4950, lng: 107.1685 },
          { name: 'Phường Phước Hiệp', lat: 10.5015, lng: 107.1715 },
          { name: 'Phường Phước Nguyên', lat: 10.5085, lng: 107.1785 },
          { name: 'Phường Long Toàn', lat: 10.4915, lng: 107.1855 },
        ],
      },
      {
        name: 'TX. Phú Mỹ',
        lat: 10.6015,
        lng: 107.0515,
        wards: [
          { name: 'Phường Phú Mỹ', lat: 10.6015, lng: 107.0515 },
          { name: 'Phường Hắc Dịch', lat: 10.6385, lng: 107.1085 },
          { name: 'Phường Mỹ Xuân', lat: 10.6285, lng: 107.0315 },
          { name: 'Xã Tóc Tiên', lat: 10.5815, lng: 107.1185 },
        ],
      },
    ],
  },
  {
    name: 'Tây Ninh',
    lat: 11.3093,
    lng: 106.1065,
    districts: [
      {
        name: 'TX. Trảng Bàng',
        lat: 11.0393,
        lng: 106.3565,
        wards: [
          { name: 'Phường Trảng Bàng', lat: 11.0393, lng: 106.3565 }, // Cửa hàng Trảng Bàng (TBA)
          { name: 'Phường An Tịnh', lat: 11.0255, lng: 106.3815 },
          { name: 'Phường Gia Lộc', lat: 11.0515, lng: 106.3685 },
          { name: 'Phường An Hòa', lat: 11.0185, lng: 106.3315 },
        ],
      },
      {
        name: 'TP. Tây Ninh',
        lat: 11.3093,
        lng: 106.1065,
        wards: [
          { name: 'Phường 1', lat: 11.3093, lng: 106.1065 },
          { name: 'Phường 2', lat: 11.3015, lng: 106.1115 },
          { name: 'Phường 3', lat: 11.3185, lng: 106.1015 },
          { name: 'Phường Hiệp Ninh', lat: 11.3115, lng: 106.1255 },
        ],
      },
      {
        name: 'TX. Hòa Thành',
        lat: 11.2615,
        lng: 106.1385,
        wards: [
          { name: 'Phường Long Hoa', lat: 11.2615, lng: 106.1385 },
          { name: 'Phường Long Thành Trung', lat: 11.2515, lng: 106.1485 },
        ],
      },
      {
        name: 'Huyện Gò Dầu',
        lat: 11.1515,
        lng: 106.2615,
        wards: [
          { name: 'Thị trấn Gò Dầu', lat: 11.1515, lng: 106.2615 },
        ],
      },
    ],
  },
  {
    name: 'Cần Thơ',
    lat: 10.0402,
    lng: 105.7501,
    districts: [
      {
        name: 'Quận Ninh Kiều',
        lat: 10.0402,
        lng: 105.7501,
        wards: [
          { name: 'Phường An Khánh', lat: 10.0402, lng: 105.7501 }, // Cửa hàng Ninh Kiều (CTH)
          { name: 'Phường Tân An', lat: 10.0355, lng: 105.7885 },
          { name: 'Phường An Cư', lat: 10.0385, lng: 105.7785 },
          { name: 'Phường Xuân Khánh', lat: 10.0285, lng: 105.7715 },
          { name: 'Phường Hưng Lợi', lat: 10.0215, lng: 105.7655 },
          { name: 'Phường Cái Khế', lat: 10.0515, lng: 105.7855 },
        ],
      },
      {
        name: 'Quận Bình Thủy',
        lat: 10.0685,
        lng: 105.7315,
        wards: [
          { name: 'Phường Bình Thủy', lat: 10.0685, lng: 105.7315 },
          { name: 'Phường Trà Nóc', lat: 10.0985, lng: 105.7015 },
        ],
      },
      {
        name: 'Quận Cái Răng',
        lat: 9.9985,
        lng: 105.7685,
        wards: [
          { name: 'Phường Lê Bình', lat: 9.9985, lng: 105.7685 },
          { name: 'Phường Hưng Thạnh', lat: 10.0115, lng: 105.7815 },
        ],
      },
    ],
  },
  {
    name: 'Hà Nội',
    lat: 21.0285,
    lng: 105.8542,
    districts: [
      {
        name: 'Quận Ba Đình',
        lat: 21.0345,
        lng: 105.8285,
        wards: [{ name: 'Phường Điện Biên' }, { name: 'Phường Đội Cấn' }, { name: 'Phường Kim Mã' }, { name: 'Phường Liễu Giai' }],
      },
      {
        name: 'Quận Hoàn Kiếm',
        lat: 21.0305,
        lng: 105.8525,
        wards: [{ name: 'Phường Hàng Bạc' }, { name: 'Phường Hàng Bài' }, { name: 'Phường Tràng Tiền' }],
      },
      {
        name: 'Quận Cầu Giấy',
        lat: 21.0315,
        lng: 105.7955,
        wards: [{ name: 'Phường Dịch Vọng' }, { name: 'Phường Mai Dịch' }, { name: 'Phường Quan Hoa' }],
      },
      {
        name: 'Quận Đống Đa',
        lat: 21.0185,
        lng: 105.8285,
        wards: [{ name: 'Phường Cát Linh' }, { name: 'Phường Láng Hạ' }, { name: 'Phường Ô Chợ Dừa' }],
      },
    ],
  },
  {
    name: 'Đà Nẵng',
    lat: 16.0544,
    lng: 108.2022,
    districts: [
      {
        name: 'Quận Hải Châu',
        lat: 16.0544,
        lng: 108.2022,
        wards: [{ name: 'Phường Hải Châu 1' }, { name: 'Phường Hải Châu 2' }, { name: 'Phường Thạch Thang' }],
      },
      {
        name: 'Quận Thanh Khê',
        lat: 16.0615,
        lng: 108.1815,
        wards: [{ name: 'Phường Tam Thuận' }, { name: 'Phường Thanh Khê Đông' }],
      },
    ],
  },
  // Các tỉnh thành mở rộng khác của Việt Nam
  { name: 'Long An', lat: 10.5333, lng: 106.4000, districts: [{ name: 'TP. Tân An', lat: 10.5333, lng: 106.4000, wards: [{ name: 'Phường 1' }, { name: 'Phường 2' }] }] },
  { name: 'Tiền Giang', lat: 10.3544, lng: 106.3644, districts: [{ name: 'TP. Mỹ Tho', lat: 10.3544, lng: 106.3644, wards: [{ name: 'Phường 1' }, { name: 'Phường 2' }] }] },
  { name: 'Bến Tre', lat: 10.2415, lng: 106.3755, districts: [{ name: 'TP. Bến Tre', lat: 10.2415, lng: 106.3755, wards: [{ name: 'Phường An Hội' }] }] },
  { name: 'Vĩnh Long', lat: 10.2533, lng: 105.9722, districts: [{ name: 'TP. Vĩnh Long', lat: 10.2533, lng: 105.9722, wards: [{ name: 'Phường 1' }] }] },
  { name: 'An Giang', lat: 10.3833, lng: 105.4167, districts: [{ name: 'TP. Long Xuyên', lat: 10.3833, lng: 105.4167, wards: [{ name: 'Phường Mỹ Bình' }] }] },
  { name: 'Kiên Giang', lat: 10.0167, lng: 105.0833, districts: [{ name: 'TP. Rạch Giá', lat: 10.0167, lng: 105.0833, wards: [{ name: 'Phường Vĩnh Thanh' }] }, { name: 'TP. Phú Quốc', lat: 10.2899, lng: 103.9840, wards: [{ name: 'Phường Dương Đông' }, { name: 'Phường An Thới' }] }] },
  { name: 'Đồng Tháp', lat: 10.4500, lng: 105.6333, districts: [{ name: 'TP. Cao Lãnh', lat: 10.4500, lng: 105.6333, wards: [{ name: 'Phường 1' }] }, { name: 'TP. Sa Đéc', lat: 10.2974, lng: 105.7594, wards: [{ name: 'Phường 1' }] }] },
  { name: 'Bình Phước', lat: 11.7500, lng: 106.9000, districts: [{ name: 'TP. Đồng Xoài', lat: 11.5333, lng: 106.8833, wards: [{ name: 'Phường Tân Phú' }] }] },
  { name: 'Lâm Đồng', lat: 11.9404, lng: 108.4583, districts: [{ name: 'TP. Đà Lạt', lat: 11.9404, lng: 108.4583, wards: [{ name: 'Phường 1' }, { name: 'Phường 2' }] }, { name: 'TP. Bảo Lộc', lat: 11.5478, lng: 107.8086, wards: [{ name: 'Phường 1' }] }] },
  { name: 'Khánh Hòa', lat: 12.2388, lng: 109.1967, districts: [{ name: 'TP. Nha Trang', lat: 12.2388, lng: 109.1967, wards: [{ name: 'Phường Lộc Thọ' }] }, { name: 'TP. Cam Ranh', lat: 11.9214, lng: 109.1591, wards: [{ name: 'Phường Cam Phú' }] }] },
  { name: 'Bình Thuận', lat: 10.9333, lng: 108.1000, districts: [{ name: 'TP. Phan Thiết', lat: 10.9333, lng: 108.1000, wards: [{ name: 'Phường Đức Nghĩa' }] }] },
  { name: 'Hải Phòng', lat: 20.8449, lng: 106.6881, districts: [{ name: 'Quận Hồng Bàng', lat: 20.8654, lng: 106.6713, wards: [{ name: 'Phường Hoàng Văn Thụ' }] }, { name: 'Quận Ngô Quyền', lat: 20.8583, lng: 106.6974, wards: [{ name: 'Phường Cầu Đất' }] }] },
  { name: 'Bắc Giang', lat: 21.2731, lng: 106.1946, districts: [{ name: 'TP. Bắc Giang', lat: 21.2731, lng: 106.1946, wards: [{ name: 'Phường Ngô Quyền' }] }] },
  { name: 'Bắc Kạn', lat: 22.1473, lng: 105.8348, districts: [{ name: 'TP. Bắc Kạn', lat: 22.1473, lng: 105.8348, wards: [{ name: 'Phường Đức Xuân' }] }] },
  { name: 'Bạc Liêu', lat: 9.2941, lng: 105.7278, districts: [{ name: 'TP. Bạc Liêu', lat: 9.2941, lng: 105.7278, wards: [{ name: 'Phường 1' }] }] },
  { name: 'Bắc Ninh', lat: 21.1861, lng: 106.0763, districts: [{ name: 'TP. Bắc Ninh', lat: 21.1861, lng: 106.0763, wards: [{ name: 'Phường Tiền An' }] }] },
  { name: 'Bình Định', lat: 13.7830, lng: 109.2197, districts: [{ name: 'TP. Quy Nhơn', lat: 13.7830, lng: 109.2197, wards: [{ name: 'Phường Lê Hồng Phong' }] }] },
  { name: 'Cà Mau', lat: 9.1769, lng: 105.1524, districts: [{ name: 'TP. Cà Mau', lat: 9.1769, lng: 105.1524, wards: [{ name: 'Phường 5' }] }] },
  { name: 'Cao Bằng', lat: 22.6666, lng: 106.2639, districts: [{ name: 'TP. Cao Bằng', lat: 22.6666, lng: 106.2639, wards: [{ name: 'Phường Hợp Giang' }] }] },
  { name: 'Đắk Lắk', lat: 12.6667, lng: 108.0500, districts: [{ name: 'TP. Buôn Ma Thuột', lat: 12.6667, lng: 108.0500, wards: [{ name: 'Phường Thắng Lợi' }] }] },
  { name: 'Đắk Nông', lat: 12.0042, lng: 107.6875, districts: [{ name: 'TP. Gia Nghĩa', lat: 12.0042, lng: 107.6875, wards: [{ name: 'Phường Nghĩa Đức' }] }] },
  { name: 'Điện Biên', lat: 21.3833, lng: 103.0167, districts: [{ name: 'TP. Điện Biên Phủ', lat: 21.3833, lng: 103.0167, wards: [{ name: 'Phường Mường Thanh' }] }] },
  { name: 'Gia Lai', lat: 13.9833, lng: 108.0000, districts: [{ name: 'TP. Pleiku', lat: 13.9833, lng: 108.0000, wards: [{ name: 'Phường Tây Sơn' }] }] },
  { name: 'Hà Giang', lat: 22.8233, lng: 104.9839, districts: [{ name: 'TP. Hà Giang', lat: 22.8233, lng: 104.9839, wards: [{ name: 'Phường Trần Phú' }] }] },
  { name: 'Hà Nam', lat: 20.5456, lng: 105.9122, districts: [{ name: 'TP. Phủ Lý', lat: 20.5456, lng: 105.9122, wards: [{ name: 'Phường Minh Khai' }] }] },
  { name: 'Hà Tĩnh', lat: 18.3433, lng: 105.9058, districts: [{ name: 'TP. Hà Tĩnh', lat: 18.3433, lng: 105.9058, wards: [{ name: 'Phường Bắc Hà' }] }] },
  { name: 'Hải Dương', lat: 20.9372, lng: 106.3144, districts: [{ name: 'TP. Hải Dương', lat: 20.9372, lng: 106.3144, wards: [{ name: 'Phường Trần Phú' }] }] },
  { name: 'Hậu Giang', lat: 9.7844, lng: 105.4700, districts: [{ name: 'TP. Vị Thanh', lat: 9.7844, lng: 105.4700, wards: [{ name: 'Phường 1' }] }] },
  { name: 'Hòa Bình', lat: 20.8167, lng: 105.3383, districts: [{ name: 'TP. Hòa Bình', lat: 20.8167, lng: 105.3383, wards: [{ name: 'Phường Phương Lâm' }] }] },
  { name: 'Hưng Yên', lat: 20.6500, lng: 106.0500, districts: [{ name: 'TP. Hưng Yên', lat: 20.6500, lng: 106.0500, wards: [{ name: 'Phường Lê Lợi' }] }] },
  { name: 'Kon Tum', lat: 14.3500, lng: 108.0000, districts: [{ name: 'TP. Kon Tum', lat: 14.3500, lng: 108.0000, wards: [{ name: 'Phường Quyết Thắng' }] }] },
  { name: 'Lai Châu', lat: 22.3956, lng: 103.4683, districts: [{ name: 'TP. Lai Châu', lat: 22.3956, lng: 103.4683, wards: [{ name: 'Phường Tân Phong' }] }] },
  { name: 'Lạng Sơn', lat: 21.8536, lng: 106.7578, districts: [{ name: 'TP. Lạng Sơn', lat: 21.8536, lng: 106.7578, wards: [{ name: 'Phường Chi Lăng' }] }] },
  { name: 'Lào Cai', lat: 22.4856, lng: 103.9708, districts: [{ name: 'TP. Lào Cai', lat: 22.4856, lng: 103.9708, wards: [{ name: 'Phường Cốc Lếu' }] }] },
  { name: 'Nam Định', lat: 20.4333, lng: 106.1833, districts: [{ name: 'TP. Nam Định', lat: 20.4333, lng: 106.1833, wards: [{ name: 'Phường Trần Hưng Đạo' }] }] },
  { name: 'Nghệ An', lat: 18.6733, lng: 105.6814, districts: [{ name: 'TP. Vinh', lat: 18.6733, lng: 105.6814, wards: [{ name: 'Phường Quang Trung' }] }] },
  { name: 'Ninh Bình', lat: 20.2539, lng: 105.9750, districts: [{ name: 'TP. Ninh Bình', lat: 20.2539, lng: 105.9750, wards: [{ name: 'Phường Đông Thành' }] }] },
  { name: 'Ninh Thuận', lat: 11.5667, lng: 108.9833, districts: [{ name: 'TP. Phan Rang - Tháp Chàm', lat: 11.5667, lng: 108.9833, wards: [{ name: 'Phường Kinh Dinh' }] }] },
  { name: 'Phú Thọ', lat: 21.3228, lng: 105.4019, districts: [{ name: 'TP. Việt Trì', lat: 21.3228, lng: 105.4019, wards: [{ name: 'Phường Tiên Cát' }] }] },
  { name: 'Phú Yên', lat: 13.0881, lng: 109.3097, districts: [{ name: 'TP. Tuy Hòa', lat: 13.0881, lng: 109.3097, wards: [{ name: 'Phường 1' }] }] },
  { name: 'Quảng Bình', lat: 17.4686, lng: 106.6225, districts: [{ name: 'TP. Đồng Hới', lat: 17.4686, lng: 106.6225, wards: [{ name: 'Phường Đồng Mỹ' }] }] },
  { name: 'Quảng Nam', lat: 15.5667, lng: 108.4833, districts: [{ name: 'TP. Tam Kỳ', lat: 15.5667, lng: 108.4833, wards: [{ name: 'Phường An Mỹ' }] }, { name: 'TP. Hội An', lat: 15.8801, lng: 108.3380, wards: [{ name: 'Phường Minh An' }] }] },
  { name: 'Quảng Ngãi', lat: 15.1206, lng: 108.7922, districts: [{ name: 'TP. Quảng Ngãi', lat: 15.1206, lng: 108.7922, wards: [{ name: 'Phường Nguyễn Nghiêm' }] }] },
  { name: 'Quảng Ninh', lat: 20.9500, lng: 107.0833, districts: [{ name: 'TP. Hạ Long', lat: 20.9500, lng: 107.0833, wards: [{ name: 'Phường Bạch Đằng' }] }] },
  { name: 'Quảng Trị', lat: 16.8167, lng: 107.1000, districts: [{ name: 'TP. Đông Hà', lat: 16.8167, lng: 107.1000, wards: [{ name: 'Phường 1' }] }] },
  { name: 'Sóc Trăng', lat: 9.6000, lng: 105.9800, districts: [{ name: 'TP. Sóc Trăng', lat: 9.6000, lng: 105.9800, wards: [{ name: 'Phường 1' }] }] },
  { name: 'Sơn La', lat: 21.3283, lng: 103.9147, districts: [{ name: 'TP. Sơn La', lat: 21.3283, lng: 103.9147, wards: [{ name: 'Phường Chiềng Lề' }] }] },
  { name: 'Thái Bình', lat: 20.4500, lng: 106.3333, districts: [{ name: 'TP. Thái Bình', lat: 20.4500, lng: 106.3333, wards: [{ name: 'Phường Bồ Xuyên' }] }] },
  { name: 'Thái Nguyên', lat: 21.5928, lng: 105.8442, districts: [{ name: 'TP. Thái Nguyên', lat: 21.5928, lng: 105.8442, wards: [{ name: 'Phường Phan Đình Phùng' }] }] },
  { name: 'Thanh Hóa', lat: 19.8000, lng: 105.7667, districts: [{ name: 'TP. Thanh Hóa', lat: 19.8000, lng: 105.7667, wards: [{ name: 'Phường Điện Biên' }] }] },
  { name: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909, districts: [{ name: 'TP. Huế', lat: 16.4637, lng: 107.5909, wards: [{ name: 'Phường Vĩnh Ninh' }] }] },
  { name: 'Trà Vinh', lat: 9.9347, lng: 106.3456, districts: [{ name: 'TP. Trà Vinh', lat: 9.9347, lng: 106.3456, wards: [{ name: 'Phường 1' }] }] },
  { name: 'Tuyên Quang', lat: 21.8233, lng: 105.2144, districts: [{ name: 'TP. Tuyên Quang', lat: 21.8233, lng: 105.2144, wards: [{ name: 'Phường Tân Quang' }] }] },
  { name: 'Vĩnh Phúc', lat: 21.3089, lng: 105.6044, districts: [{ name: 'TP. Vĩnh Yên', lat: 21.3089, lng: 105.6044, wards: [{ name: 'Phường Ngô Quyền' }] }] },
  { name: 'Yên Bái', lat: 21.7167, lng: 104.8667, districts: [{ name: 'TP. Yên Bái', lat: 21.7167, lng: 104.8667, wards: [{ name: 'Phường Yên Ninh' }] }] },
];

/**
 * Lấy danh sách tên tỉnh/thành phố
 */
export function getProvinceNames(): string[] {
  return VIETNAM_ADDRESSES.map((p) => p.name);
}

/**
 * Lấy danh sách quận/huyện theo tên tỉnh
 */
export function getDistrictsByProvince(provinceName: string): DistrictItem[] {
  if (!provinceName) return [];
  const p = VIETNAM_ADDRESSES.find(
    (item) => item.name.toLowerCase() === provinceName.toLowerCase() ||
              item.name.toLowerCase().includes(provinceName.toLowerCase()) ||
              provinceName.toLowerCase().includes(item.name.toLowerCase())
  );
  return p ? p.districts : [];
}

/**
 * Lấy danh sách phường/xã theo tỉnh và quận
 */
export function getWardsByDistrict(provinceName: string, districtName: string): WardItem[] {
  const districts = getDistrictsByProvince(provinceName);
  if (!districtName) return [];
  const dClean = districtName.toLowerCase().replace(/^(quận|huyện|thị xã|tp\.?|thành phố)\s+/i, '').trim();
  const d = districts.find((item) => {
    const itemClean = item.name.toLowerCase().replace(/^(quận|huyện|thị xã|tp\.?|thành phố)\s+/i, '').trim();
    return item.name.toLowerCase() === districtName.toLowerCase() || itemClean === dClean;
  });
  return d ? d.wards : [];
}

/**
 * Tìm tọa độ GPS tối ưu nhất từ bộ 3: Tỉnh, Quận, Phường
 */
export function findPreciseCoordinates(
  provinceName?: string | null,
  districtName?: string | null,
  wardName?: string | null
): { lat: number; lng: number } | null {
  if (!provinceName) return null;

  const pClean = provinceName.toLowerCase().replace(/^(tỉnh|tp\.?|thành phố)\s+/i, '').trim();
  const p = VIETNAM_ADDRESSES.find((item) => {
    const itemClean = item.name.toLowerCase().replace(/^(tỉnh|tp\.?|thành phố)\s+/i, '').trim();
    return item.name.toLowerCase() === provinceName.toLowerCase() || itemClean === pClean;
  });
  if (!p) return null;

  if (districtName) {
    const dClean = districtName.toLowerCase().replace(/^(quận|huyện|thị xã|tp\.?|thành phố)\s+/i, '').trim();
    const d = p.districts.find((item) => {
      const itemClean = item.name.toLowerCase().replace(/^(quận|huyện|thị xã|tp\.?|thành phố)\s+/i, '').trim();
      return item.name.toLowerCase() === districtName.toLowerCase() || itemClean === dClean;
    });

    if (d) {
      if (wardName) {
        const wClean = wardName.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '').trim();
        // Ưu tiên 1: Trùng khớp chính xác
        let w = d.wards.find((item) => item.name.toLowerCase() === wardName.toLowerCase());
        // Ưu tiên 2: Trùng số hoặc tên sau khi loại bỏ tiền tố Phường/Xã
        if (!w) {
          w = d.wards.find((item) => {
            const itemClean = item.name.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '').trim();
            return itemClean === wClean;
          });
        }
        // Ưu tiên 3: Tìm trong danh sách bí danh/tên cũ (aliases)
        if (!w) {
          w = d.wards.find((item) =>
            item.aliases?.some((alias) => {
              const aClean = alias.toLowerCase().replace(/^(phường|xã|thị trấn|p\.?)\s*/i, '').trim();
              return alias.toLowerCase() === wardName.toLowerCase() || aClean === wClean;
            })
          );
        }
        if (w && w.lat && w.lng) {
          return { lat: w.lat, lng: w.lng };
        }
      }
      return { lat: d.lat, lng: d.lng };
    }
  }

  return { lat: p.lat, lng: p.lng };
}
