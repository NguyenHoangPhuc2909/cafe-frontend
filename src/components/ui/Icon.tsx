import type { ComponentProps } from 'react';
import {
  AppstoreOutlined, ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  CheckOutlined, ClearOutlined, ClockCircleOutlined, CloseCircleOutlined,
  CloseOutlined, DisconnectOutlined, CoffeeOutlined, DeleteOutlined,
  DesktopOutlined, DoubleLeftOutlined, DoubleRightOutlined, ExportOutlined, EyeOutlined, EyeInvisibleOutlined, FileSearchOutlined, FilterOutlined, HistoryOutlined, LeftOutlined,
  IdcardOutlined, InboxOutlined, LogoutOutlined, MinusOutlined, PhoneOutlined,
  PlusOutlined, ProfileOutlined, QrcodeOutlined, QuestionCircleOutlined,
  ReadOutlined, ReloadOutlined, RightOutlined, SafetyCertificateOutlined,
  SearchOutlined, SettingOutlined, ShopOutlined, ShoppingCartOutlined,
  ShoppingOutlined, SlidersOutlined, StopOutlined, UserOutlined, WalletOutlined,
} from '@ant-design/icons';

// Keep existing semantic names in the screens while using one library throughout.
// Named imports let the production build include only the icons used here.
const icons = {
  coffee: CoffeeOutlined,
  local_cafe: CoffeeOutlined,
  shopping_bag: ShoppingOutlined,
  add_shopping_cart: ShoppingCartOutlined,
  restaurant_menu: ReadOutlined,
  receipt_long: ProfileOutlined,
  table_restaurant: AppstoreOutlined,
  restaurant: ShopOutlined,
  point_of_sale: DesktopOutlined,
  inventory_2: InboxOutlined,
  settings: SettingOutlined,
  history: HistoryOutlined,
  schedule: ClockCircleOutlined,
  person: UserOutlined,
  badge: IdcardOutlined,
  logout: LogoutOutlined,
  search: SearchOutlined,
  search_off: FileSearchOutlined,
  add: PlusOutlined,
  remove: MinusOutlined,
  close: CloseOutlined,
  cancel: CloseCircleOutlined,
  delete: DeleteOutlined,
  delete_sweep: ClearOutlined,
  arrow_forward: ArrowRightOutlined,
  arrow_back: ArrowLeftOutlined,
  arrow_downward: ArrowDownOutlined,
  external_link: ExportOutlined,
  refresh: ReloadOutlined,
  tune: SlidersOutlined,
  payments: WalletOutlined,
  call: PhoneOutlined,
  qr_code_2: QrcodeOutlined,
  cloud_off: DisconnectOutlined,
  verified_user: SafetyCertificateOutlined,
  block: StopOutlined,
  help: QuestionCircleOutlined,
  check: CheckOutlined,
  chevron_right: RightOutlined,
  chevron_left: LeftOutlined,
  first_page: DoubleLeftOutlined,
  last_page: DoubleRightOutlined,
  filter: FilterOutlined,
  eye: EyeOutlined,
  eye_off: EyeInvisibleOutlined,
};

type IconProps = Omit<ComponentProps<typeof CoffeeOutlined>, 'ref'> & { name: string };

export default function Icon({ name, className = '', ...props }: IconProps) {
  const Component = icons[name as keyof typeof icons] ?? QuestionCircleOutlined;
  return <Component {...props} className={`app-icon ${className}`} aria-hidden="true" />;
}
