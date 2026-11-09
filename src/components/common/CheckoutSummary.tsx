import type { OrderResponse } from '../../types/order';
import { formatCurrency } from '../../utils/format';
import { formatDrinkOptions } from '../../utils/drinkOptions';

export default function CheckoutSummary({
  order,
  embedded = false,
  showHeading = true,
}: {
  order: OrderResponse;
  embedded?: boolean;
  showHeading?: boolean;
}) {
  return (
    <section
      aria-label="Thông tin đơn hàng"
      className={embedded ? "summary-content" : "rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6"}
    >
      {showHeading && <><p className="text-xs font-semibold uppercase tracking-wider text-secondary">
        {order.tableName ?? 'Nhận món tại quầy'}
      </p>

      <h2 className="mt-2 text-lg font-bold text-primary">
        Đơn #{order.id}
      </h2></>}

      {order.orderType && <p className="mt-2 text-sm font-semibold text-secondary">
        {order.orderType === 'TAKEAWAY' ? 'Mang đi' : 'Tại quán'}
      </p>}
      {!order.tableName && <p className="mt-2 text-sm text-on-surface-variant">
        Nhận món theo mã đơn #{order.id}.
      </p>}

      <ul className={`${showHeading ? 'mt-5 ' : ''}space-y-4 text-sm`}>
        {order.items.map(item => (
          <li key={item.id} className="flex justify-between gap-4">
            <span className="min-w-0 break-words">
              {item.quantity} × {item.productName}
              {item.size && <span className="mt-1 block text-xs text-on-surface-variant">Size {item.size}</span>}
              {formatDrinkOptions(item) && <span className="mt-1 block text-xs text-on-surface-variant">{formatDrinkOptions(item)}</span>}
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
