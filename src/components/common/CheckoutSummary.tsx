import type { CheckoutOrder } from '../../utils/checkout';
import { formatCurrency } from '../../utils/format';

export default function CheckoutSummary({ order }: { order: CheckoutOrder }) {
  return <section aria-label="Thông tin đơn hàng" className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{order.tableName}</p>
    <h2 className="mt-2 break-words text-lg font-bold text-primary">Đơn {order.code}</h2>
    <ul className="mt-5 space-y-4 text-sm">{order.items.map(item => <li key={item.id} className="flex justify-between gap-4">
      <span className="min-w-0 break-words">{item.quantity} × {item.name}</span>
      <span className="shrink-0 font-semibold text-primary">{formatCurrency(item.price * item.quantity)}</span>
    </li>)}</ul>
    {order.note && <p className="mt-5 break-words rounded-xl bg-surface-container-low p-3 text-sm"><strong>Ghi chú:</strong> {order.note}</p>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-5 text-primary">
      <span className="font-semibold">Tổng tiền</span><strong className="text-2xl">{formatCurrency(order.total)}</strong>
    </div>
  </section>;
}
