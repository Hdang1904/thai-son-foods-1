import { Pool } from 'pg';

const ACTIVE_STORES = [
  {
    id: 'store_TCH',
    code: 'TCH',
    name: 'Cửa Hàng Tân Chánh Hiệp (Quận 12)',
    address: '113/6 TCH03, Tân Chánh Hiệp, Quận 12, TP. HCM',
    phone: '0911812433',
    province: 'Hồ Chí Minh',
    district: 'Quận 12',
    ward: 'Tân Chánh Hiệp',
    latitude: 10.871933,
    longitude: 106.625151,
    map_url: 'https://maps.app.goo.gl/swy4KzdWixtdsV378',
    region: 'SG1',
    group_code: 'SG1.1',
    notes: null,
  },
  {
    id: 'store_TN',
    code: 'TN',
    name: 'Cửa Hàng Tân Nhơn (Gò Vấp)',
    address: '208/28 Lê Đức Thọ, P6, Quận Gò Vấp, TP. HCM',
    phone: '0911812432',
    province: 'Hồ Chí Minh',
    district: 'Gò Vấp',
    ward: 'Phường 6',
    latitude: 10.83707,
    longitude: 106.68115,
    map_url: 'https://maps.app.goo.gl/rpHC5LarRRu2DhbD8',
    region: 'SG1',
    group_code: 'SG1.2',
    notes: null,
  },
  {
    id: 'store_THB',
    code: 'THB',
    name: 'Cửa Hàng Phổ Quang (Tân Bình)',
    address: '2c Phổ Quang, P2, Q. Tân Bình, TP. HCM',
    phone: '0911812434',
    province: 'Hồ Chí Minh',
    district: 'Tân Bình',
    ward: 'Phường 2',
    latitude: 10.803028,
    longitude: 106.667668,
    map_url: 'https://maps.app.goo.gl/ywn9qazZnfUrPFR3A',
    region: 'SG1',
    group_code: 'SG1.2',
    notes: null,
  },
  {
    id: 'store_D1',
    code: 'D1',
    name: 'Cửa Hàng Ung Văn Khiêm (Bình Thạnh)',
    address: '255 Ung Văn Khiêm, P25, Bình Thạnh, TP. HCM',
    phone: '0911812437',
    province: 'Hồ Chí Minh',
    district: 'Bình Thạnh',
    ward: 'Phường 25',
    latitude: 10.804418,
    longitude: 106.721872,
    map_url: 'https://maps.app.goo.gl/cTy2JsbfJqkqzoJ96',
    region: 'SG2',
    group_code: 'SG2.1',
    notes: null,
  },
  {
    id: 'store_NTB',
    code: 'NTB',
    name: 'Cửa Hàng Nguyễn Thái Bình (Quận 1)',
    address: '157 Nguyễn Thái Bình, P. Nguyễn Thái Bình, Quận 1, TP. HCM',
    phone: '0911812435',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Nguyễn Thái Bình',
    latitude: 10.76809,
    longitude: 106.69854,
    map_url: 'https://maps.app.goo.gl/QPEnvYSQkxJcQnPo7',
    region: 'SG2',
    group_code: 'SG2.2',
    notes: null,
  },
  {
    id: 'store_TTH',
    code: 'TTH',
    name: 'Cửa Hàng Huỳnh Tấn Phát (Quận 7)',
    address: '858 Huỳnh Tấn Phát, Tân Phú, Quận 7, TP. HCM',
    phone: '0911812417',
    province: 'Hồ Chí Minh',
    district: 'Quận 7',
    ward: 'Tân Phú',
    latitude: 10.7286801,
    longitude: 106.7323373,
    map_url: 'https://maps.app.goo.gl/BCx2xSFQaFFk73nW9',
    region: 'SG2',
    group_code: 'SG2.2',
    notes: null,
  },
  {
    id: 'store_DN',
    code: 'DN',
    name: 'Cửa Hàng Cư Xá Đồng Tiến (Quận 10)',
    address: '2c Cư Xá Đồng Tiến, P14, Quận 10, TP. HCM',
    phone: '0911812428',
    province: 'Hồ Chí Minh',
    district: 'Quận 10',
    ward: 'Phường 14',
    latitude: 10.7702923,
    longitude: 106.6645227,
    map_url: 'https://maps.app.goo.gl/qcPRs3P3zcTYv7K99',
    region: 'SG3',
    group_code: 'SG3.1',
    notes: null,
  },
  {
    id: 'store_NB',
    code: 'NB',
    name: 'Cửa Hàng Cao Lỗ (Quận 8)',
    address: '25 Đường 152A Cao Lỗ, P4, Quận 8, TP. HCM',
    phone: '0911812482',
    province: 'Hồ Chí Minh',
    district: 'Quận 8',
    ward: 'Phường 4',
    latitude: 10.737222,
    longitude: 106.674985,
    map_url: 'https://maps.app.goo.gl/MYuHJzpGac5gmLRf6',
    region: 'SG3',
    group_code: 'SG3.1',
    notes: '29/10/2025 CH NB sẽ dời sang MB mới',
  },
  {
    id: 'store_RD',
    code: 'RD',
    name: 'Cửa Hàng Chiến Lược (Bình Tân)',
    address: '95/44 Chiến Lược, P. Bình Trị Đông, Bình Tân, TP. HCM',
    phone: '0911812418',
    province: 'Hồ Chí Minh',
    district: 'Bình Tân',
    ward: 'Bình Trị Đông',
    latitude: 10.759817,
    longitude: 106.618845,
    map_url: 'https://maps.app.goo.gl/oQxkjLhWvJLZV2ty5',
    region: 'SG3',
    group_code: 'SG3.2',
    notes: null,
  },
  {
    id: 'store_NH',
    code: 'NH',
    name: 'Cửa Hàng Vườn Lài (Tân Phú)',
    address: '298/4 Vườn Lài, P Phú Thọ Hòa, Quận Tân Phú, TP. HCM',
    phone: '0911812425',
    province: 'Hồ Chí Minh',
    district: 'Tân Phú',
    ward: 'Phú Thọ Hòa',
    latitude: 10.7882898,
    longitude: 106.6251124,
    map_url: 'https://maps.app.goo.gl/dPfkW2gVxy9k55TD7',
    region: 'SG3',
    group_code: 'SG3.2',
    notes: null,
  },
  {
    id: 'store_TBA',
    code: 'TBA',
    name: 'Cửa Hàng Trảng Bàng (Tây Ninh)',
    address: '28B đường Hai Mươi Hai Tháng Mười Hai, Lộc Du, Trảng Bàng, Tây Ninh',
    phone: '0836937498',
    province: 'Tây Ninh',
    district: 'Trảng Bàng',
    ward: 'Lộc Du',
    latitude: 11.039348,
    longitude: 106.356546,
    map_url: 'https://maps.app.goo.gl/wK9pDd6g6keZoS9y6',
    region: 'SG4',
    group_code: 'SG4',
    notes: '18/9/2025 đổi sang mb mới + đổi tên',
  },
  {
    id: 'store_XA',
    code: 'XA',
    name: 'Cửa Hàng Củ Chi (TP. HCM)',
    address: '1D Đường số 10A, Tổ 1, khu phố 2, Thị trấn Củ Chi, Củ Chi, TP. HCM',
    phone: '0911812473',
    province: 'Hồ Chí Minh',
    district: 'Củ Chi',
    ward: 'Thị trấn Củ Chi',
    latitude: 10.9712462,
    longitude: 106.4928858,
    map_url: 'https://maps.app.goo.gl/z3mxiC8w7Dam8ww96',
    region: 'SG4',
    group_code: 'SG4',
    notes: null,
  },
  {
    id: 'store_MP',
    code: 'MP',
    name: 'Cửa Hàng Mỹ Phước (Bến Cát)',
    address: 'Đường Ne8 An Hòa, P. Hòa Lợi, TX. Bến Cát, Bình Dương',
    phone: '0911812411',
    province: 'Bình Dương',
    district: 'Bến Cát',
    ward: 'Hòa Lợi',
    latitude: 11.096264,
    longitude: 106.661671,
    map_url: 'https://maps.app.goo.gl/q7Eo8N3PkwmbvLvN7',
    region: 'BD1',
    group_code: 'BD1',
    notes: 'Cách Bưu điện KCN MP3 4km',
  },
  {
    id: 'store_ME',
    code: 'ME',
    name: 'Cửa Hàng An Phú (Thuận An)',
    address: '75/5 Kp4, Chu Văn An, P. An Phú, Thuận An, Bình Dương',
    phone: '0911812412',
    province: 'Bình Dương',
    district: 'Thuận An',
    ward: 'An Phú',
    latitude: 10.95227,
    longitude: 106.72959,
    map_url: 'https://maps.app.goo.gl/ahR9EagvECePEkfEA',
    region: 'BD1',
    group_code: 'BD1',
    notes: 'Cách Aeon BD 5km',
  },
  {
    id: 'store_TDM',
    code: 'TDM',
    name: 'Cửa Hàng Thủ Dầu Một (Bình Dương)',
    address: '278 Đ. Nguyễn Văn Lộng, Phường Chánh Mỹ, Thủ Dầu Một, Bình Dương',
    phone: '0911812405',
    province: 'Bình Dương',
    district: 'Thủ Dầu Một',
    ward: 'Chánh Mỹ',
    latitude: 10.991353,
    longitude: 106.644095,
    map_url: 'https://maps.app.goo.gl/cndAGSNB2VWgUpCv8',
    region: 'BD1',
    group_code: 'BD1',
    notes: 'Cách KDL Đại Nam 6km',
  },
  {
    id: 'store_TB',
    code: 'TB',
    name: 'Cửa Hàng Bình Chiểu (Thủ Đức)',
    address: '952/2a Tỉnh Lộ 43, Kp1, Bình Chiểu, TP. Thủ Đức, TP. HCM',
    phone: '0911812407',
    province: 'Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    ward: 'Bình Chiểu',
    latitude: 10.882625,
    longitude: 106.729694,
    map_url: 'https://maps.app.goo.gl/rwyTghTHVvp8sQc2A',
    region: 'BD2',
    group_code: 'BD2.1',
    notes: 'Cách cầu vượt Gò Dưa 1.5km',
  },
  {
    id: 'store_LX',
    code: 'LX',
    name: 'Cửa Hàng Linh Tây (Thủ Đức)',
    address: 'Ki Ốt Số 6 Số Nhà 100, Tổ 10, Hẻm 96, Đường Số 9, Linh Tây, TP. Thủ Đức, TP. HCM',
    phone: '0911812413',
    province: 'Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    ward: 'Linh Tây',
    latitude: 10.861756,
    longitude: 106.755823,
    map_url: 'https://maps.app.goo.gl/mLpFLhrc4yMHk5BSA',
    region: 'BD2',
    group_code: 'BD2.2',
    notes: 'Từ đầu đường số 9 vô 200m',
  },
  {
    id: 'store_TD',
    code: 'TD',
    name: 'Cửa Hàng Tăng Nhơn Phú (Quận 9)',
    address: 'C20/3A Đường 449, Tăng Nhơn Phú A, Quận 9, TP. HCM',
    phone: '0911812404',
    province: 'Hồ Chí Minh',
    district: 'Quận 9',
    ward: 'Tăng Nhơn Phú A',
    latitude: 10.847883,
    longitude: 106.795298,
    map_url: 'https://maps.app.goo.gl/ezP3DNEK3eTpR7Da6',
    region: 'BD2',
    group_code: 'BD2.2',
    notes: 'Cách ngã tư Bình Thái 1km',
  },
  {
    id: 'store_AMA',
    code: 'AMA',
    name: 'Cửa Hàng Tân Hiệp (Biên Hòa)',
    address: 'C225 Tổ 16 Kp5, P. Tân Hiệp, Biên Hòa, Đồng Nai',
    phone: '0836937504',
    province: 'Đồng Nai',
    district: 'Biên Hòa',
    ward: 'Tân Hiệp',
    latitude: 10.960607,
    longitude: 106.870008,
    map_url: 'https://www.google.com/maps?q=10.9605172,106.8701467&z=14&t=m&mapclient=embed',
    region: 'DN1',
    group_code: 'DN1',
    notes: 'Cách BV ĐK ĐN 1.5km',
  },
  {
    id: 'store_LB',
    code: 'LB',
    name: 'Cửa Hàng Phước Tân (Đồng Nai)',
    address: '20 Nam Cao, Phường Phước Tân, TP. Biên Hòa, Đồng Nai',
    phone: '0836937503',
    province: 'Đồng Nai',
    district: 'Biên Hòa',
    ward: 'Phước Tân',
    latitude: 10.872386,
    longitude: 106.906211,
    map_url: 'https://maps.app.goo.gl/NuDYuo2KhWGARFZDA',
    region: 'DN1',
    group_code: 'DN1',
    notes: 'Cách cổng 11 4km, chợ Tân Mai 300m (Gộp LT và LB)',
  },
  {
    id: 'store_CM',
    code: 'CM',
    name: 'Cửa Hàng Cầu Xéo (Long Thành)',
    address: 'Nhà trọ số 8 - Tổ 35, Đinh Bộ Lĩnh, ấp Cầu Xéo, xã Long Thành, Đồng Nai',
    phone: '0911812559',
    province: 'Đồng Nai',
    district: 'Long Thành',
    ward: 'Cầu Xéo',
    latitude: 10.775101,
    longitude: 106.956833,
    map_url: 'https://maps.app.goo.gl/L6A7sWnpVEz9i5L9A?g_st=ipc',
    region: 'DN2',
    group_code: 'DN2',
    notes: 'dời sang mặt bằng mới từ ngày 08/01/2026',
  },
  {
    id: 'store_TRB',
    code: 'TRB',
    name: 'Cửa Hàng Trảng Bom (Đồng Nai)',
    address: '17A Huỳnh Văn Nghệ, Thị trấn Trảng Bom, Trảng Bom, Đồng Nai',
    phone: '0846937524',
    province: 'Đồng Nai',
    district: 'Trảng Bom',
    ward: 'Thị trấn Trảng Bom',
    latitude: 10.944366,
    longitude: 107.010477,
    map_url: 'https://maps.app.goo.gl/Wm15nNgFdY4QMecN7',
    region: 'DN2',
    group_code: 'DN2',
    notes: 'Cách Bưu điện huyện TRB 800m',
  },
  {
    id: 'store_CTH',
    code: 'CTH',
    name: 'Cửa Hàng Ninh Kiều (Cần Thơ)',
    address: 'Lô B4_01, Đường Số 3, Khu Tái Định Cư Trường Đh Y Dược, P. An Khánh, Q. Ninh Kiều, Cần Thơ',
    phone: '0836937481',
    province: 'Cần Thơ',
    district: 'Ninh Kiều',
    ward: 'An Khánh',
    latitude: 10.040215,
    longitude: 105.750067,
    map_url: 'https://maps.app.goo.gl/PLa38aaRj1bGytmw9',
    region: 'TINH',
    group_code: 'TINH',
    notes: null,
  },
  {
    id: 'store_XL',
    code: 'XL',
    name: 'Cửa Hàng Xuân Lộc (Đồng Nai)',
    address: '1367 Quốc lộ 1A, Ấp 4, Xuân Hưng, Xuân Lộc, Đồng Nai',
    phone: '0911812439',
    province: 'Đồng Nai',
    district: 'Xuân Lộc',
    ward: 'Xuân Hưng',
    latitude: 10.855265,
    longitude: 107.491809,
    map_url: 'https://www.google.com/maps/search/?api=1&query=1367+Qu%E1%BB%91c+l%E1%BB%99+1A+%E1%BA%A4p+4+Xu%C3%A2n+H%C6%B0ng+Xu%C3%A2n+L%E1%BB%99c+%C4%90%E1%BB%93ng+Nai',
    region: 'TINH',
    group_code: 'TINH',
    notes: null,
  },
  {
    id: 'store_VT',
    code: 'VT',
    name: 'Cửa Hàng Vũng Tàu (Bà Rịa - Vũng Tàu)',
    address: '324/16a Bình Giã, Nguyễn An Ninh, Tp. Vũng Tàu, Bà Rịa - Vũng Tàu',
    phone: '0911812472',
    province: 'Bà Rịa - Vũng Tàu',
    district: 'Tp. Vũng Tàu',
    ward: 'Nguyễn An Ninh',
    latitude: 10.361427,
    longitude: 107.094571,
    map_url: 'https://www.google.com/maps/search/?api=1&query=324%2F16a+B%C3%ACnh+Gi%C3%A3+Nguy%E1%BB%85n+An+Ninh+V%C5%A9ng+T%C3%A0u',
    region: 'TINH',
    group_code: 'TINH',
    notes: null,
  },
];

const WAREHOUSES = [
  {
    id: 'store_XBD',
    code: 'XBD',
    name: 'Xưởng Bình Dương (Kho Tổng)',
    address: '6/8 Khu Phố Đồng An 3, Phường Bình Hòa, Thị Xã Thuận An, Tỉnh Bình Dương',
    phone: '02871000472',
    province: 'Bình Dương',
    district: 'Thuận An',
    ward: 'Bình Hòa',
    latitude: 10.90554,
    longitude: 106.72946,
    map_url: 'https://www.google.com/maps/search/?api=1&query=6%2F8+Khu+Ph%E1%BB%91+%C4%90%E1%BB%93ng+An+3+B%C3%ACnh+H%C3%B2a+Thu%E1%BA%ADn+An',
    region: 'KHO',
    group_code: 'KHO',
    notes: 'Kho xưởng sản xuất',
    status: 2,
    is_active: false,
  },
  {
    id: 'store_XBC',
    code: 'XBC',
    name: 'Xưởng Bình Chánh (Kho Tổng)',
    address: 'Số 10, Đường số 14, Ấp 5, Xã Phong Phú, Huyện Bình Chánh, TP. HCM',
    phone: '02871000472',
    province: 'Hồ Chí Minh',
    district: 'Bình Chánh',
    ward: 'Phong Phú',
    latitude: 10.725792,
    longitude: 106.648624,
    map_url: 'https://www.google.com/maps/search/?api=1&query=S%E1%BB%91+10+%C4%90%C6%B0%E1%BB%9Dng+s%E1%BB%91+14+%E1%BA%A4p+5+Phong+Ph%C3%BA+B%C3%ACnh+Ch%C3%A1nh',
    region: 'KHO',
    group_code: 'KHO',
    notes: 'Kho xưởng sản xuất',
    status: 2,
    is_active: false,
  },
  {
    id: 'store_TAT',
    code: 'TAT',
    name: 'Xưởng Tóc Tiên (Kho Tổng)',
    address: 'Ấp 6, Tóc Tiên, TX. Phú Mỹ, Bà Rịa - Vũng Tàu',
    phone: '02871000472',
    province: 'Bà Rịa - Vũng Tàu',
    district: 'Phú Mỹ',
    ward: 'Tóc Tiên',
    latitude: 10.5512,
    longitude: 107.1352,
    map_url: 'https://www.google.com/maps/search/?api=1&query=%E1%BA%A4p+6+T%C3%B3c+Ti%C3%AAn+Ph%C3%BA+M%E1%BB%B9+B%C3%A0+R%E1%BB%8Ba+V%C5%A9ng+T%C3%A0u',
    region: 'KHO',
    group_code: 'KHO',
    notes: 'Kho xưởng sản xuất',
    status: 2,
    is_active: false,
  },
];

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Tsf@123@localhost:5432/WebTSF',
  });

  console.log('🔄 BẮT ĐẦU ĐỒNG BỘ 25 CỬA HÀNG ĐANG HOẠT ĐỘNG VÀO DATABASE WebTSF...\n');

  // 1. Vô hiệu hóa các cửa hàng test/dummy (adminCH1 -> adminCH5) và các cửa hàng đã đóng
  const dummyCodes = ['adminCH1', 'adminCH2', 'adminCH3', 'adminCH4', 'adminCH5'];
  const closedCodes = ['VL', 'HHT', 'CL', 'BD', 'LT'];

  console.log('1. Vô hiệu hóa các chi nhánh test và chi nhánh đã đóng...');
  await pool.query(
    `UPDATE stores SET is_active = false, status = 0, updated_at = CURRENT_TIMESTAMP WHERE code = ANY($1);`,
    [dummyCodes]
  );
  await pool.query(
    `UPDATE stores SET is_active = false, status = 0, updated_at = CURRENT_TIMESTAMP WHERE code = ANY($1);`,
    [closedCodes]
  );
  console.log(`   Đã vô hiệu hóa: ${dummyCodes.join(', ')} và ${closedCodes.join(', ')}`);

  // 2. Upsert 25 Cửa Hàng Bán Lẻ Đang Hoạt Động
  console.log('\n2. Upsert 25 Cửa Hàng Bán Lẻ Đang Hoạt Động...');
  for (const s of ACTIVE_STORES) {
    await pool.query(
      `INSERT INTO stores (
        id, code, name, address, phone, province, district, ward, 
        latitude, longitude, map_url, region, group_code, notes, 
        status, is_active, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1, true, CURRENT_TIMESTAMP)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        province = EXCLUDED.province,
        district = EXCLUDED.district,
        ward = EXCLUDED.ward,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        map_url = EXCLUDED.map_url,
        region = EXCLUDED.region,
        group_code = EXCLUDED.group_code,
        notes = EXCLUDED.notes,
        status = 1,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP;`,
      [
        s.id, s.code, s.name, s.address, s.phone, s.province, s.district, s.ward,
        s.latitude, s.longitude, s.map_url, s.region, s.group_code, s.notes,
      ]
    );
    console.log(`   ✅ [${s.code}] ${s.name} - SĐT: ${s.phone} - Tọa độ: ${s.latitude}, ${s.longitude}`);
  }

  // 3. Upsert 3 Kho Tổng / Xưởng Sản Xuất
  console.log('\n3. Upsert 3 Kho Tổng / Xưởng Sản Xuất...');
  for (const w of WAREHOUSES) {
    await pool.query(
      `INSERT INTO stores (
        id, code, name, address, phone, province, district, ward, 
        latitude, longitude, map_url, region, group_code, notes, 
        status, is_active, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        province = EXCLUDED.province,
        district = EXCLUDED.district,
        ward = EXCLUDED.ward,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        map_url = EXCLUDED.map_url,
        region = EXCLUDED.region,
        group_code = EXCLUDED.group_code,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;`,
      [
        w.id, w.code, w.name, w.address, w.phone, w.province, w.district, w.ward,
        w.latitude, w.longitude, w.map_url, w.region, w.group_code, w.notes,
        w.status, w.is_active,
      ]
    );
    console.log(`   🏭 [${w.code}] ${w.name}`);
  }

  // 4. Khởi tạo Tồn kho (store_inventory) cho toàn bộ 25 cửa hàng đang hoạt động
  console.log('\n4. Khởi tạo Tồn kho (store_inventory) cho 25 cửa hàng x 12 sản phẩm...');
  const prodRes = await pool.query('SELECT id, name FROM products WHERE is_active = true ORDER BY id ASC;');
  const activeProducts = prodRes.rows;
  console.log(`   Tìm thấy ${activeProducts.length} sản phẩm đang kinh doanh.`);

  let insertedCount = 0;
  for (const store of ACTIVE_STORES) {
    for (const prod of activeProducts) {
      const invId = `inv_${store.code}_${prod.id}`;
      // Nếu đã có tồn kho rồi thì giữ nguyên, nếu chưa có thì khởi tạo 100 chai
      const res = await pool.query(
        `INSERT INTO store_inventory (
          id, store_code, product_id, stock_quantity, reserved, safety_stock, updated_by, updated_at
        ) VALUES ($1, $2, $3, 100, 0, 0, 'system_sync', CURRENT_TIMESTAMP)
        ON CONFLICT (store_code, product_id) DO NOTHING;`,
        [invId, store.code, prod.id]
      );
      if (res.rowCount > 0) insertedCount++;
    }
  }
  console.log(`   Đã khởi tạo ${insertedCount} bản ghi tồn kho mới.`);

  // 5. Kiểm tra và in báo cáo kết quả
  const countRes = await pool.query(`
    SELECT 
      count(*) FILTER (WHERE is_active = true) as active_count,
      count(*) FILTER (WHERE is_active = false) as inactive_count,
      count(*) as total_count
    FROM stores;
  `);
  console.log('\n--- TỔNG KẾT BẢNG STORES ---');
  console.log(`Số chi nhánh đang hoạt động (is_active = true): ${countRes.rows[0].active_count} (Mục tiêu: 25)`);
  console.log(`Số chi nhánh không hoạt động / kho / test: ${countRes.rows[0].inactive_count}`);
  console.log(`Tổng số cửa hàng trong DB: ${countRes.rows[0].total_count}`);

  const activeStoresList = await pool.query(`
    SELECT code, name, phone, district, province, is_active, status 
    FROM stores 
    WHERE is_active = true 
    ORDER BY code ASC;
  `);
  console.log('\n--- DANH SÁCH 25 CỬA HÀNG ĐANG HOẠT ĐỘNG ---');
  console.table(activeStoresList.rows);

  const invSummary = await pool.query(`
    SELECT store_code, count(*) as products_count, sum(stock_quantity) as total_stock
    FROM store_inventory
    WHERE store_code = ANY($1)
    GROUP BY store_code
    ORDER BY store_code ASC;
  `, [ACTIVE_STORES.map(s => s.code)]);
  console.log(`\n--- TỒN KHO CỦA ${invSummary.rows.length} CHI NHÁNH HOẠT ĐỘNG ---`);
  console.table(invSummary.rows);

  await pool.end();
  console.log('\n🎉 ĐỒNG BỘ DỮ LIỆU CỬA HÀNG VÀ TỒN KHO THÀNH CÔNG RỰC RỠ!');
}

run().catch((err) => {
  console.error('Lỗi khi đồng bộ cửa hàng:', err);
  process.exit(1);
});
