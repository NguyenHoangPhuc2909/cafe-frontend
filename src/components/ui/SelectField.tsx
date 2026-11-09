import type { ReactNode } from 'react';
import { Select } from 'antd';

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  prefix?: ReactNode;
  className?: string;
}

export default function SelectField<T extends string>({ label, className = '', ...props }: SelectFieldProps<T>) {
  return <Select<T>
    {...props}
    aria-label={label}
    className={`app-select ${className}`}
    classNames={{ popup: { root: 'app-select-popup' } }}
    style={{ height: 'var(--spacing-control)' }}
    showSearch={false}
    virtual={false}
    popupMatchSelectWidth
  />;
}
