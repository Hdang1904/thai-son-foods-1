'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface ProductItem {
  name: string;
  nameEn: string;
  slug: string;
}

interface CategoryGroup {
  title: string;
  href: string;
  items: ProductItem[];
}

const categoryTitles: Record<string, { vi: string; en: string }> = {
  'Sữa Hạt': { vi: 'Sữa Hạt', en: 'Nut Milk' },
  'Nước Giải Khát': { vi: 'Nước Giải Khát', en: 'Refreshments' },
  'Trà Sữa': { vi: 'Trà Sữa', en: 'Milk Tea' },
};

// 12 mã sản phẩm thực tế của website phân theo 3 danh mục chính
const productCategoryGroups: CategoryGroup[] = [
  {
    title: 'Sữa Hạt',
    href: '/#san-pham',
    items: [
      { name: 'Sữa Bắp Nếp Thái Sơn', nameEn: 'Thai Son Sticky Corn Milk', slug: 'sua-bap-nep-thai-son' },
      { name: 'Sữa Hạt Sen Mekong Xanh', nameEn: 'Mekong Green Lotus Seed Milk', slug: 'sua-hat-sen-mekong-xanh' },
      { name: 'Sữa Gạo Lứt Mekong Xanh', nameEn: 'Mekong Green Brown Rice Milk', slug: 'sua-gao-lut-mekong-xanh' },
      { name: 'Sữa Hạt Sen Lotus Yoo', nameEn: 'Lotus Yoo Lotus Seed Milk', slug: 'sua-hat-sen-lotus-yoo' },
      { name: 'Sữa Gạo Lứt Ohsawa Yoo', nameEn: 'Ohsawa Yoo Brown Rice Milk', slug: 'sua-gao-lut-ohsawa-yoo' },
    ],
  },
  {
    title: 'Nước Giải Khát',
    href: '/#san-pham',
    items: [
      { name: 'Nước Nha Đam Mủ Trôm', nameEn: 'Aloe Vera & Karaya Gum', slug: 'nha-dam-mu-trom-thai-son' },
      { name: 'Nước Táo Đỏ Hạt Chia', nameEn: 'Red Apple & Chia Seed', slug: 'tao-do-hat-chia-thai-son' },
      { name: 'Nước Sâm La Hán Hoa Cúc', nameEn: 'Monk Fruit & Chrysanthemum', slug: 'sam-la-han-hoa-cuc-thai-son' },
    ],
  },
  {
    title: 'Trà Sữa',
    href: '/#san-pham',
    items: [
      { name: 'Ciao Trà Sữa', nameEn: 'Ciao Milk Tea', slug: 'tra-sua-ciao' },
      { name: 'Ciao Matcha Trà Sữa', nameEn: 'Ciao Matcha Milk Tea', slug: 'matcha-tra-sua-ciao' },
      { name: 'Trà Sữa GO', nameEn: 'GO Milk Tea', slug: 'tra-sua-go' },
      { name: 'Trà Xanh GO', nameEn: 'GO Green Tea', slug: 'tra-xanh-go' },
    ],
  },
];

export default function CategorySidebar() {
  const { language } = useLanguage();

  return (
    <nav aria-label={language === 'en' ? 'Product Categories' : 'Danh mục sản phẩm'} className="w-full select-none">
      {/* Danh sách 3 nhóm danh mục rõ ràng, tương phản cao */}
      <div className="space-y-6">
        {productCategoryGroups.map((group) => (
          <div key={group.title} className="group/cat">
            {/* Tiêu đề nhóm danh mục: Font đậm, sắc nét, tương phản cao */}
            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-emerald-900/20">
              <span className="w-1.5 h-4 bg-[#1B5E3B] rounded-full shrink-0 shadow-2xs" />
              <h3 className="text-[14px] font-black uppercase tracking-wider text-[#0F2A1F] leading-tight cursor-default select-none">
                {categoryTitles[group.title]?.[language] || group.title}
              </h3>
            </div>

            {/* Danh sách các sản phẩm con: Cỡ chữ 14.5px sắc nét, màu chữ xanh đen đậm đà chống lóa/mờ trên nền kem */}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/san-pham/${item.slug}`}
                    className="group/item flex items-center justify-between text-[14px] min-[1800px]:text-[14.5px] font-semibold leading-snug text-[#1C2826] hover:text-[#1B5E3B] py-2 px-2.5 rounded-xl hover:bg-white hover:shadow-xs hover:border hover:border-emerald-200/80 transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-800/40 group-hover/item:bg-[#1B5E3B] group-hover/item:scale-125 transition-all shrink-0" />
                      <span className="leading-snug">
                        {language === 'en' ? item.nameEn : item.name}
                      </span>
                    </span>
                    <span className="text-[13px] text-[#1B5E3B] opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all font-bold shrink-0 ml-1">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
