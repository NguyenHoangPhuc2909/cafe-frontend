import Icon from '../ui/Icon';
import { Switch } from 'antd';
import type { Product } from '../../types/product';
import { formatCurrency } from '../../utils/format';
import { PRODUCT_PLACEHOLDER } from '../../utils/products';

interface BaseProductCardProps {
  product: Product;
  variant?: 'customer' | 'staff';
  cartQty?: number;
  onCardClick?: (product: Product) => void;
  onActionPrimary?: (product: Product) => void;
  onActionSecondary?: (product: Product) => void;
  onActiveChange?: (product: Product, active: boolean) => void;
  activeUpdating?: boolean;
  actionsDisabled?: boolean;
  activeDisabled?: boolean;
}

export default function BaseProductCard({ product, variant = 'customer', cartQty = 0, onCardClick, onActionPrimary, onActionSecondary, onActiveChange, activeUpdating = false, actionsDisabled = false, activeDisabled = false }: BaseProductCardProps) {
  const isStaff = variant === 'staff';
  const unavailable = product.isActive === false;
  return <article className={`product-card group ${isStaff ? 'product-card--staff' : ''} ${cartQty > 0 ? 'product-card--selected' : ''} ${isStaff && unavailable ? 'product-card--inactive' : ''}`}>
    <div className="product-card__image relative overflow-hidden bg-surface-container">
      <button type="button" onClick={() => onCardClick?.(product)} className="absolute inset-0 w-full" aria-label={`Xem chi tiết ${product.name}`}>
        <img src={product.imageUrl || PRODUCT_PLACEHOLDER} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={event => { if (!event.currentTarget.src.endsWith(PRODUCT_PLACEHOLDER)) event.currentTarget.src = PRODUCT_PLACEHOLDER; }} />
      </button>
      {product.badge && <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-surface-container-lowest/95 px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm">{product.badge}</span>}
      {isStaff && cartQty > 0 && <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-primary px-2 py-1 text-xs font-bold text-on-primary">×{cartQty}</span>}
    </div>
    <div className="product-card__body">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-secondary">{product.category}{product.origin ? ` · ${product.origin}` : ''}</p>
      <h3 className="product-card__name"><button type="button" onClick={() => onCardClick?.(product)} className="flex w-full items-start text-left hover:text-secondary"><span className="line-clamp-2">{product.name}</span></button></h3>
      <p className="product-card__description line-clamp-2">{product.description}</p>
      {isStaff && onActiveChange && <div className="product-card__availability">
        <span>{unavailable ? 'Ngừng bán' : 'Đang bán'}</span>
        <Switch size="small" checked={!unavailable} loading={activeUpdating} disabled={activeDisabled}
          aria-label={`Bật bán ${product.name}`} onChange={active => onActiveChange(product, active)} />
      </div>}
      <div className="product-card__footer">
        <span className="text-sm font-bold tabular-nums text-primary sm:text-base">{formatCurrency(product.price)}</span>
        <div className="flex shrink-0 gap-1">
          {isStaff && <button type="button" disabled={actionsDisabled || unavailable} className="ui-icon-button product-card__customize" aria-label={`Tùy chọn ${product.name}`} title="Chi tiết và tùy chọn" onClick={() => onActionSecondary?.(product)}><span aria-hidden="true" className="icon-slot text-lg"><Icon name="tune" /></span></button>}
          <button type="button" disabled={actionsDisabled || unavailable} onClick={() => onActionPrimary?.(product)} aria-label={`Thêm ${product.name} vào giỏ`} title={unavailable ? 'Món đang ngừng bán' : isStaff ? 'Thêm nhanh' : 'Thêm vào giỏ hàng'} className="ui-icon-button ui-icon-button--primary"><span aria-hidden="true" className="icon-slot text-xl"><Icon name="add" /></span></button>
        </div>
      </div>
    </div>
  </article>;
}
