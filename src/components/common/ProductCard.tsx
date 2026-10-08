import React from 'react';
import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/format";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onClick?: (product: Product) => void;
}

const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'bg-primary text-on-primary',
  'Signature':   'bg-secondary text-on-secondary',
  'Đặc sản':     'bg-tertiary-container text-on-tertiary-container',
  'Mới':         'bg-green-100 text-green-800',
  'Cổ Điển':     'bg-surface-container-highest text-on-surface-variant',
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick }) => {
  const badgeClass = product.badge ? (BADGE_STYLES[product.badge] ?? 'bg-surface-container-highest text-primary') : '';

  return (
    <div
      onClick={() => onClick?.(product)}
      className="group relative bg-surface-container-lowest rounded-2xl border border-surface-container-high hover:border-outline-variant/60 card-hover overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-low">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge */}
        {product.badge && (
          <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-label-sm font-bold tracking-wide shadow-sm ${badgeClass}`}>
            {product.badge}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur hover:bg-white text-on-surface-variant hover:text-error flex items-center justify-center transition-all active:scale-90 shadow-sm"
        >
          <span className="material-symbols-outlined text-[17px]">favorite</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Meta */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-label-sm uppercase tracking-wider text-secondary font-bold">
            {product.category}
          </span>
          {product.origin && (
            <>
              <span className="w-1 h-1 rounded-full bg-outline-variant shrink-0" />
              <span className="text-[10px] font-label-sm text-outline truncate">{product.origin}</span>
            </>
          )}
        </div>

        {/* Name */}
        <h4 className="font-headline-sm font-bold text-primary group-hover:text-secondary transition-colors duration-200 line-clamp-1 mb-1">
          {product.name}
        </h4>

        {/* Description */}
        <p className="font-body-sm text-[12.5px] text-on-surface-variant line-clamp-2 leading-relaxed flex-1">
          {product.description}
        </p>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container-high">
          <div>
            <span className="text-[10px] font-label-sm text-outline">Giá chỉ</span>
            <div className="font-headline-sm font-bold text-primary leading-tight">
              {formatCurrency(product.price)}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="w-10 h-10 rounded-xl bg-primary-container hover:bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-all duration-150 focus-ring"
            title="Thêm vào giỏ hàng"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;