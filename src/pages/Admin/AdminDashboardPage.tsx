import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useStaffAuth } from '../../hooks/useStaffAuth';

const taskGroups = [
  { title: 'Thực đơn & đội ngũ', items: [
    { path: '/admin/products', icon: 'restaurant_menu', title: 'Thực đơn', description: 'Chăm chút từng món, giá bán và công thức.', action: 'Quản lý thực đơn' },
    { path: '/admin/employees', icon: 'person', title: 'Đội ngũ', description: 'Quản lý thông tin và tài khoản nhân viên.', action: 'Xem nhân viên' },
  ] },
  { title: 'Không gian & phục vụ', items: [
    { path: '/admin/tables', icon: 'table_restaurant', title: 'Không gian quán', description: 'Theo dõi bàn và các phiên phục vụ.', action: 'Xem sơ đồ bàn' },
    { path: '/admin/orders', icon: 'history', title: 'Lịch sử đơn hàng', description: 'Tra cứu các đơn đã ghi nhận và trạng thái thanh toán.', action: 'Xem lịch sử đơn' },
  ] },
  { title: 'Kho & báo cáo', items: [
    { path: '/admin/inventory', icon: 'inventory_2', title: 'Kho của quán', description: 'Kiểm tra nguyên liệu và hàng đóng gói.', action: 'Kiểm tra tồn kho' },
    { path: '/admin/reports', icon: 'chart', title: 'Báo cáo', description: 'Xem tình trạng khả dụng của báo cáo tổng hợp.', action: 'Xem mục báo cáo' },
  ] },
];

export default function AdminDashboardPage() {
  const { session } = useStaffAuth();
  return <div className="admin-dashboard">
    <header className="admin-welcome"><div><p>L’Atelier Café · Quản lý quán</p><h1>Tổng quan quản trị</h1><span>Xin chào {session?.username ?? 'bạn'}. Chọn công việc bạn muốn bắt đầu.</span></div></header>
    <div className="admin-task-groups">{taskGroups.map((group, index) => <section key={group.title} className="admin-task-group" aria-labelledby={`task-group-${index}`}>
      <h2 id={`task-group-${index}`}>{group.title}</h2>
      <nav aria-label={group.title} className="admin-shortcuts">{group.items.map(item => <Link key={item.path} to={item.path} className="admin-shortcut"><span className="admin-shortcut__icon"><Icon name={item.icon} /></span><h3>{item.title}</h3><p>{item.description}</p><span className="admin-shortcut__action">{item.action}<Icon name="arrow_forward" /></span></Link>)}</nav>
    </section>)}</div>
  </div>;
}
