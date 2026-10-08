import type { Product } from '../types/product';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cà Phê Muối Tuyết',
    description: 'Espresso nguyên chất hòa quyện lớp kem muối biển béo ngậy ngọt dịu gây nghiện.',
    price: 49000,
    imageUrl: '/images/ca_phe_muoi_tuyet.png',
    category: 'Cà phê Việt',
    badge: 'Best Seller',
    origin: 'Lâm Đồng',
  },
  {
    id: '2',
    name: 'Cold Brew Cam Vàng',
    description: 'Cà phê ủ lạnh kết hợp nước ép cam vàng tươi và hương lá hương thảo thanh khiết.',
    price: 58000,
    imageUrl: '/images/cold_brew_cam_vang.png',
    category: 'Ủ lạnh 18h',
    badge: 'Signature',
    origin: 'Arabica Cầu Đất',
  },
  {
    id: '3',
    name: 'Trà Sữa Oolong Nướng',
    description: 'Lá trà oolong sấy củi thơm khói kết hợp sữa thanh trùng nguyên kem béo êm dịu.',
    price: 55000,
    imageUrl: '/images/tra_sua_oolong.png',
    category: 'Trà Thượng Hạng',
    badge: 'Mới',
    origin: 'Bảo Lộc',
  },
  {
    id: '4',
    name: 'Trà Sen Vàng Kem Cheese',
    description: 'Trà hạt sen thanh mát đi kèm hạt sen bùi dẻo và foam phô mai New Zealand sánh mịn.',
    price: 62000,
    imageUrl: '/images/tra_sen_vang_cheese.png',
    category: 'Thảo Mộc',
    badge: 'Đặc sản',
    origin: 'Huế',
  },
  {
    id: '5',
    name: 'Sinh Tố Bơ Dừa Non',
    description: 'Bơ sáp 034 xay nhuyễn cùng sữa dừa hữu cơ và cùi dừa xiêm giòn ngọt.',
    price: 68000,
    imageUrl: '/images/sinh_to_bo_dua.png',
    category: 'Sinh tố tươi',
    origin: 'Đắk Lắk',
  },
  {
    id: '6',
    name: 'Caramel Macchiato',
    description: 'Tầng sữa tươi béo ngậy cùng sốt caramel thủ công hòa lẫn espresso đậm vị.',
    price: 59000,
    imageUrl: '/images/caramel_macchiato.png',
    category: 'Espresso Bar',
    badge: 'Cổ Điển',
    origin: 'Ý & Việt Blend',
  },
  {
    id: '7',
    name: 'Espresso Đơn Thuần',
    description: 'Espresso nguyên chất chiết xuất từ hạt Robusta Fine rang mộc, đậm đà, hậu vị ngọt dịu.',
    price: 35000,
    imageUrl: '/images/caramel_macchiato.png',
    category: 'Cà phê Việt',
    origin: 'Đắk Lắk',
  },
  {
    id: '8',
    name: 'Trà Đào Cam Sả',
    description: 'Trà xanh ủ lạnh kết hợp đào tươi, cam vàng và sả chanh thơm mát.',
    price: 52000,
    imageUrl: '/images/cold_brew_cam_vang.png',
    category: 'Trà Thượng Hạng',
    badge: 'Mới',
    origin: 'Thái Nguyên',
  },
  {
    id: '9',
    name: 'Matcha Latte Uji',
    description: 'Bột matcha Nhật Bản grade A hòa tan cùng sữa tươi nguyên kem béo ngậy thanh khiết.',
    price: 65000,
    imageUrl: '/images/tra_sua_oolong.png',
    category: 'Trà Thượng Hạng',
    badge: 'Signature',
    origin: 'Uji, Nhật Bản',
  },
  {
    id: '10',
    name: 'Sinh Tố Dâu Tươi',
    description: 'Dâu tây Đà Lạt xay mịn cùng sữa chua Hy Lạp và sữa tươi, chua ngọt hài hoà.',
    price: 60000,
    imageUrl: '/images/sinh_to_bo_dua.png',
    category: 'Sinh tố tươi',
    origin: 'Đà Lạt',
  },
  {
    id: '11',
    name: 'Cà Phê Sữa Đá Việt',
    description: 'Cà phê phin truyền thống nhỏ giọt chậm, pha cùng sữa đặc và đá vụn thơm béo.',
    price: 39000,
    imageUrl: '/images/ca_phe_muoi_tuyet.png',
    category: 'Cà phê Việt',
    badge: 'Best Seller',
    origin: 'Buôn Ma Thuột',
  },
  {
    id: '12',
    name: 'Brown Sugar Latte',
    description: 'Espresso tươi hòa quyện đường nâu caramel thủ công và sữa oat milk bùi ngậy.',
    price: 62000,
    imageUrl: '/images/caramel_macchiato.png',
    category: 'Espresso Bar',
    origin: 'Colombia Blend',
  },
];

export const CATEGORY_MAP: Record<string, string> = {
  'Tất cả':            '',
  'Cà phê':            'cà phê',
  'Trà sữa':           'trà',
  'Nước ép & Sinh tố': 'sinh tố',
  'Bánh & Tráng miệng':'bánh',
  'Đồ uống đá xay':   'đá xay',
};

export const CATEGORIES = [
  { label: 'Tất cả',              icon: 'local_cafe'         },
  { label: 'Cà phê',             icon: 'coffee'              },
  { label: 'Trà sữa',            icon: 'emoji_food_beverage' },
  { label: 'Nước ép & Sinh tố',  icon: 'smoothie'            },
  { label: 'Bánh & Tráng miệng', icon: 'cake'                },
  { label: 'Đồ uống đá xay',     icon: 'ac_unit'             },
];

export type SortMode = 'default' | 'price_asc' | 'price_desc' | 'name_asc';

export const SORT_LABELS: Record<SortMode, string> = {
  default:    'Mặc định',
  price_asc:  'Giá tăng dần',
  price_desc: 'Giá giảm dần',
  name_asc:   'Tên A → Z',
};

export const SORT_CYCLE: SortMode[] = ['default', 'price_asc', 'price_desc', 'name_asc'];

export const INITIAL_CART = [
  {
    id: '1',
    name: 'Cà Phê Trứng Hoàng Kim Hà Nội',
    options: ['Size M', '50% Ngọt', 'Uống Nóng', '+ Gấp đôi kem trứng (+18k)', '+ Hạnh nhân nướng giòn (+10k)'],
    note: 'Đánh bông kem thật kỹ, để riêng bột quế',
    price: 93000,
    quantity: 1,
    imageUrl: '/images/ca_phe_trung.png',
    badge: 'Signature',
    origin: 'Espresso Robusta Đắk Lắk & Kem Trứng Tươi',
  },
  {
    id: '2',
    name: 'Cold Brew Cam Vàng Rosemary',
    options: ['Size L (+8k)', '30% Ngọt', 'Đá riêng cốc giấy'],
    price: 58000,
    quantity: 1,
    imageUrl: '/images/cold_brew_cam_vang.png',
    badge: 'Ủ lạnh 18h',
    badgeBg: 'bg-tertiary-container/80 text-on-tertiary-container',
    origin: 'Hạt Arabica Cầu Đất & Tinh Thảo Mộc',
  },
  {
    id: '3',
    name: 'Croissant Bơ Pháp Hạnh Nhân',
    options: ['Hâm nóng giòn thơm', 'Nướng bơ mộc tươi'],
    price: 45000,
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
    badge: 'Lò nướng mộc',
    badgeBg: 'bg-secondary-container text-on-secondary-container',
    origin: 'Bơ Thượng Hạng Elle & Vire Pháp',
  },
];

export const UPSELL_ITEMS = [
  {
    id: 'u1',
    name: 'Ethiopia Yirgacheffe Drip Bag',
    desc: 'Túi lọc tiện lợi • Nốt hoa quả',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80',
  },
  {
    id: 'u2',
    name: 'Bánh Canelé Vani Bordeaux',
    desc: 'Vỏ giòn caramel • Nhân mềm',
    price: 38000,
    imageUrl: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=300&q=80',
  },
];
