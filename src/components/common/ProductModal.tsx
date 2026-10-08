import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/product';
import { formatCurrency } from '../../utils/format';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ICE_OPTIONS   = ['Bình thường', 'Ít đá', 'Không đá'];
const SUGAR_OPTIONS = ['100%', '70%', '50%', '0%'];

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedSize, setSelectedSize]   = useState<'M' | 'L'>('M');
  const [selectedIce, setSelectedIce]     = useState(ICE_OPTIONS[0]);
  const [selectedSugar, setSelectedSugar] = useState(SUGAR_OPTIONS[0]);
  const [qty, setQty]                     = useState(1);

  useEffect(() => {
    if (isOpen) {
      setSelectedSize('M');
      setSelectedIce(ICE_OPTIONS[0]);
      setSelectedSugar(SUGAR_OPTIONS[0]);
      setQty(1);
    }
  }, [isOpen, product]);

  // Prevent background scroll when modal open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const sizeExtra  = selectedSize === 'L' ? 10000 : 0;
  const finalPrice = (product.price + sizeExtra) * qty;

  const handleAdd = () => {
    const productWithOptions = {
      ...product,
      price: product.price + sizeExtra,
      options: `Size ${selectedSize}, ${selectedSugar} ngọt, ${selectedIce}`,
    };
    onAddToCart(productWithOptions);
    onClose();
  };

  const SelectGroup = ({
    label, options, value, onChange,
  }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <div>
      <h4 className="font-label-md font-bold text-primary mb-2.5 text-[13px] uppercase tracking-wide">{label}</h4>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-xl border-2 text-[12.5px] font-label-md font-semibold transition-all duration-150 active:scale-95
              ${value === opt
                ? 'border-primary bg-primary text-on-primary shadow-md'
                : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/50 hover:text-primary'
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-surface-container-lowest w-full md:max-w-3xl lg:max-w-4xl rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-zoom-in-95 max-h-[92dvh] md:max-h-[88vh]">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-surface-container/80 backdrop-blur hover:bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-all active:scale-90 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Left — Image */}
        <div className="md:w-[45%] shrink-0 h-56 md:h-auto relative bg-surface-container-low overflow-hidden">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {product.badge && (
            <span className="absolute top-4 left-4 bg-primary text-on-primary font-bold px-3 py-1 rounded-full text-[11px] font-label-sm shadow-md animate-badge-pop">
              {product.badge}
            </span>
          )}
          {product.origin && (
            <div className="absolute bottom-4 left-4 right-4">
              <span className="inline-flex items-center gap-1.5 bg-black/40 text-white/90 text-[11px] font-label-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                {product.origin}
              </span>
            </div>
          )}
        </div>

        {/* Right — Details */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scroll">
          <div className="p-6 md:p-7 flex flex-col flex-1">
            {/* Category */}
            <span className="text-secondary font-label-sm font-bold uppercase tracking-wider text-[11px]">
              {product.category}
            </span>

            {/* Name */}
            <h2 className="font-headline-md text-[26px] md:text-[28px] font-bold text-primary mt-1 mb-2 leading-tight">
              {product.name}
            </h2>

            {/* Description */}
            <p className="text-body-md text-on-surface-variant leading-relaxed mb-5 pb-5 border-b border-surface-container-high text-[13.5px]">
              {product.description}
            </p>

            {/* Options */}
            <div className="space-y-5 flex-1">
              <SelectGroup
                label="Chọn Size"
                options={['M', 'L']}
                value={selectedSize}
                onChange={(v) => setSelectedSize(v as 'M' | 'L')}
              />
              {selectedSize === 'L' && (
                <p className="text-[11px] text-secondary font-label-sm -mt-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">add_circle</span>
                  Size L thêm 10.000₫
                </p>
              )}
              <SelectGroup
                label="Lượng Đá"
                options={ICE_OPTIONS}
                value={selectedIce}
                onChange={setSelectedIce}
              />
              <SelectGroup
                label="Độ Ngọt"
                options={SUGAR_OPTIONS}
                value={selectedSugar}
                onChange={setSelectedSugar}
              />
            </div>

            {/* Footer CTA */}
            <div className="mt-6 pt-5 border-t border-surface-container-high flex items-center justify-between gap-4">
              {/* Qty stepper */}
              <div className="inline-flex items-center bg-surface-container border border-outline-variant/40 rounded-xl overflow-hidden shadow-inner">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="w-8 text-center font-label-lg font-bold text-primary text-[15px]">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              {/* Price + Add */}
              <button
                onClick={handleAdd}
                className="flex-1 flex items-center justify-between bg-primary hover:bg-primary-container text-on-primary px-5 py-3 rounded-xl font-label-lg font-bold transition-all active:scale-95 shadow-md group"
              >
                <span>Thêm vào giỏ</span>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold opacity-90">
                    {formatCurrency(finalPrice)}
                  </span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">add_shopping_cart</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
