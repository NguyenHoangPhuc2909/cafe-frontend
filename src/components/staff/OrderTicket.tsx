import Icon from '../ui/Icon';
import React from 'react';
import { formatDrinkOptions } from '../../utils/drinkOptions';
import type { CartItem } from '../../types/cart';
import type { OrderMode } from '../../types/staff';
import { formatCurrency } from '../../utils/format';
import QuantityStepper from '../ui/QuantityStepper';

interface OrderTicketProps {
  cart:        CartItem[];
  orderMode:   OrderMode;
  subtotal:    number;
  total:       number;
  itemCount:   number;
  onSetMode:   (mode: OrderMode) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove:    (id: string) => void;
  onClear:     () => void;
  onCheckout:  () => void;
  checkoutDisabled?: boolean;
}

const OrderTicket: React.FC<OrderTicketProps> = ({
  cart, orderMode,
  subtotal, total, itemCount,
  onSetMode, onUpdateQty, onRemove, onClear, onCheckout, checkoutDisabled = false,
}) => {
  const nowStr = (() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  })();

  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-outline-variant/40 bg-surface shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-label-caps text-primary font-bold tracking-widest mb-0.5">
              Phiếu tạm
            </p>
            <h2 className="font-headline-sm text-[20px] font-bold text-on-surface leading-tight">
              Đơn mới
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-body-sm text-on-surface-variant">{nowStr}</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-label-caps font-bold ${
              cart.length === 0
                ? 'bg-surface-container text-on-surface-variant'
                : 'bg-tertiary-fixed text-on-tertiary-fixed'
            }`}>
              {cart.length === 0 ? 'Chưa có món' : 'Chưa tạo đơn'}
            </span>
          </div>
        </div>

        {/* Order type + table */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-48 flex-1 flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-outline-variant/30">
            {(['dinein', 'takeaway'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => onSetMode(mode)}
                aria-pressed={orderMode === mode}
                className={`flex-1 flex items-center justify-center gap-1.5 min-h-control py-2 rounded-lg
                  text-[11px] font-label-caps font-semibold transition-all duration-200
                  ${orderMode === mode
                    ? 'bg-surface shadow-sm text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span aria-hidden="true" className="icon-slot text-[14px]"
                  ><Icon name={mode === 'dinein' ? 'restaurant' : 'shopping_bag'} /></span>
                {mode === 'dinein' ? 'Tại quán' : 'Mang đi'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary-fixed
            border border-outline-variant/40">
            <span aria-hidden="true" className="icon-slot text-secondary text-[16px]"
              ><Icon name="table_restaurant" /></span>
            <div className="leading-none">
              <p className="text-[8px] font-label-caps text-on-surface-variant">Vị trí</p>
              <p className="text-[13px] font-bold text-on-surface">
                {orderMode === 'dinein' ? 'Chưa chọn bàn' : 'Quầy nhận'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cart Items ───────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-surface-container-lowest custom-scroll">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
              <span aria-hidden="true" className="icon-slot text-[32px] text-outline opacity-40"><Icon name="receipt_long" /></span>
            </div>
            <p className="font-label-caps text-[11px] text-on-surface-variant tracking-wider">
              Chưa có món nào
            </p>
            <p className="text-[11px] font-body-sm text-outline">
              Chọn món từ thực đơn bên trái
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id}
              className="bg-surface rounded-xl border border-surface-container-high p-3 flex flex-col gap-2 shadow-sm">
              {/* Item info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-body-md font-semibold text-[13px] text-on-surface line-clamp-1 leading-snug">
                    {item.name}
                  </p>
                  {item.size && <p className="mt-1 text-xs text-secondary">Size {item.size}</p>}
                  {formatDrinkOptions(item) && <p className="mt-1 text-xs text-secondary">{formatDrinkOptions(item)}</p>}
                  {item.isAvailable === false && <p className="mt-1 text-xs font-semibold text-error">Món đã ngừng bán. Vui lòng xóa khỏi phiếu.</p>}
                </div>
                <span className="font-body-md font-bold text-[13px] text-on-surface shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>

              {/* Qty stepper + delete */}
              <div className="flex items-center justify-between">
                <QuantityStepper
                  quantity={item.quantity}
                  disabled={item.isAvailable === false}
                  onChange={(newQty) => onUpdateQty(item.id, newQty - item.quantity)}
                  size="sm"
                />

                <button
                  className="inline-flex min-h-control items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-on-surface-variant
                    hover:text-error hover:bg-error-container/30 text-[10px] font-label-caps transition-colors"
                  onClick={() => onRemove(item.id)}
                >
                  <span aria-hidden="true" className="icon-slot text-[13px]"><Icon name="delete" /></span>
                  Xoá
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Summary Footer ───────────────────── */}
      <div className="px-4 pt-3 pb-4 bg-surface border-t border-outline-variant/30 space-y-3 shrink-0">
        {/* Line items */}
        <div className="space-y-1.5 text-[12px] font-body-sm">
          <div className="flex justify-between text-on-surface-variant">
            <span>Tạm tính ({itemCount} món)</span>
            <span className="text-on-surface font-semibold">{formatCurrency(subtotal)}</span>
          </div>
        </div>

        {/* Total — gradient block like CustomerMenu hero */}
        <div className="rounded-xl bg-surface-container-low border border-outline-variant/50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-label-caps text-on-surface-variant">
              Tổng thanh toán
            </p>
          </div>
          <div className="font-headline-md text-[24px] font-bold text-primary tracking-tight tabular-nums">
            {formatCurrency(total)}
          </div>
        </div>

        {/* Secondary actions */}
        <div>
          <button
            onClick={onClear}
            className="min-h-control w-full rounded-xl border border-error/30 bg-error-container/20
              font-label-caps text-[11px] font-semibold text-error
              flex items-center justify-center gap-1.5
              hover:bg-error hover:text-on-error active:scale-95 transition-all">
            <span aria-hidden="true" className="icon-slot text-[14px]"><Icon name="cancel" /></span>
            Xóa món đang chọn
          </button>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || checkoutDisabled || cart.some(item => item.isAvailable === false)}
          className="ui-button ui-button--primary min-h-control w-full"
        >
          <span>Thanh toán</span>
          <span aria-hidden="true" className="icon-slot text-[22px]"
            ><Icon name="payments" /></span>
        </button>
      </div>
    </>
  );
};

export default OrderTicket;
