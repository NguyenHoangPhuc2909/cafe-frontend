import React from 'react';

interface OptionGroupProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

const OptionGroup: React.FC<OptionGroupProps> = ({
  label, options, value, onChange,
}) => (
  <div role="group" aria-label={label}>
    <p className="font-label-caps text-xs font-semibold text-primary mb-2.5">
      {label}
    </p>
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={`inline-flex min-h-control items-center justify-center px-3.5 py-2 rounded-xl border text-sm font-label-caps font-semibold
            transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-95
            ${value === opt
              ? 'border-primary bg-primary-fixed text-primary ring-1 ring-primary'
              : 'border-control-border text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default OptionGroup;
