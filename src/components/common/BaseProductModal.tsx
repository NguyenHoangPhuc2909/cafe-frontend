import { useEffect, useRef, useState } from 'react';
import type { Product } from '../../types/product';
import { formatCurrency } from '../../utils/format';
import { PRODUCT_PLACEHOLDER } from '../../utils/products';
import OptionGroup from '../ui/OptionGroup';
import QuantityStepper from '../ui/QuantityStepper';

interface BaseProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, optionsStr: string, qty: number) => void;
  variant?: 'customer' | 'staff';
}

function ProductModalContent({ product, onClose, onConfirm, variant = 'customer' }:
  BaseProductModalProps & { product: Product }) {
  const [size, setSize] = useState('M');
  const [ice, setIce] = useState('Ít đá');
  const [sugar, setSugar] = useState('70%');
  const [note, setNote] = useState('');
  const [qty, setQty] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);
  const isStaff = variant === 'staff';
  const unitPrice = product.price + (isStaff && size === 'L' ? 10000 : 0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, textarea, select, a[href]');
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  const handleConfirm = () => {
    const options = isStaff
      ? [`Size ${size}`, ice, `${sugar} ngọt`, note.trim() ? `Ghi chú: ${note.trim()}` : ''].filter(Boolean).join(' · ')
      : '';
    onConfirm({ ...product, price: unitPrice }, options, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:items-center md:p-6">
      <div aria-hidden="true" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="product-modal-title" tabIndex={-1}
        className="relative flex max-h-[calc(100dvh-1rem)] w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl outline-none md:max-h-[90dvh] md:max-w-3xl md:flex-row">
        <button onClick={onClose} aria-label="Đóng chi tiết món" className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/40 bg-surface/95 text-primary shadow-sm hover:bg-surface-container">
          <span aria-hidden="true" className="material-symbols-outlined text-xl">close</span>
        </button>
        <div className="relative h-36 shrink-0 bg-surface-container sm:h-44 md:h-auto md:w-[42%]">
          <img src={product.imageUrl || PRODUCT_PLACEHOLDER} alt={product.name}
            onError={event => { if (!event.currentTarget.src.endsWith(PRODUCT_PLACEHOLDER)) event.currentTarget.src = PRODUCT_PLACEHOLDER; }}
            className="h-full w-full object-cover" />
          {product.badge && <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary">{product.badge}</span>}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">{product.category}</p>
              <h2 id="product-modal-title" className="break-words font-headline-md text-xl font-bold leading-snug text-primary sm:text-2xl">{product.name}</h2>
              {product.description && <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{product.description}</p>}
              <p className="mt-4 font-headline-md text-xl font-bold text-primary">{formatCurrency(unitPrice)}</p>
            </div>
            {isStaff && <div className="space-y-5 border-t border-outline-variant/30 pt-5">
              <OptionGroup label="Chọn size" options={['M', 'L']} value={size} onChange={setSize} />
              {size === 'L' && <p className="text-xs text-secondary">Size L thêm {formatCurrency(10000)}</p>}
              <OptionGroup label="Lượng đá" options={['Nhiều đá', 'Ít đá', 'Không đá']} value={ice} onChange={setIce} />
              <OptionGroup label="Độ ngọt" options={['100%', '70%', '50%', 'Không đường']} value={sugar} onChange={setSugar} />
              <div>
                <label htmlFor="staff-product-note" className="mb-2 block text-xs font-bold uppercase text-primary">Ghi chú cho barista</label>
                <input id="staff-product-note" value={note} onChange={event => setNote(event.target.value)} placeholder="VD: ít sữa, để riêng đá…" className="min-h-11 w-full rounded-xl border border-outline-variant/40 bg-surface p-3 text-base outline-none focus:border-primary" />
              </div>
            </div>}
          </div>
          <div className="shrink-0 space-y-3 border-t border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-primary">Số lượng</span><QuantityStepper quantity={qty} onChange={setQty} size="md" /></div>
            <button onClick={handleConfirm} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary transition-colors hover:bg-primary-container">
              <span>{isStaff ? 'Thêm vào đơn' : 'Thêm vào giỏ'}</span>
              <span className="flex shrink-0 items-center gap-2">{formatCurrency(unitPrice * qty)}<span aria-hidden="true" className="material-symbols-outlined text-xl">add_shopping_cart</span></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BaseProductModal(props: BaseProductModalProps) {
  if (!props.isOpen || !props.product) return null;
  return <ProductModalContent key={`${props.variant ?? 'customer'}:${props.product.id}`} {...props} product={props.product} />;
}
