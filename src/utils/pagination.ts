export type PaginationItem = number | 'start-gap' | 'end-gap';

export function paginationItems(page: number, totalPages: number, compact = false): PaginationItem[] {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(total, Math.max(1, page + 1));
  const limit = compact ? 5 : 7;
  if (total <= limit) return Array.from({ length: total }, (_, index) => index + 1);

  const edge = compact ? 2 : 4;
  const edgeCount = compact ? 3 : 5;
  if (current <= edge) return [...Array.from({ length: edgeCount }, (_, index) => index + 1), 'end-gap', total];
  if (current > total - edge) return [1, 'start-gap', ...Array.from({ length: edgeCount }, (_, index) => total - edgeCount + index + 1)];
  return compact
    ? [1, 'start-gap', current, 'end-gap', total]
    : [1, 'start-gap', current - 1, current, current + 1, 'end-gap', total];
}
