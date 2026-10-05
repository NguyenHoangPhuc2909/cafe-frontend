import React from "react";
import type { Product } from "../../types/product";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onClick?: (product: Product) => void;
}

const ProductCard:
  React.FC<ProductCardProps> = ({ product, onAddToCart, onClick }) => {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getBadgeColor = (badge?: string | null) => {
      switch (badge) {
        case 'Best Seller': return 'bg-primary-container text-on-primary';
        case 'Signature': return 'bg-secondary text-on-secondary';
        case 'Đặc sản': return 'bg-primary-container text-on-primary';
        default: return 'bg-surface-container-highest text-primary';
      }
    };

    return (
      <div onClick={() => onClick && onClick(product)}
        className="group bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high hover:border-outline-variant transition-all duration-200 hover:shadow-[0_8px_24px_rgba(74,46,27,0.08)] flex flex-col justify-between">
        <div className="space-y-3">
          {/* Ảnh và Nhãn nổi bật */}
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-container-low">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              src={product.imageUrl}
              alt={product.name}
            />
            {product.badge && (
              <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full font-label-sm font-bold shadow-sm ${getBadgeColor(product.badge)}`}>
                {product.badge}
              </span>
            )}
            <button className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur hover:bg-white text-on-surface-variant hover:text-error flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[18px]">favorite</span>
            </button>
          </div>
          {/* Thông tin món */}
          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="text-[10px] font-label-sm uppercase tracking-wider text-secondary font-bold">
                {product.category}
              </span>
              {product.origin && (
                <>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span className="text-[10px] font-label-sm text-on-surface-variant">{product.origin}</span>
                </>
              )}
            </div>
            <h4 className="font-headline-sm font-bold text-primary group-hover:text-secondary transition-colors line-clamp-1">
              {product.name}
            </h4>
            <p className="font-body-sm text-on-surface-variant line-clamp-2 mt-1">
              {product.description}
            </p>
          </div>
        </div>
        {/* Giá & Nút Thêm vào giỏ */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-surface-container-high">
          <div>
            <span className="font-body-sm text-outline">Giá chỉ</span>
            <div className="font-headline-sm font-bold text-primary">{formatPrice(product.price)}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Chặn sự kiện lan lên div cha
              if (onAddToCart) onAddToCart(product);
            }}
            className="w-10 h-10 rounded-full bg-primary-container hover:bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-transform duration-150"
            title="Thêm vào giỏ hàng"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </div>
    );
  }

export default ProductCard;