import type { OrderResponse } from '../../types/order';
import { formatCurrency } from '../../utils/format';

export default function CheckoutSummary({
  order,
}: {
  order: OrderResponse;
}) {
  return (
    <section
      aria-label="Thông tin đơn hàng"
      className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
        {order.tableName ?? 'Không gắn bàn'}
      </p>

      <h2 className="mt-2 text-lg font-bold text-primary">
        Đơn #{order.id}
      </h2>

      <ul className="mt-5 space-y-4 text-sm">
        {order.items.map(item => (
          <li key={item.id} className="flex justify-between gap-4">
            <span className="min-w-0 break-words">
              {item.quantity} × {item.productName}
            </span>
            <span className="shrink-0 font-semibold text-primary">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-5 text-primary">
        <span className="font-semibold">Tổng tiền</span>
        <strong className="text-2xl">
          {formatCurrency(order.totalAmount)}
        </strong>
      </div>
    </section>
  );
}