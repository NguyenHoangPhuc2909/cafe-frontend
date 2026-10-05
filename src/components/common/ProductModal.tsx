import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/product';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  // 👉 1. State lưu Size khách chọn (Mặc định là M)
  const [selectedSize, setSelectedSize] = useState<'M' | 'L'>('M');
  const [selectedIce, setSelectedIce] = useState<string>('Bình thường');

  // 👉 2. Mỗi khi bật bảng Modal của một món mới lên, tự động reset về Size M
  useEffect(() => {
    if (isOpen) {
      setSelectedSize('M');
      setSelectedIce('Bình thường');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // 👉 3. Tự động tính giá: Nếu Size L thì cộng 10k vào giá gốc
  const finalPrice = product.price + (selectedSize === 'L' ? 10000 : 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-surface-container-lowest w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/70 hover:bg-white rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Cột trái: Ảnh món ăn */}
        <div className="md:w-1/2 h-64 md:h-auto relative bg-surface-container-low">
           <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
           {product.badge && (
            <span className="absolute top-4 left-4 bg-primary-container text-on-primary font-bold px-3 py-1 rounded-full text-label-sm shadow-md">
              {product.badge}
            </span>
          )}
        </div>

        {/* Cột phải: Thông tin & Tùy chọn */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col max-h-[85vh] overflow-y-auto custom-scroll">
           <div className="mb-2">
             <span className="text-secondary font-label-sm font-bold uppercase tracking-wider">{product.category}</span>
           </div>
           <h2 className="text-3xl font-headline-md font-bold text-primary mb-3">{product.name}</h2>
           
           <p className="text-body-md text-on-surface-variant mb-6 pb-6 border-b border-surface-container-high leading-relaxed">
             {product.description}
           </p>
           
           {/* Form Tùy chọn */}
           <div className="space-y-6 mb-8 flex-1">
             
             {/* 👉 4. Khu vực chọn Size */}
             <div>
               <h4 className="font-label-md font-bold text-primary mb-3">Chọn Size</h4>
               <div className="flex gap-3">
                 <button 
                    onClick={() => setSelectedSize('M')}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-bold transition-all ${
                      selectedSize === 'M' 
                        ? 'border-primary bg-primary-container/10 text-primary' 
                        : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/50'
                    }`}
                  >
                    Size M
                  </button>
                 <button 
                    onClick={() => setSelectedSize('L')}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-bold transition-all ${
                      selectedSize === 'L' 
                        ? 'border-primary bg-primary-container/10 text-primary' 
                        : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/50'
                    }`}
                  >
                    Size L
                  </button>
               </div>
             </div>

             {/* Khu vực chọn Đá */}
             <div>
               <h4 className="font-label-md font-bold text-primary mb-3">Lượng Đá</h4>
               <div className="flex gap-3">
                 {['Bình thường', 'Ít đá', 'Không đá'].map(ice => (
                   <button 
                      key={ice}
                      onClick={() => setSelectedIce(ice)}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold transition-all ${
                        selectedIce === ice 
                          ? 'border-primary bg-primary-container/10 text-primary' 
                          : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/50'
                      }`}
                    >
                      {ice}
                    </button>
                 ))}
               </div>
             </div>
           </div>

           {/* Nút Thêm vào giỏ & 👉 In ra Giá đã tính toán lại */}
           <div className="flex items-center justify-between pt-5 mt-auto border-t border-surface-container-high bg-surface-container-lowest sticky bottom-0">
              <span className="text-2xl font-headline-md font-bold text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice)}
              </span>
              <button 
                onClick={() => { 
                  // Gửi thêm thông tin options vào hàm AddToCart
                  const productWithOptions = { ...product, price: finalPrice, options: `Size ${selectedSize}, ${selectedIce}` };
                  onAddToCart(productWithOptions); 
                  onClose(); 
                }}
                className="bg-primary hover:bg-primary-container text-on-primary px-6 py-3.5 rounded-full font-label-lg font-bold flex items-center space-x-2 transition-transform active:scale-95 shadow-md"
              >
                <span className="material-symbols-outlined">add_shopping_cart</span>
                <span>Thêm vào giỏ</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
export default ProductModal;
