import { Link } from "react-router-dom";
import Icon from "../../components/ui/Icon";

export default function AdminReportsPage() {
  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <div>
          <h1>Báo cáo quản trị</h1>
          <p>Tổng hợp hoạt động kinh doanh của quán.</p>
        </div>
      </header>
      <div className="ui-panel staff-empty-state">
        <span className="staff-empty-state__icon">
          <Icon name="chart" />
        </span>
        <h2>Báo cáo tổng hợp chưa khả dụng</h2>
        <p>
          Bạn có thể theo dõi các đơn đang phục vụ và kiểm tra tồn kho trong lúc
          chờ chức năng này.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/admin/orders" className="ui-button ui-button--primary">
            Xem đơn hàng
          </Link>
          <Link to="/admin/inventory" className="ui-button">
            Kiểm tra tồn kho
          </Link>
        </div>
      </div>
    </section>
  );
}
