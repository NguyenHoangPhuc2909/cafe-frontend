import Icon from './Icon';
import { paginationItems } from '../../utils/pagination';

interface PaginationProps {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, disabled = false, onPageChange }: PaginationProps) {
  const total = Math.max(1, totalPages);
  const buttonClass = 'pagination-button';
  const pages = (compact: boolean) => paginationItems(page, total, compact).map(item => typeof item === 'number'
    ? <button key={item} type="button" aria-label={`Trang ${item}`} aria-current={page === item - 1 ? 'page' : undefined} disabled={disabled} onClick={() => onPageChange(item - 1)} className={`${buttonClass} ${page === item - 1 ? '!border-secondary !bg-secondary !text-on-secondary' : 'text-on-surface-variant'}`}>{item}</button>
    : <span key={item} aria-hidden="true" className="pagination-gap">…</span>);

  return <nav aria-label="Phân trang đơn hàng" className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
    <button type="button" className={`${buttonClass} hidden sm:flex`} aria-label="Trang đầu" disabled={disabled || page <= 0} onClick={() => onPageChange(0)}><Icon name="first_page" /></button>
    <button type="button" className={buttonClass} aria-label="Trang trước" disabled={disabled || page <= 0} onClick={() => onPageChange(Math.min(page - 1, total - 1))}><Icon name="chevron_left" /></button>
    <span className="flex gap-1 sm:hidden">{pages(true)}</span>
    <span className="hidden gap-1.5 sm:flex">{pages(false)}</span>
    <button type="button" className={buttonClass} aria-label="Trang sau" disabled={disabled || page >= total - 1} onClick={() => onPageChange(page + 1)}><Icon name="chevron_right" /></button>
    <button type="button" className={`${buttonClass} hidden sm:flex`} aria-label="Trang cuối" disabled={disabled || page >= total - 1} onClick={() => onPageChange(total - 1)}><Icon name="last_page" /></button>
  </nav>;
}
