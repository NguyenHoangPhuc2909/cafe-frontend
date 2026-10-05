import React, { useState } from "react";
import ProductCard from "../../components/common/ProductCard";
import type { Product } from "../../types/product";

const MOCK_PRODUCTS: Product[] = [
{
    id: '1',
    name: 'Cà Phê Muối Tuyết',
    description: 'Espresso nguyên chất hòa quyện lớp kem muối biển béo ngậy ngọt dịu gây nghiện.',
    price: 49000,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeUYhLbq2mY7iZbSnkPUmiQjOK7laZVcACp4rWAOgSVRZ4J8lyoi_XDj5JTkBPYw8ib3idO8pBlIVZxQl886ZicCI9IFwy51MJFR02_EvarMlMw0WJtNCnFdvHvgvYkMN7l_qs62XAA4P-Xs47pQ3JxlOISiB8T1GK9hSw-bTtGl4CJD0valH9XXmxRDSPMlkzyIZtCwhLhG_CpKInRVcj8-uaz5p8gwjp2gAKxAZf29kTac2wMxfvyA',
    category: 'Cà phê Việt',
    badge: 'Best Seller'
  },
  {
    id: '2',
    name: 'Cold Brew Cam Vàng',
    description: 'Cà phê ủ lạnh kết hợp nước ép cam vàng tươi và hương lá hương thảo thanh khiết.',
    price: 58000,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDBdKIkDyWJk0kbKZu31-OllHaN0UDaknNYDjsQLMxC5ODOk8XHbstv1tuWt0ipm9RdjbFfdaCF3ytNzMuLz2-3dBs6LVL9Nj97VQd2WBEKm5vPigYcqLDvdwF7PnSqcLFf04FRkB89fUBI2_LUpYx1TW2zmB07Bi5JHn5rExdHYVOdPHVN16Ix-5Hvyvom3OJeaX1AKD18MdEbZvGSzCbvaOceDlBYo7YOagCQe3XY1JrEaBufUU4vw',
    category: 'Ủ lạnh 18h',
    badge: 'Signature'
  },
  {
    id: '3',
    name: 'Trà Sữa Oolong Nướng',
    description: 'Lá trà oolong sấy củi thơm khói kết hợp sữa thanh trùng nguyên kem béo êm dịu.',
    price: 55000,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh4WfY2rwksh7wLkhAY3Iat1dmN4vVu07-BRO954KMpjGkz2DnDxeLjUBNcYxL4rFwTj29DabfSELrkJeZYw0MXP83hbO8fgYwUJwehOXfat_3nE12reMXWkuulaXDzqZ-2kX1Tap6-t2kdj4ZcJpFwzUG3lPhtGBjifmwpJHz2duJ2npP9fe1YmVn0T0r_H6_uXgoZnG7IfQZCeiWfwrXZgv1awEUoO-IOmsl0dqrTbi9hanyJ-PJNQ',
    category: 'Trà Thượng Hạng',
    badge: 'Mới'
  },
  {
    id: '4',
    name: 'Sinh Tố Bơ Dừa Non',
    description: 'Bơ sáp 034 xay nhuyễn cùng sữa dừa hữu cơ và cùi dừa xiêm giòn ngọt.',
    price: 68000,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrRpvQN9c9FXA_wBwcSUq_UbP55By_e9SOzADW-qyqNKj1XnxhnjFh2sGgKzFQnfSvSklh3-QOY7E52TDJyjTygaQZCqxOujWbLvaVKF2tkpVlLzFRgGk-nO4r3GA9GKNpPlFfzTz4AOZBgb6dYusg4lbmpHYiwCRnWJVVvtfbXzZnnkbaJDIdhnb3Hin4lfR3hNKC5LNI0zyIyJitWEPK-YrpYL8ydAP-KyZeClLSPqzlixeskoq6OQ',
    category: 'Sinh tố tươi'
  }
];

const CustomerMenu: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const categories = ['Tất cả', 'Cà phê Việt', 'Ủ lạnh 18h', 'Trà Thượng Hạng', 'Sinh tố tươi'];

  const filteredProducts = activeCategory === 'Tất cả' ? MOCK_PRODUCTS : MOCK_PRODUCTS.filter(p =>
    p.category === activeCategory);
  
    return (
      <div className="space-y-8">
      {/* Tiêu đề & Cụm Thanh Category Filter */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">Thực Đơn Đồ Uống</h1>
          <p className="font-body-sm text-on-surface-variant">Pha chế tươi thủ công khi nhận order, giữ trọn hương vị nguyên bản.</p>
        </div>
        
        <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 custom-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-label-lg transition-all duration-150 shrink-0 ${
                activeCategory === cat
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-secondary hover:text-primary border border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {/* Grid hiển thị danh sách các món ăn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={() => alert(`Đã thêm ${product.name}`)} 
          />
        ))}
      </div>
    </div>
    );
};

export default CustomerMenu;
