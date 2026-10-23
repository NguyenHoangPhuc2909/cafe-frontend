import React from 'react';
import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/format";
import { PRODUCT_PLACEHOLDER } from '../../utils/products';

interface BaseProductCardProps {
  product: Product;
  /** 'customer' variant shows wishlist and one add button. 'staff' variant shows quick-add and customize buttons. */
  variant?: 'customer' | 'staff';
  /** Extra badge like cart quantity for staff */
  cartQty?: number;
  onCardClick?: (product: Product) => void;
  onActionPrimary?: (product: Product) => void;
  onActionSecondary?: (product: Product) => void;
}

const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'bg-primary text-on-primary',
  'Signature':   'bg-secondary text-on-secondary',
  'Đặc sản':     'bg-tertiary-container text-on-tertiary-container',
  'Mới':         'bg-green-600 text-white',
  'Cổ Điển':     'bg-surface-container-highest text-on-surface-variant',
  'Cổ điển':     'bg-surface-container-highest text-on-surface-variant',
};

const BaseProductCard: React.FC<BaseProductCardProps> = ({
  product, variant = 'customer', cartQty = 0, onCardClick, onActionPrimary, onActionSecondary
}) => {
  const badgeClass = product.badge ? (BADGE_STYLES[product.badge] ?? 'bg-surface-container-highest text-primary') : '';

  const isStaff = variant === 'staff';

  return (
    <div
      onClick={() => onCardClick?.(product)}
      className={`group relative bg-surface-container-lowest rounded-2xl border overflow-hidden
        flex flex-col cursor-pointer transition-all duration-200
        ${cartQty > 0
          ? 'border-primary/60 ring-2 ring-primary/20 shadow-md'
          : 'border-surface-container-high hover:border-outline-variant/60 hover:shadow-md'
        }`}
    >
      {/* ── Cart qty badge (Staff) ── */}
      {isStaff && cartQty > 0 && (
        <div className="absolute top-2 right-2 z-20 bg-primary text-on-primary
          text-[10px] font-label-caps font-bold px-2 py-0.5 rounded-full shadow-md">
          ×{cartQty}
        </div>
      )}

      {/* ── Image ── */}
      <div className="relative w-full overflow-hidden bg-surface-container-low"
        style={{ paddingTop: '75%' /* 4:3 ratio */ }}>
        <img
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={product.imageUrl || PRODUCT_PLACEHOLDER}
          alt={product.name}
          loading="lazy"
          onError={e => {
            if (!e.currentTarget.src.endsWith(PRODUCT_PLACEHOLDER)) e.currentTarget.src = PRODUCT_PLACEHOLDER;
          }}
        />
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge */}
        {product.badge && (
          <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full
            text-[10px] font-label-caps font-bold shadow-sm tracking-wide ${badgeClass}`}>
            {product.badge}
          </span>
        )}

      </div>

      {/* ── Body ── */}
      <div className={`flex flex-col p-3 ${isStaff ? 'gap-1' : 'gap-1.5'}`}>
        {/* Category + Origin */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-label-caps text-secondary font-bold uppercase tracking-wide truncate">
            {product.category}
          </span>
          {product.origin && (
            <>
              <span className="w-1 h-1 rounded-full bg-outline-variant shrink-0" />
              <span className="text-[10px] font-label-caps text-outline truncate">{product.origin}</span>
            </>
          )}
        </div>

        {/* Name */}
        <h4 className={`font-headline-sm font-bold text-primary group-hover:text-secondary
          transition-colors duration-200 line-clamp-2 ${isStaff ? 'text-[14px] leading-snug' : 'mb-0.5 text-[13px] sm:text-base'}`}>
          <button className="text-left" onClick={event => { event.stopPropagation(); onCardClick?.(product); }}>{product.name}</button>
        </h4>

        {/* Description */}
        <p className={`font-body-sm text-on-surface-variant line-clamp-2 leading-relaxed
          ${isStaff ? 'text-[11px]' : 'text-[12.5px] flex-1'}`}>
          {product.description}
        </p>

        {/* ── Price + Actions ── */}
        <div className={`flex items-center justify-between border-t border-surface-container-high
          ${isStaff ? 'pt-2 mt-1' : 'pt-3 mt-2'}`}>
          <div>
            <span className={`text-[9px] font-label-caps text-outline block leading-none ${isStaff ? 'mb-0.5' : 'mb-1'}`}>
              Giá chỉ
            </span>
            <span className={`font-headline-sm font-bold leading-none
              ${isStaff && cartQty > 0 ? 'text-primary' : 'text-on-surface'}
              ${isStaff ? 'text-[14px]' : 'text-[13px] sm:text-base'}`}>
              {formatCurrency(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isStaff ? (
              <>
                {/* Customize */}
                <button
                  onClick={(e) => { e.stopPropagation(); onActionSecondary?.(product); }}
                  className="w-8 h-8 rounded-xl border border-outline-variant/60 bg-surface-container
                    hover:bg-surface-container-high text-on-surface-variant hover:text-primary
                    flex items-center justify-center transition-all active:scale-90"
                  title="Tuỳ chỉnh size, đá, đường…"
                >
                  <span className="material-symbols-outlined text-[15px]">tune</span>
                </button>
                {/* Quick add */}
                <button
                  onClick={(e) => { e.stopPropagation(); onActionPrimary?.(product); }}
                  className="w-8 h-8 rounded-xl bg-primary-container hover:bg-primary
                    text-on-primary flex items-center justify-center shadow-sm
                    active:scale-90 transition-all duration-150"
                  title="Thêm nhanh"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </>
            ) : (
              /* Add to Cart (Customer) */
              <button
                onClick={(e) => { e.stopPropagation(); onActionPrimary?.(product); }}
                aria-label={`Thêm ${product.name} vào giỏ`}
                className="w-11 h-11 shrink-0 rounded-xl bg-primary-container hover:bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-all duration-150"
                title="Thêm vào giỏ hàng"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseProductCard;
