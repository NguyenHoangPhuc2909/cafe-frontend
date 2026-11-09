import { Drawer } from 'antd';
import { useEffect, useState } from 'react';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { getStaffOrder, staffErrorMessage } from '../../services/staffApi';
import type { OrderResponse } from '../../types/order';
import StaffPaymentPanel from './StaffPaymentPanel';
import CompleteOrderButton from './CompleteOrderButton';
import CheckoutSummary from '../common/CheckoutSummary';

// Read by ID independently of the list's filter and current pagination.
export default function StaffOrderDrawer({ orderId, onClose, onChanged, readOnly = false }: {
  orderId: number;
  onClose: () => void;
  onChanged?: (message: string, success: boolean) => void;
  readOnly?: boolean;
}) {
  const { session } = useStaffAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const next = await getStaffOrder(session.accessToken, orderId, controller.signal);
        if (controller.signal.aborted) return;
        setOrder(next);
        setError(null);
      } catch (cause) {
        if (!controller.signal.aborted) setError(staffErrorMessage(cause));
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(() => void load(), 5000);
      }
    };
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [session, orderId, version]);

  const changed = (message: string, success: boolean) => {
    setNotice(message);
    setVersion(value => value + 1);
    onChanged?.(message, success);
  };

  return <Drawer open title={`Đơn #${orderId}`} onClose={onClose} size="large">
    {notice && <p role="status" className="mb-4 text-sm">{notice}</p>}
    {error && <p role="alert" className="mb-4 text-error">{error}</p>}
    {!order && !error && <p role="status">Đang tải đơn…</p>}
    {order && (readOnly ? <CheckoutSummary embedded order={order} /> : <>
      <StaffPaymentPanel key={order.id} order={order} onChanged={changed} />
      <CompleteOrderButton key={order.id} order={order} onChanged={changed} />
    </>)}
  </Drawer>;
}
