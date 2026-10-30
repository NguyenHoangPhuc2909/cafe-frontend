import React from 'react';

interface QuantityStepperProps {
  quantity: number;
  onChange: (newQty: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  disabled?: boolean;
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  label = 'Số lượng',
  disabled = false,
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && quantity > min) onChange(quantity - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && quantity < max) onChange(quantity + 1);
  };

  const sizeClasses = {
    sm: { btn: 'w-11 h-11 text-[16px]', text: 'w-8 text-[13px]' },
    md: { btn: 'w-11 h-11 text-[18px]', text: 'w-9 text-[16px]' },
    lg: { btn: 'w-12 h-12 text-[20px]', text: 'w-10 text-[18px]' },
  };

  return (
    <div role="group" aria-label={label} className="inline-flex shrink-0 items-center bg-surface-container border border-outline-variant/40
      rounded-xl overflow-hidden shadow-inner">
      <button
        onClick={handleDecrement}
        aria-label={`Giảm ${label.toLowerCase()}`}
        disabled={disabled || quantity <= min}
        className={`${sizeClasses[size].btn} flex items-center justify-center text-primary
          hover:bg-surface-container-high transition-colors active:scale-90 disabled:opacity-50
          disabled:active:scale-100 font-bold`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>remove</span>
      </button>

      <span className={`${sizeClasses[size].text} text-center font-label-caps font-bold text-primary tabular-nums`}>
        {quantity}
      </span>

      <button
        onClick={handleIncrement}
        aria-label={`Tăng ${label.toLowerCase()}`}
        disabled={disabled || quantity >= max}
        className={`${sizeClasses[size].btn} flex items-center justify-center text-primary
          hover:bg-surface-container-high transition-colors active:scale-90 disabled:opacity-50
          disabled:active:scale-100 font-bold`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>add</span>
      </button>
    </div>
  );
};

export default QuantityStepper;
