export type SortMode = 'default' | 'price_asc' | 'price_desc' | 'name_asc';

export const SORT_LABELS: Record<SortMode, string> = {
  default: 'Mặc định',
  price_asc: 'Giá tăng dần',
  price_desc: 'Giá giảm dần',
  name_asc: 'Tên A → Z',
};

export const SORT_CYCLE: SortMode[] = ['default', 'price_asc', 'price_desc', 'name_asc'];
