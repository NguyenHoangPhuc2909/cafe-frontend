import { useRef } from 'react';
import { Input, type InputRef } from 'antd';
import Icon from './Icon';

interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function SearchField({ label, value, onChange, onSearch, className = '', ...props }: SearchFieldProps) {
  const inputRef = useRef<InputRef>(null);
  return <Input {...props} ref={inputRef} type="search" aria-label={label} value={value}
    className={`ui-search-field ${className}`} prefix={<Icon name="search" />}
    onChange={event => onChange(event.target.value)} onPressEnter={() => onSearch?.(value)}
    suffix={value ? <button type="button" className="ui-search-clear" aria-label="Xóa tìm kiếm"
      onClick={() => { onChange(''); onSearch?.(''); inputRef.current?.focus(); }}><Icon name="close" /></button> : null} />;
}
