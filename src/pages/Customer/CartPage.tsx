import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Dữ liệu giả lập Giỏ hàng
const INITIAL_CART = [
  {
    id: '1',
    name: 'Cà Phê Muối Tuyết',
    options: 'Size L, Ít đá, Ngọt vừa',
    price: 49000,
    quantity: 2,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeUYhLbq2mY7iZbSnkPUmiQjOK7laZVcACp4rWAOgSVRZ4J8lyoi_XDj5JTkBPYw8ib3idO8pBlIVZxQl886ZicCI9IFwy51MJFR02_EvarMlMw0WJtNCnFdvHvgvYkMN7l_qs62XAA4P-Xs47pQ3JxlOISiB8T1GK9hSw-bTtGl4CJD0valH9XXmxRDSPMlkzyIZtCwhLhG_CpKInRVcj8-uaz5p8gwjp2gAKxAZf29kTac2wMxfvyA'
  },
  {
    id: '2',
    name: 'Cold Brew Cam Vàng',
    options: 'Size M, Thêm topping Thạch',
    price: 58000,
    quantity: 1,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDBdKIkDyWJk0kbKZu31-OllHaN0UDaknNYDjsQLMxC5ODOk8XHbstv1tuWt0ipm9RdjbFfdaCF3ytNzMuLz2-3dBs6LVL9Nj97VQd2WBEKm5vPigYcqLDvdwF7PnSqcLFf04FRkB89fUBI2_LUpYx1TW2zmB07Bi5JHn5rExdHYVOdPHVN16Ix-5Hvyvom3OJeaX1AKD18MdEbZvGSzCbvaOceDlBYo7YOagCQe3XY1JrEaBufUU4vw'
  }
];

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState(INITIAL_CART);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Tính tổng tiền
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // Tạm thời miễn phí dịch vụ

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Tiêu đề & Nút quay lại */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">Giỏ hàng của bạn</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Cột trái: Danh sách sản phẩm */}
        <div className="w-full lg:w-2/3 space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high">
              <img src={item.imageUrl} alt={item.name} className="w-24 h-24 rounded-xl object-cover" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-headline-sm font-bold text-primary">{item.name}</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">{item.options}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="font-headline-sm text-primary font-bold">{formatPrice(item.price)}</div>
                  {/* Nút tăng giảm số lượng */}
                  <div className="flex items-center space-x-3 bg-surface-container-low rounded-full px-2 py-1">
                    <button className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white transition-colors">
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <span className="font-label-md font-semibold w-4 text-center">{item.quantity}</span>
                    <button className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white transition-colors">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Link to="/" className="inline-flex items-center space-x-2 text-secondary hover:text-primary transition-colors font-label-md py-4">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Thêm món khác</span>
          </Link>
        </div>

        {/* Cột phải: Khung thanh toán & Info Bàn */}
        <div className="w-full lg:w-1/3 space-y-6 sticky top-24">
          
          {/* Card Thông tin bàn */}
          <div className="bg-primary-fixed-dim/20 rounded-2xl p-5 border border-primary-fixed">
            <div className="flex items-center space-x-3 text-primary mb-2">
              <span className="material-symbols-outlined">qr_code_scanner</span>
              <h3 className="font-label-lg font-bold">Đặt tại bàn</h3>
            </div>
            <div className="text-headline-md font-bold text-primary mb-1">Bàn 06</div>
            <p className="text-body-sm text-on-surface-variant">Chi nhánh Tràng Tiền, Hoàn Kiếm, Hà Nội</p>
          </div>

          {/* Card Hóa đơn */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm">
            <h3 className="font-headline-sm font-bold text-primary mb-4 pb-4 border-b border-surface-container-high">Tóm tắt đơn hàng</h3>
            
            <div className="space-y-3 text-body-md text-on-surface-variant mb-6">
              <div className="flex justify-between">
                <span>Tạm tính ({cartItems.length} món)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí dịch vụ</span>
                <span>Miễn phí</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-6 pt-4 border-t border-surface-container-high">
              <span className="font-label-lg font-bold text-primary">Tổng cộng</span>
              <span className="font-headline-md font-bold text-primary">{formatPrice(total)}</span>
            </div>

            <button className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-lg font-bold py-4 rounded-full transition-colors flex items-center justify-center space-x-2">
              <span>Tiến Hành Đặt Đồ</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>

          {/* Nút gọi hỗ trợ */}
          <button className="w-full bg-surface-container-low hover:bg-surface-container text-primary font-label-md py-3 rounded-full transition-colors flex items-center justify-center space-x-2 border border-outline-variant/40">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>Gọi Nhân viên hỗ trợ</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default CartPage;
