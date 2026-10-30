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
  <div>
    <h4 className="font-label-caps text-[11px] font-bold text-primary mb-2.5 tracking-wide uppercase">
      {label}
    </h4>
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3.5 py-1.5 rounded-xl border-2 text-[12px] font-label-caps font-semibold
            transition-all duration-150 active:scale-95
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

export default OptionGroup;
